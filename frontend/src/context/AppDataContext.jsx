import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  initStore,
  getStore,
  STORAGE_EVENT,
  getCurrentUser,
  getDeposits,
  getNotifications,
} from '../lib/storage';
import { getUserToken, isApiEnabled, userApi } from '../lib/api';
import { normalizeDeposit, normalizeNotification, normalizeTransfer, normalizeUser } from '../lib/normalize';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const apiMode = isApiEnabled();
  const [tick, setTick] = useState(0);
  const [apiUser, setApiUser] = useState(null);
  const [apiNotifications, setApiNotifications] = useState([]);
  const [apiDeposits, setApiDeposits] = useState([]);
  const [apiFundTransfers, setApiFundTransfers] = useState([]);
  const [loading, setLoading] = useState(apiMode);

  const refresh = useCallback(async () => {
    if (apiMode && getUserToken()) {
      try {
        const [meRes, notifRes, depRes, transferRes] = await Promise.all([
          userApi.me(),
          userApi.getNotifications(),
          userApi.myDeposits().catch(() => ({ deposits: [] })),
          userApi.myTransfers().catch(() => ({ transfers: [] })),
        ]);
        setApiUser(normalizeUser(meRes.user));
        setApiNotifications((notifRes.notifications || []).map(normalizeNotification));
        setApiDeposits((depRes.deposits || []).map(normalizeDeposit));
        setApiFundTransfers((transferRes.transfers || []).map(normalizeTransfer));
      } catch {
        setApiUser(null);
        setApiNotifications([]);
        setApiDeposits([]);
        setApiFundTransfers([]);
      }
    } else if (apiMode) {
      setApiUser(null);
      setApiNotifications([]);
      setApiDeposits([]);
      setApiFundTransfers([]);
    }
    setTick((t) => t + 1);
    setLoading(false);
  }, [apiMode]);

  useEffect(() => {
    initStore();
    refresh();
    const handler = () => refresh();
    window.addEventListener(STORAGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_EVENT, handler);
  }, [refresh]);

  useEffect(() => {
    if (!apiMode || !getUserToken()) return undefined;
    const id = setInterval(refresh, 15000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [apiMode, refresh]);

  const value = useMemo(() => {
    if (apiMode) {
      const pendingDeposits = apiDeposits.filter((d) => d.status === 'pending');
      return {
        tick,
        refresh,
        loading,
        apiMode,
        currentUser: apiUser,
        users: apiUser ? [apiUser] : [],
        deposits: apiDeposits,
        pendingDeposits,
        notifications: apiNotifications,
        fundTransfers: apiFundTransfers,
        settings: { refLink: `https://nexa10.com/register?ref=${apiUser?.refCode || '81ibdsh3zc'}` },
        unreadNotifications: apiNotifications.length,
      };
    }

    const store = getStore();
    const currentUser = getCurrentUser();
    const deposits = getDeposits();
    const notifications = getNotifications(true);
    const pendingDeposits = deposits.filter((d) => d.status === 'pending');

    return {
      tick,
      refresh,
      loading: false,
      apiMode: false,
      store,
      currentUser,
      users: store.users,
      deposits,
      pendingDeposits,
      notifications,
      fundTransfers: store.fundTransfers,
      settings: store.settings,
      unreadNotifications: notifications.length,
    };
  }, [apiMode, tick, refresh, loading, apiUser, apiDeposits, apiNotifications, apiFundTransfers]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
