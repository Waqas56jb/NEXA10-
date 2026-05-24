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

async function request(path, options = {}, auth = true) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (auth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
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
