const STORE_KEY = 'nexa10_store';
const CURRENT_USER_KEY = 'nexa10_current_user';
const EARNING_KEY = 'nexa10_earning';
const STORAGE_EVENT = 'nexa10:storage';

const DEFAULT_STORE = {
  version: 1,
  users: [],
  deposits: [],
  fundTransfers: [],
  notifications: [
    { id: 'n1', text: 'Welcome to NEXA10 — your AI trading dashboard is ready.', createdAt: Date.now() - 86400000, active: true },
    { id: 'n2', text: 'Deposit via Binance or MEXC to fund your account. Admin will verify within 24 hours.', createdAt: Date.now() - 3600000, active: true },
  ],
  settings: {
    adminPassword: 'admin123',
    refLink: 'https://www.nexa10.net/register?ref=81ibdsh3zc',
  },
  adminSession: null,
};

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function emitChange() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}

export function getStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(DEFAULT_STORE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STORE), ...parsed };
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

export function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  emitChange();
}

export function initStore() {
  if (!localStorage.getItem(STORE_KEY)) {
    saveStore(structuredClone(DEFAULT_STORE));
  }
}

export function getCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUserId(id) {
  if (id) localStorage.setItem(CURRENT_USER_KEY, id);
  else localStorage.removeItem(CURRENT_USER_KEY);
  emitChange();
}

export function getCurrentUser() {
  const id = getCurrentUserId();
  if (!id) return null;
  return getStore().users.find((u) => u.id === id) || null;
}

export function isEarningActive() {
  return localStorage.getItem(EARNING_KEY) === '1';
}

export function setEarningActive(active) {
  localStorage.setItem(EARNING_KEY, active ? '1' : '0');
  emitChange();
}

export function getUsers() {
  return getStore().users;
}

export function getUserById(id) {
  return getStore().users.find((u) => u.id === id) || null;
}

export function getUserByEmail(email) {
  const norm = email.trim().toLowerCase();
  return getStore().users.find((u) => u.email.toLowerCase() === norm) || null;
}

export function createUser({ email, username, password }) {
  const store = getStore();
  const user = {
    id: uid('user'),
    email: email.trim().toLowerCase(),
    username: username || email.split('@')[0],
    password,
    balance: 0,
    depositTotal: 0,
    earningsTotal: 0,
    blocked: false,
    createdAt: Date.now(),
    refCode: Math.random().toString(36).slice(2, 10),
  };
  store.users.push(user);
  saveStore(store);
  return user;
}

export function updateUser(id, patch) {
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  store.users[idx] = { ...store.users[idx], ...patch };
  saveStore(store);
  return store.users[idx];
}

export function deleteUser(id) {
  const store = getStore();
  store.users = store.users.filter((u) => u.id !== id);
  store.deposits = store.deposits.filter((d) => d.userId !== id);
  store.fundTransfers = store.fundTransfers.filter((f) => f.userId !== id);
  saveStore(store);
}

export function blockUser(id, blocked = true) {
  return updateUser(id, { blocked });
}

export function loginUser(email, password) {
  const user = getUserByEmail(email);
  if (!user || user.password !== password) return null;
  if (user.blocked) return { error: 'blocked' };
  setCurrentUserId(user.id);
  return user;
}

export function signupUser({ email, username, password }) {
  if (getUserByEmail(email)) return { error: 'exists' };
  const user = createUser({ email, username, password });
  setCurrentUserId(user.id);
  return user;
}

export function getDeposits(filter = {}) {
  let list = getStore().deposits;
  if (filter.status) list = list.filter((d) => d.status === filter.status);
  if (filter.userId) list = list.filter((d) => d.userId === filter.userId);
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export function addDeposit(data) {
  const store = getStore();
  let userId = getCurrentUserId();
  if (!userId) {
    const existing = store.users.find(
      (u) => u.email === data.email?.toLowerCase() || u.username === data.username
    );
    userId = existing?.id || null;
  }
  const deposit = {
    id: uid('dep'),
    userId,
    exchange: data.exchange,
    network: data.network,
    email: data.email,
    username: data.username,
    amount: parseFloat(data.amount) || 0,
    screenshot: data.screenshot || null,
    status: 'pending',
    createdAt: Date.now(),
    reviewedAt: null,
  };
  store.deposits.unshift(deposit);
  saveStore(store);
  return deposit;
}

export function updateDepositStatus(id, status) {
  const store = getStore();
  const dep = store.deposits.find((d) => d.id === id);
  if (!dep) return null;
  dep.status = status;
  dep.reviewedAt = Date.now();

  if (status === 'approved') {
    let user = dep.userId ? store.users.find((u) => u.id === dep.userId) : null;
    if (!user) {
      user = store.users.find(
        (u) => u.email === dep.email?.toLowerCase() || u.username === dep.username
      );
      if (user) dep.userId = user.id;
    }
    if (user) {
      user.balance = (user.balance || 0) + dep.amount;
      user.depositTotal = (user.depositTotal || 0) + dep.amount;
      store.fundTransfers.unshift({
        id: uid('ft'),
        userId: user.id,
        type: 'incoming',
        amount: dep.amount,
        note: `Deposit approved (${dep.exchange} ${dep.network})`,
        createdAt: Date.now(),
        source: 'deposit',
        depositId: dep.id,
      });
    }
  }
  saveStore(store);
  return dep;
}

export function rejectDeposit(id) {
  return updateDepositStatus(id, 'rejected');
}

export function approveDeposit(id) {
  return updateDepositStatus(id, 'approved');
}

export function getFundTransfers(userId) {
  return getStore()
    .fundTransfers.filter((f) => f.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function addFundTransfer(userId, type, amount, note = '') {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  const amt = parseFloat(amount) || 0;
  if (amt <= 0) return null;

  if (type === 'outgoing' && user.balance < amt) return { error: 'insufficient' };

  if (type === 'incoming') user.balance = (user.balance || 0) + amt;
  else user.balance = (user.balance || 0) - amt;

  const transfer = {
    id: uid('ft'),
    userId,
    type,
    amount: amt,
    note,
    createdAt: Date.now(),
    source: 'admin',
  };
  store.fundTransfers.unshift(transfer);
  saveStore(store);
  return transfer;
}

export function getNotifications(activeOnly = true) {
  let list = getStore().notifications;
  if (activeOnly) list = list.filter((n) => n.active);
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export function addNotification(text) {
  const store = getStore();
  const item = { id: uid('n'), text, createdAt: Date.now(), active: true };
  store.notifications.unshift(item);
  saveStore(store);
  return item;
}

export function deleteNotification(id) {
  const store = getStore();
  store.notifications = store.notifications.filter((n) => n.id !== id);
  saveStore(store);
}

export function toggleNotification(id, active) {
  const store = getStore();
  const n = store.notifications.find((x) => x.id === id);
  if (n) n.active = active;
  saveStore(store);
}

export function adminLogin(password) {
  const store = getStore();
  if (password !== store.settings.adminPassword) return false;
  store.adminSession = { loggedIn: true, at: Date.now() };
  saveStore(store);
  return true;
}

export function adminLogout() {
  const store = getStore();
  store.adminSession = null;
  saveStore(store);
}

export function isAdminLoggedIn() {
  return !!getStore().adminSession?.loggedIn;
}

export function getSettings() {
  return getStore().settings;
}

export function formatTimeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(ts).toLocaleDateString();
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export { STORAGE_EVENT, EARNING_KEY };
