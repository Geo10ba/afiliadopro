
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import EvolutionChart from './components/dashboard/EvolutionChart';
import ActivityFeed from './components/dashboard/ActivityFeed';
import './App.css';

import MainLayout from './components/layout/MainLayout';
import MaterialsPage from './pages/admin/MaterialsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import ProductRegistrationPage from './pages/affiliate/ProductRegistrationPage';
import ProductEditPage from './pages/affiliate/ProductEditPage';
import MyProductsPage from './pages/affiliate/MyProductsPage';
import AffiliateProductsPage from './pages/affiliate/AffiliateProductsPage';
import MyOrdersPage from './pages/affiliate/MyOrdersPage';
import AffiliateFinancePage from './pages/affiliate/AffiliateFinancePage';
import NetworkPage from './pages/affiliate/NetworkPage';
import SettingsPage from './pages/settings/SettingsPage';

import AdminUsersPage from './pages/admin/AdminUsersPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCommissionsPage from './pages/admin/AdminCommissionsPage';
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import LandingPage from './pages/landing/LandingPage';

const Dashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data?.role === 'admin') {
          // Only set as admin if NOT impersonating
          const isImpersonating = localStorage.getItem('impersonatedUserId');
          if (!isImpersonating) {
            setIsAdmin(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  if (isAdmin) {
    return (
      <MainLayout>
        <AdminDashboard />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-grid">
        <div className="chart-section">
          <EvolutionChart />
        </div>
        <div className="activity-section">
          <ActivityFeed />
        </div>
      </div>
    </MainLayout>
  );
};



import ProtectedRoute from './components/auth/ProtectedRoute';

import { NotificationsProvider } from './contexts/NotificationsContext';

function App() {
  return (
    <NotificationsProvider>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/products/new" element={
          <ProtectedRoute>
            <MainLayout><ProductRegistrationPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/products/edit/:id" element={
          <ProtectedRoute>
            <MainLayout><ProductEditPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/products/my" element={
          <ProtectedRoute>
            <MainLayout><MyProductsPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/products/available" element={
          <ProtectedRoute>
            <MainLayout><AffiliateProductsPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/orders/my" element={
          <ProtectedRoute>
            <MainLayout>
              <MyOrdersPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/finance" element={
          <ProtectedRoute>
            <MainLayout>
              <AffiliateFinancePage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/network" element={
          <ProtectedRoute>
            <MainLayout>
              <NetworkPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/orders" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout><AdminOrdersPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/materials" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout><MaterialsPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout><AdminUsersPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/commissions" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout><AdminCommissionsPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/withdrawals" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout><AdminWithdrawalsPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout><AdminSettingsPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/products" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout><AdminProductsPage /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/" element={<LandingPage />} />
      </Routes>
    </NotificationsProvider>
  );
}

export default App;
