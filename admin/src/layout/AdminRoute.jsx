import { Navigate, Outlet } from 'react-router-dom';
import { getAdminToken } from '../lib/api';

export default function AdminRoute() {
  if (!getAdminToken()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
