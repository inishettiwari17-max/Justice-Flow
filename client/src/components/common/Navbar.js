import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiBell, FiChevronDown, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getAvatarUrl, getInitials } from '../../utils/helpers';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropRef = useRef();
  const notifRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'advocate') return '/advocate/dashboard';
    return '/user/dashboard';
  };

  const isActive = (path) => location.pathname === path;
  const unreadCount = notifications.length;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">⚖️</span>
          <span className="brand-name">LegalConnect</span>
        </Link>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/advocates" className={`nav-link ${isActive('/advocates') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Find Advocate</Link>
          <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>About</Link>
          <Link to="/faq" className={`nav-link ${isActive('/faq') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>FAQ</Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Contact</Link>

          {!user ? (
            <div className="navbar-auth">
              <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          ) : (
            <div className="navbar-user">
              {/* Notifications */}
              <div className="notif-wrap" ref={notifRef}>
                <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications">
                  <FiBell size={20} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span>Notifications</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="notif-empty">No new notifications</div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className="notif-item">
                          <strong>{n.from}</strong>
                          <p>{n.preview}</p>
                        </div>
                      ))
                    )}
                    <Link to="/chat" className="notif-all" onClick={() => setNotifOpen(false)}>View all messages →</Link>
                  </div>
                )}
              </div>

              {/* Avatar dropdown */}
              <div className="user-dropdown" ref={dropRef}>
                <button className="user-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  {getAvatarUrl(user.photo) ? (
                    <img src={getAvatarUrl(user.photo)} alt={user.name} className="avatar avatar-sm" />
                  ) : (
                    <span className="avatar avatar-sm">{getInitials(user.name)}</span>
                  )}
                  <span className="user-name">{user.name.split(' ')[0]}</span>
                  <FiChevronDown size={14} />
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to={getDashboardLink()} className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <FiUser size={15} /> Dashboard
                    </Link>
                    <Link to="/profile/edit" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <FiSettings size={15} /> Edit Profile
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <FiLogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
