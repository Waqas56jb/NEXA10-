export function normalizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    balance: parseFloat(u.balance || 0),
    depositTotal: parseFloat(u.deposit_total ?? u.depositTotal ?? 0),
    earningsTotal: parseFloat(u.earnings_total ?? u.earningsTotal ?? 0),
    blocked: Boolean(u.blocked),
    earningActive: Boolean(u.earning_active ?? u.earningActive),
    refCode: u.ref_code ?? u.refCode,
    createdAt: u.created_at ? new Date(u.created_at).getTime() : u.createdAt ?? Date.now(),
  };
}

export function normalizeNotification(n) {
  return {
    id: n.id,
    text: n.text,
    active: n.active ?? true,
    createdAt: n.created_at ? new Date(n.created_at).getTime() : n.createdAt,
  };
}

export function normalizeDeposit(d) {
  return {
    id: d.id,
    userId: d.user_id ?? d.userId,
    exchange: d.exchange,
    network: d.network,
    email: d.email,
    username: d.username,
    amount: parseFloat(d.amount),
    approvedAmount: d.approved_amount != null ? parseFloat(d.approved_amount) : null,
    screenshot: d.screenshot_url ?? d.screenshot,
    status: d.status,
    createdAt: d.created_at ? new Date(d.created_at).getTime() : d.createdAt,
  };
}

export function normalizeTransfer(t) {
  return {
    id: t.id,
    type: t.type,
    amount: parseFloat(t.amount),
    note: t.note,
    source: t.source,
    createdAt: t.created_at ? new Date(t.created_at).getTime() : t.createdAt,
  };
}
