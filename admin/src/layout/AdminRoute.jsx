import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { SESSION_EXPIRED_EVENT, isAdminTokenValid, setAdminToken } from '../lib/api';

export default function AdminRoute() {
  const location = useLocation();
  const [authed, setAuthed] = useState(() => isAdminTokenValid());

  useEffect(() => {
    const onExpired = () => setAuthed(false);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    if (!authed) setAdminToken(null);
  }, [authed]);

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location.pathname, expired: true }} />;
  }
  return <Outlet />;
}
