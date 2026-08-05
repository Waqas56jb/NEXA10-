const PROD_API_URL = 'https://nexa-10-backend.vercel.app';

function resolveApiUrl() {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return '';
    return PROD_API_URL;
  }
  return PROD_API_URL;
}

const API_URL = resolveApiUrl();

export function getAdminToken() {
  return localStorage.getItem('nexa10_admin_token');
}

export function setAdminToken(token) {
  if (token) localStorage.setItem('nexa10_admin_token', token);
  else localStorage.removeItem('nexa10_admin_token');
}

// Reads the `exp` claim without verifying the signature. The server still does
// the real check — this only stops the panel from sitting on a token it already
// knows is dead, which previously showed as an endless loading screen.
export function isAdminTokenValid() {
  const token = getAdminToken();
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export const SESSION_EXPIRED_EVENT = 'nexa10:admin-session-expired';
export const SESSION_EXPIRED_MESSAGE = 'Session expired — please sign in again';

function endSession() {
  setAdminToken(null);
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

const REQUEST_TIMEOUT_MS = 20000;

async function request(path, options = {}, auth = true) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (auth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out — the server is not responding');
    throw new Error('Network error — could not reach the server');
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => ({}));

  if (auth && res.status === 401) {
    endSession();
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

export const adminApi = {
  login: (email, password) =>
    request('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false),

  me: () => request('/api/admin/auth/me'),

  forgotPassword: (email) =>
    request('/api/admin/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }, false),

  resetPassword: (token, password) =>
    request('/api/admin/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }, false),

  stats: () => request('/api/stats'),

  overview: () => request('/api/admin/overview', { timeout: 30000 }),

  getUsers: () => request('/api/admin/users'),
  getUser: (id) => request(`/api/admin/users/${id}`),
  blockUser: (id, blocked) =>
    request(`/api/admin/users/${id}/block`, { method: 'PATCH', body: JSON.stringify({ blocked }) }),
  deleteUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  addFunds: (id, type, amount, note) =>
    request(`/api/admin/users/${id}/funds`, { method: 'POST', body: JSON.stringify({ type, amount, note }) }),

  getDeposits: (status = 'all') =>
    request(`/api/deposits/admin/all${status !== 'all' ? `?status=${status}` : ''}`),
  approveDeposit: (id, approved_amount) =>
    request(`/api/deposits/admin/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approved_amount }) }),
  rejectDeposit: (id, admin_note) =>
    request(`/api/deposits/admin/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ admin_note }) }),
  getDepositScreenshot: (id) => request(`/api/deposits/admin/${id}/screenshot`, { timeout: 30000 }),

  getWithdrawals: (status = 'all') =>
    request(`/api/withdrawals/admin/all${status !== 'all' ? `?status=${status}` : ''}`),
  approveWithdrawal: (id, admin_note) =>
    request(`/api/withdrawals/admin/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ admin_note }) }),
  rejectWithdrawal: (id, admin_note) =>
    request(`/api/withdrawals/admin/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ admin_note }) }),

  // ── Support ──
  getSupportCases: (status = 'all') =>
    request(`/api/support/admin/cases${status !== 'all' ? `?status=${status}` : ''}`),
  getSupportCase: (id) => request(`/api/support/admin/cases/${id}`),
  sendSupportMessage: (id, payload) =>
    request(`/api/support/admin/cases/${id}/messages`, { method: 'POST', body: JSON.stringify(payload) }),
  closeSupportCase: (id, close_note) =>
    request(`/api/support/admin/cases/${id}/close`, { method: 'PATCH', body: JSON.stringify({ close_note }) }),

  getNotifications: () => request('/api/notifications/admin/all'),
  createNotification: (text) =>
    request('/api/notifications/admin', { method: 'POST', body: JSON.stringify({ text }) }),
  toggleNotification: (id, active) =>
    request(`/api/notifications/admin/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  deleteNotification: (id) => request(`/api/notifications/admin/${id}`, { method: 'DELETE' }),
};

export function formatTimeAgo(ts) {
  const time = typeof ts === 'string' ? new Date(ts).getTime() : ts;
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(time).toLocaleDateString();
}
