export function normalizeUser(u) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    balance: parseFloat(u.balance || 0),
    depositTotal: parseFloat(u.deposit_total ?? 0),
    earningsTotal: parseFloat(u.earnings_total ?? 0),
    blocked: Boolean(u.blocked),
    createdAt: new Date(u.created_at).getTime(),
  };
}

export function normalizeDeposit(d) {
  return {
    id: d.id,
    userId: d.user_id ?? null,
    exchange: d.exchange,
    network: d.network,
    email: d.email,
    username: d.username,
    amount: parseFloat(d.amount),
    approvedAmount: d.approved_amount != null ? parseFloat(d.approved_amount) : null,
    // List responses omit the base64 screenshot; it is loaded on demand.
    screenshot: d.screenshot_url ?? null,
    hasScreenshot: d.has_screenshot ?? Boolean(d.screenshot_url),
    status: d.status,
    adminNote: d.admin_note ?? null,
    createdAt: new Date(d.created_at).getTime(),
  };
}

export function normalizeNotification(n) {
  return {
    id: n.id,
    text: n.text,
    active: n.active,
    createdAt: new Date(n.created_at).getTime(),
  };
}

export function normalizeTransfer(t) {
  return {
    id: t.id,
    type: t.type,
    amount: parseFloat(t.amount),
    note: t.note,
    createdAt: new Date(t.created_at).getTime(),
  };
}

export function normalizeWithdrawal(w) {
  return {
    id: w.id,
    userId: w.user_id,
    userEmail: w.user_email,
    userUsername: w.user_username,
    amount: parseFloat(w.amount),
    accountHolderName: w.account_holder_name,
    accountNumber: w.account_number,
    bankName: w.bank_name,
    status: w.status,
    adminNote: w.admin_note,
    createdAt: new Date(w.created_at).getTime(),
    reviewedAt: w.reviewed_at ? new Date(w.reviewed_at).getTime() : null,
  };
}
