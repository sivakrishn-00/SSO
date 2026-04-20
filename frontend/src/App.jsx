import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import UsersPage from './pages/UsersPage/UsersPage';
import ServicesPage from './pages/ServicesPage/ServicesPage';
import AuditLogsPage from './pages/AuditLogsPage/AuditLogsPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import Footer from './components/Footer/Footer';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { isAuthenticated, user } = useAuth();
  const hueStyle = user?.custom_hue !== undefined ? { '--hue': user.custom_hue } : {};

  return (
    <div className="app-container" style={hueStyle}>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />} />
        <Route path="/users" element={isAuthenticated && user?.is_staff ? <UsersPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/audit-logs" element={isAuthenticated && user?.is_staff ? <AuditLogsPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/services" element={isAuthenticated ? <ServicesPage /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      {isAuthenticated && <Footer />}
    </div>
  );
}

export default App;
