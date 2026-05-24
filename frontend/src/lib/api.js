const PROD_API_URL = 'https://nexa-10-backend.vercel.app';

function resolveApiUrl() {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Local dev → empty string → Vite proxy handles /api → localhost:5000
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return '';
    // Anything else (production hostname) → hit the real backend
    return PROD_API_URL;
  }
  return PROD_API_URL;
}

const API_URL = resolveApiUrl();

export function isApiEnabled() {
  return import.meta.env.VITE_USE_LOCAL_STORAGE !== 'true';
}

export function getUserToken() {
  return localStorage.getItem('nexa10_user_token');
}

export function setUserToken(token) {
  if (token) localStorage.setItem('nexa10_user_token', token);
  else localStorage.removeItem('nexa10_user_token');
}

async function request(path, options = {}, auth = false) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (auth) {
    const token = getUserToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

export const userApi = {
  register: (email, username, password) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, username, password }) }),

  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request('/api/auth/me', {}, true),

  submitDeposit: (payload) =>
    request('/api/deposits', { method: 'POST', body: JSON.stringify(payload) }, true),

  myDeposits: () => request('/api/deposits/mine', {}, true),
  myTransfers: () => request('/api/transfers/mine', {}, true),
  getNotifications: () => request('/api/notifications'),
  setEarning: (active) =>
    request('/api/auth/me/earning', { method: 'PATCH', body: JSON.stringify({ active }) }, true),
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
