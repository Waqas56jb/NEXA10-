import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../lib/api';
import { normalizeDeposit, normalizeNotification, normalizeTransfer, normalizeUser } from '../lib/normalize';

export function useAdminData() {
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, depositsRes, notifRes, statsRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getDeposits('all'),
        adminApi.getNotifications(),
        adminApi.stats(),
      ]);
      setUsers((usersRes.users || []).map(normalizeUser));
      setDeposits((depositsRes.deposits || []).map(normalizeDeposit));
      setNotifications((notifRes.notifications || []).map(normalizeNotification));
      setStats(statsRes);
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingDeposits = useMemo(
    () => deposits.filter((d) => d.status === 'pending'),
    [deposits],
  );

  const actions = useMemo(
    () => ({
      blockUser: async (id, blocked) => {
        await adminApi.blockUser(id, blocked);
        await load();
      },
      deleteUser: async (id) => {
        await adminApi.deleteUser(id);
        await load();
      },
      addFunds: async (userId, type, amount, note) => {
        await adminApi.addFunds(userId, type, amount, note);
        await load();
        return { ok: true };
      },
      getFundTransfers: async (userId) => {
        const { transfers } = await adminApi.getUser(userId);
        return (transfers || []).map(normalizeTransfer);
      },
      approveDeposit: async (id, approvedAmount) => {
        await adminApi.approveDeposit(id, approvedAmount);
        await load();
      },
      rejectDeposit: async (id, adminNote) => {
        await adminApi.rejectDeposit(id, adminNote);
        await load();
      },
      addNotification: async (text) => {
        await adminApi.createNotification(text);
        await load();
      },
      deleteNotification: async (id) => {
        await adminApi.deleteNotification(id);
        await load();
      },
      toggleNotification: async (id, active) => {
        await adminApi.toggleNotification(id, active);
        await load();
      },
    }),
    [load],
  );

  return {
    users,
    deposits,
    notifications,
    pendingDeposits,
    stats,
    loading,
    error,
    refresh: load,
    actions,
  };
}
