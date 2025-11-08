import React from 'react';
import LoginScreen from './pages/auth/login';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Main App Component
const AppContent = () => {
  const { isLoggedIn, userId, isCheckingAuth, logout } = useAuth();

  if (isCheckingAuth) {
    return (
      <div className="app-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#030712'
      }}>
        <div style={{ color: '#ffffff' }}>جار التحميل...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isLoggedIn ? (
        <AdminDashboard userId={userId} />
      ) : (
        <LoginScreen />
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
