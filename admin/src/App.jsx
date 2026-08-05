import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminDataProvider } from './context/AdminDataContext';
import AdminRoute from './layout/AdminRoute';
import AdminLayout from './layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminDepositsPage from './pages/AdminDepositsPage';
import AdminWithdrawalsPage from './pages/AdminWithdrawalsPage';
import AdminSupportPage from './pages/AdminSupportPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<AdminRoute />}>
          <Route
            element={
              <AdminDataProvider>
                <AdminLayout />
              </AdminDataProvider>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="deposits" element={<AdminDepositsPage />} />
            <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
