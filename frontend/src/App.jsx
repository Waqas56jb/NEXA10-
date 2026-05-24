import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import DepositPage from './pages/DepositPage';
import BinanceDepositPage from './pages/BinanceDepositPage';
import MexcDepositPage from './pages/MexcDepositPage';
import WithdrawPage from './pages/WithdrawPage';
import InvestPage from './pages/InvestPage';
import ReferralsPage from './pages/ReferralsPage';
import TransactionsPage from './pages/TransactionsPage';
import LevelsPage from './pages/LevelsPage';
import NotificationsPage from './pages/NotificationsPage';
import SupportPage from './pages/SupportPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LandingPage />} />
        <Route path="/signup" element={<LandingPage />} />
        <Route path="/reset" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/deposit" element={<DepositPage />} />
        <Route path="/deposit/binance" element={<BinanceDepositPage />} />
        <Route path="/deposit/mexc" element={<MexcDepositPage />} />
        <Route path="/withdraw" element={<WithdrawPage />} />
        <Route path="/invest" element={<InvestPage />} />
        <Route path="/referrals" element={<ReferralsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/levels" element={<LevelsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Routes>
    </BrowserRouter>
  );
}
