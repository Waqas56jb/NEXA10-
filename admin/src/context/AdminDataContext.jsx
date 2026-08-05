import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from '../lib/api';
import {
  normalizeDeposit,
  normalizeNotification,
  normalizeTransfer,
  normalizeUser,
  normalizeWithdrawal,
} from '../lib/normalize';

const AdminDataContext = createContext(null);

const AUTO_REFRESH_MS = 45000;

function unwrap(result, key) {
  if (result.status !== 'fulfilled') return [];
  return result.value?.[key] || [];
}

// Older deployments may not have /api/admin/overview yet, so fall back to the
// individual endpoints. allSettled keeps one bad endpoint from blanking the
// entire panel.
async function fetchViaLegacyEndpoints() {
  const [usersRes, depositsRes, withdrawalsRes, supportRes, notifRes, statsRes] = await Promise.allSettled([
    adminApi.getUsers(),
    adminApi.getDeposits('all'),
    adminApi.getWithdrawals('all'),
    adminApi.getSupportCases('all'),
    adminApi.getNotifications(),
    adminApi.stats(),
  ]);

  if (usersRes.status === 'rejected' && depositsRes.status === 'rejected') {
    throw usersRes.reason;
  }

  return {
    users: unwrap(usersRes, 'users'),
    deposits: unwrap(depositsRes, 'deposits'),
    withdrawals: unwrap(withdrawalsRes, 'withdrawals'),
    cases: unwrap(supportRes, 'cases'),
    notifications: unwrap(notifRes, 'notifications'),
    stats: statsRes.status === 'fulfilled' ? statsRes.value : null,
  };
}

async function fetchOverview() {
  try {
    return await adminApi.overview();
  } catch (err) {
    if (/HTTP 404|Not found/i.test(err.message || '')) return fetchViaLegacyEndpoints();
    throw err;
  }
}

export function AdminDataProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [supportCases, setSupportCases] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadedOnce = useRef(false);
  const inFlight = useRef(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    // Collapse overlapping refreshes (auto-refresh + an action finishing) into
    // one request instead of stacking them up.
    if (inFlight.current) return inFlight.current;

    if (silent || loadedOnce.current) setRefreshing(true);
    else setLoading(true);

    const run = (async () => {
      try {
        const data = await fetchOverview();
        setUsers((data.users || []).map(normalizeUser));
        setDeposits((data.deposits || []).map(normalizeDeposit));
        setWithdrawals((data.withdrawals || []).map(normalizeWithdrawal));
        setSupportCases(data.cases || []);
        setNotifications((data.notifications || []).map(normalizeNotification));
        setStats(data.stats || null);
        setError('');
        loadedOnce.current = true;
      } catch (err) {
        // Keep whatever is already on screen; only surface the error.
        setError(err.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
        setRefreshing(false);
        inFlight.current = null;
      }
    })();

    inFlight.current = run;
    return run;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const silentLoad = () => load({ silent: true });
    const onVisible = () => {
      if (document.visibilityState === 'visible') silentLoad();
    };
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') silentLoad();
    }, AUTO_REFRESH_MS);
    window.addEventListener('focus', silentLoad);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', silentLoad);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const pendingDeposits = useMemo(() => deposits.filter((d) => d.status === 'pending'), [deposits]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter((w) => w.status === 'pending'), [withdrawals]);
  const openSupportCases = useMemo(() => supportCases.filter((c) => c.status === 'open'), [supportCases]);
  const unreadSupportCases = useMemo(
    () => supportCases.filter((c) => c.status === 'open' && c.unread_for_admin),
    [supportCases],
  );

  const actions = useMemo(() => {
    const mutate = async (fn) => {
      const result = await fn();
      await load({ silent: true });
      return result;
    };

    return {
      blockUser: (id, blocked) => mutate(() => adminApi.blockUser(id, blocked)),
      deleteUser: (id) => mutate(() => adminApi.deleteUser(id)),
      addFunds: async (userId, type, amount, note) => {
        await mutate(() => adminApi.addFunds(userId, type, amount, note));
        return { ok: true };
      },
      getFundTransfers: async (userId) => {
        const { transfers } = await adminApi.getUser(userId);
        return (transfers || []).map(normalizeTransfer);
      },
      getDepositScreenshot: async (id) => {
        const { screenshot } = await adminApi.getDepositScreenshot(id);
        return screenshot;
      },
      approveDeposit: (id, approvedAmount) => mutate(() => adminApi.approveDeposit(id, approvedAmount)),
      rejectDeposit: (id, adminNote) => mutate(() => adminApi.rejectDeposit(id, adminNote)),
      approveWithdrawal: (id, adminNote) => mutate(() => adminApi.approveWithdrawal(id, adminNote)),
      rejectWithdrawal: (id, adminNote) => mutate(() => adminApi.rejectWithdrawal(id, adminNote)),
      addNotification: (text) => mutate(() => adminApi.createNotification(text)),
      deleteNotification: (id) => mutate(() => adminApi.deleteNotification(id)),
      toggleNotification: (id, active) => mutate(() => adminApi.toggleNotification(id, active)),
    };
  }, [load]);

  const value = useMemo(
    () => ({
      users,
      deposits,
      withdrawals,
      supportCases,
      notifications,
      stats,
      pendingDeposits,
      pendingWithdrawals,
      openSupportCases,
      unreadSupportCases,
      loading,
      refreshing,
      error,
      refresh: () => load({ silent: true }),
      actions,
    }),
    [
      users, deposits, withdrawals, supportCases, notifications, stats,
      pendingDeposits, pendingWithdrawals, openSupportCases, unreadSupportCases,
      loading, refreshing, error, load, actions,
    ],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used inside <AdminDataProvider>');
  return ctx;
}
