import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdvocateListing from './pages/AdvocateListing';
import AdvocateProfile from './pages/AdvocateProfile';
import UserDashboard from './pages/dashboard/UserDashboard';
import AdvocateDashboard from './pages/dashboard/AdvocateDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ChatPage from './pages/ChatPage';
import EditProfile from './pages/EditProfile';
import NotFound from './pages/NotFound';

// Protected route component
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppContent = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Navbar />
    <main style={{ flex: 1 }}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/advocates" element={<AdvocateListing />} />
        <Route path="/advocates/:id" element={<AdvocateProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/user/dashboard" element={<PrivateRoute roles={['user']}><UserDashboard /></PrivateRoute>} />
        <Route path="/advocate/dashboard" element={<PrivateRoute roles={['advocate']}><AdvocateDashboard /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/chat/:userId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/profile/edit" element={<PrivateRoute><EditProfile /></PrivateRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { borderRadius: '10px', fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
              success: { iconTheme: { primary: '#28a745', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc3545', secondary: '#fff' } }
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
