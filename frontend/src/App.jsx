import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ReportIssue from './pages/student/ReportIssue';
import MyIssues from './pages/student/MyIssues';
import IssueDetail from './pages/student/IssueDetail';
import Profile from './pages/student/Profile';

// Maintenance Pages
import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard';
import AssignedIssues from './pages/maintenance/AssignedIssues';
import MaintenanceIssueDetail from './pages/maintenance/MaintenanceIssueDetail';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AllIssues from './pages/admin/AllIssues';
import AdminIssueDetail from './pages/admin/AdminIssueDetail';
import RecurringProblems from './pages/admin/RecurringProblems';
import TeamManagement from './pages/admin/TeamManagement';
import UserManagement from './pages/admin/UserManagement';

/**
 * Protected Route Guard with strict Role-Based Access Control
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090c] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If unauthorized for this specific role, redirect to appropriate role home
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'MAINTENANCE') return <Navigate to="/maintenance/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Main Layout Shell
 */
function AppLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname);

  if (isPublicPage && !user) {
    return (
      <div className="min-h-screen bg-[#09090c] text-slate-100">
        <Navbar onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMobileMenuOpen={isMobileMenuOpen} />
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090c] text-slate-100 flex flex-col">
      <Navbar onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMobileMenuOpen={isMobileMenuOpen} />
      <div className="flex flex-1">
        {user && (
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        )}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Student / Staff Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                    <ReportIssue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-issues"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                    <MyIssues />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/issues/:id"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                    <IssueDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Maintenance Routes */}
              <Route
                path="/maintenance/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['MAINTENANCE', 'ADMIN']}>
                    <MaintenanceDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maintenance/assigned"
                element={
                  <ProtectedRoute allowedRoles={['MAINTENANCE', 'ADMIN']}>
                    <AssignedIssues />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maintenance/issues/:id"
                element={
                  <ProtectedRoute allowedRoles={['MAINTENANCE', 'ADMIN']}>
                    <MaintenanceIssueDetail />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/issues"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AllIssues />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/issues/:id"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminIssueDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/recurring"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <RecurringProblems />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/teams"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <TeamManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
