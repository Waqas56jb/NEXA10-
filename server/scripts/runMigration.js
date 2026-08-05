#!/usr/bin/env node
// One-shot migration runner.
// Usage:
//   SUPABASE_DB_PASSWORD=<pwd> node scripts/runMigration.js <path-to-sql-file>
//
// Tries to reach Supabase Postgres via:
//   1. A configured SUPABASE_DB_URL (if set)
//   2. The IPv4 session pooler `aws-0-<region>.pooler.supabase.com:5432` —
//      iterates common AWS regions until auth succeeds
//   3. The IPv6 direct connection db.<ref>.supabase.co:5432 (fallback)
//
// The password is never written to disk. It's only read from env var and
// held in memory for the duration of the process.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));

const sqlArg = process.argv[2];
if (!sqlArg) {
  console.error('Usage: node scripts/runMigration.js <path-to-sql>');
  process.exit(1);
}
const sqlPath = path.resolve(here, '..', sqlArg.replace(/^server[\\/]/, ''));
if (!fs.existsSync(sqlPath)) {
  console.error(`SQL file not found: ${sqlPath}`);
  process.exit(1);
}

if (!process.env.SUPABASE_URL) {
  console.error('SUPABASE_URL missing in server/.env');
  process.exit(1);
}
const ref = new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error('SUPABASE_DB_PASSWORD env var required');
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

const POOLER_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-central-1', 'eu-west-1', 'eu-west-2',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'sa-east-1', 'ca-central-1',
];

function buildConnections() {
  const list = [];
  if (process.env.SUPABASE_DB_URL) {
    list.push({ label: 'env SUPABASE_DB_URL', connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  }
  // Session pooler per region — IPv4-friendly, supports DDL
  for (const region of POOLER_REGIONS) {
    list.push({
      label: `pooler ${region}`,
      host: `aws-0-${region}.pooler.supabase.com`,
      port: 5432,
      database: 'postgres',
      user: `postgres.${ref}`,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30_000,
      query_timeout: 30_000,
      statement_timeout: 30_000,
    });
  }
  // Direct (IPv6-only on newer projects)
  list.push({
    label: 'direct db.<ref>',
    host: `db.${ref}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 6_000,
  });
  return list;
}

const isAuthFail = (msg) =>
  /password authentication failed|tenant or user not found|invalid password/i.test(msg || '');
const isNetwork = (msg) =>
  /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ENETUNREACH|connect timeout/i.test(msg || '');

async function tryRun(cfg) {
  const client = new pg.Client(cfg);
  try {
    await client.connect();
  } catch (err) {
    return { ok: false, transport: true, message: err.message };
  }
  try {
    const start = Date.now();
    const result = await client.query(sql);
    const dur = Date.now() - start;
    return { ok: true, result, dur };
  } catch (err) {
    return { ok: false, transport: false, message: err.message };
  } finally {
    await client.end().catch(() => {});
  }
}

const connections = buildConnections();
console.log(`▸ Will try ${connections.length} connection(s) until one succeeds.`);
let success = null;
for (const cfg of connections) {
  process.stdout.write(`  · ${cfg.label} … `);
  const r = await tryRun(cfg);
  if (r.ok) {
    console.log('OK');
    success = { ...r, label: cfg.label };
    break;
  }
  if (isAuthFail(r.message)) {
    console.log(`auth failed — trying next region`);
    continue;
  }
  if (isNetwork(r.message)) {
    console.log(`network unreachable`);
    continue;
  }
  // Any other error from the query itself is a real migration failure
  console.log(`SQL error: ${r.message}`);
  process.exit(1);
}

if (!success) {
  console.error('✗ All connection attempts failed (auth or network).');
  process.exit(1);
}

const { result, dur, label } = success;
if (Array.isArray(result)) {
  result.forEach((r, i) => {
    console.log(`    stmt ${i + 1}: ${r.command || 'OK'}${typeof r.rowCount === 'number' ? ` (${r.rowCount} rows)` : ''}`);
  });
} else {
  console.log(`    ${result.command || 'OK'}${typeof result.rowCount === 'number' ? ` (${result.rowCount} rows)` : ''}`);
}
console.log(`✓ ${path.basename(sqlPath)} applied via ${label} in ${dur} ms`);
