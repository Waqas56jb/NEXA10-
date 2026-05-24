import { Navigate } from 'react-router-dom';
import { getUserToken, isApiEnabled } from '../lib/api';
import { getCurrentUser } from '../lib/storage';

export default function UserRoute({ children }) {
  const authed = isApiEnabled() ? Boolean(getUserToken()) : Boolean(getCurrentUser());
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}
