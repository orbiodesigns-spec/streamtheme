
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SupportPage from './pages/SupportPage';
import StorePage from './pages/StorePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import PublicViewPage from './pages/PublicViewPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PricingPage from './pages/PricingPage';
import ProfilePage from './pages/ProfilePage';
import { User } from './lib/types';
import { api } from './lib/api';
// Admin Imports
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminPlansPage from './pages/admin/AdminPlansPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ user: User | null; children: React.ReactNode }> = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin Protected Route
const AdminProtectedRoute: React.FC<{ token: string | null; children: React.ReactNode }> = ({ token, children }) => {
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  // Initialize from LocalStorage if available
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('streamtheme_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('streamtheme_admin_token'));
  const navigate = useNavigate();

  const handleAdminLogin = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('streamtheme_admin_token', token);
    navigate('/admin/dashboard');
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('streamtheme_admin_token');
    navigate('/admin/login');
  };

  // Verify Session on Mount
  React.useEffect(() => {
    api.getProfile()
      .then(userData => {
        setUser(userData);
        localStorage.setItem('streamtheme_user', JSON.stringify(userData));
      })
      .catch(() => {
        // If profile fetch fails (cookie missing/invalid), logout locally
        // Only if we thought we were logged in
        if (localStorage.getItem('streamtheme_user')) {
          handleLogout();
        }
      });
  }, []);

  // Persist Login
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('streamtheme_user', JSON.stringify(loggedInUser));
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error("Logout failed", e);
    }
    setUser(null);
    localStorage.removeItem('streamtheme_user');
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage user={user} onLoginClick={() => navigate('/login')} />} />
      <Route path="/support" element={<SupportPage user={user} onLoginClick={() => navigate('/login')} />} />
      <Route path="/store" element={<StorePage user={user} onLoginClick={() => navigate('/login')} />} />
      <Route path="/pricing" element={<PricingPage user={user} onLoginClick={() => navigate('/login')} />} />

      <Route path="/login" element={
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBack={() => navigate('/')}
          onRegisterClick={() => navigate('/register')}
          onForgotPasswordClick={() => navigate('/forgot-password')}
        />
      } />

      <Route path="/register" element={
        <RegisterPage
          onLoginClick={() => navigate('/login')}
        />
      } />

      <Route path="/forgot-password" element={
        <ForgotPasswordPage onBack={() => navigate('/login')} />
      } />

      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/profile" element={
        <ProtectedRoute user={user}>
          <ProfilePage
            user={user!}
            onLogout={handleLogout}
            onUserUpdate={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('streamtheme_user', JSON.stringify(updatedUser));
            }}
          />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute user={user}>
          <Dashboard
            user={user!}
            onLogout={handleLogout}
            onSelectLayout={(id) => navigate(`/editor/${id}`)}
            onUserUpdate={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('streamtheme_user', JSON.stringify(updatedUser));
            }}
          />
        </ProtectedRoute>
      } />

      <Route path="/editor/:layoutId" element={
        <ProtectedRoute user={user}>
          <EditorPage
            user={user}
            onLogout={handleLogout}
            onUserUpdate={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('streamtheme_user', JSON.stringify(updatedUser));
            }}
          />
        </ProtectedRoute>
      } />

      <Route path="/view/:token" element={<PublicViewPage />} />

      {/* --- ADMIN ROUTES --- */}
      <Route path="/admin/login" element={
        <AdminLoginPage onLoginSuccess={handleAdminLogin} />
      } />

      <Route path="/admin" element={
        <AdminProtectedRoute token={adminToken}>
          <AdminLayout onLogout={handleAdminLogout} />
        </AdminProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard token={adminToken!} />} />
        <Route path="transactions" element={<AdminTransactionsPage token={adminToken!} />} />
        <Route path="coupons" element={<AdminCouponsPage token={adminToken!} />} />
        <Route path="products" element={<AdminProductsPage token={adminToken!} />} />
        <Route path="plans" element={<AdminPlansPage token={adminToken!} />} />
        <Route path="users" element={<AdminUsersPage token={adminToken!} />} />
        <Route path="support" element={<AdminSupportPage token={adminToken!} />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;