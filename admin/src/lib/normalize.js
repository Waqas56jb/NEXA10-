export function normalizeUser(u) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    balance: parseFloat(u.balance || 0),
    depositTotal: parseFloat(u.deposit_total ?? 0),
    blocked: Boolean(u.blocked),
    createdAt: new Date(u.created_at).getTime(),
  };
}

export function normalizeDeposit(d) {
  return {
    id: d.id,
    exchange: d.exchange,
    network: d.network,
    email: d.email,
    username: d.username,
    amount: parseFloat(d.amount),
    approvedAmount: d.approved_amount != null ? parseFloat(d.approved_amount) : null,
    screenshot: d.screenshot_url,
    status: d.status,
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
