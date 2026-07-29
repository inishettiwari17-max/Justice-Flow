import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMessageSquare, FiCalendar, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatCurrency, getAvatarUrl, getInitials, timeAgo } from '../../utils/helpers';
import './Dashboard.css';

const STATUS_COLORS = { pending: 'warning', accepted: 'success', rejected: 'danger', completed: 'info', cancelled: 'secondary' };

const UserDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [consultations, setConsultations] = useState([]);
  const [savedAdvocates, setSavedAdvocates] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, sRes, convRes] = await Promise.all([
          api.get('/consultations/my'),
          api.get('/users/saved-advocates'),
          api.get('/chat/conversations')
        ]);
        setConsultations(cRes.data.data || []);
        setSavedAdvocates(sRes.data.data || []);
        setConversations(convRes.data.data || []);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cancelConsultation = async (id) => {
    try {
      await api.delete(`/consultations/${id}`);
      setConsultations((prev) => prev.map((c) => c._id === id ? { ...c, status: 'cancelled' } : c));
      toast.success('Consultation cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const removeSaved = async (advocateId) => {
    try {
      await api.post(`/users/save-advocate/${advocateId}`);
      setSavedAdvocates((prev) => prev.filter((a) => a._id !== advocateId));
      toast.success('Removed from saved');
    } catch { toast.error('Failed'); }
  };

  const stats = [
    { icon: <FiCalendar />, label: 'Consultations', value: consultations.length },
    { icon: <FiHeart />, label: 'Saved Advocates', value: savedAdvocates.length },
    { icon: <FiMessageSquare />, label: 'Conversations', value: conversations.length }
  ];

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const photoUrl = getAvatarUrl(user?.photo);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="container">
          <div className="dash-user-info">
            <div className="avatar avatar-lg">
              {photoUrl ? <img src={photoUrl} alt={user?.name} className="avatar avatar-lg" /> : getInitials(user?.name)}
            </div>
            <div>
              <h1>Welcome back, {user?.name?.split(' ')[0]}!</h1>
              <p>{user?.email} • Party User</p>
            </div>
          </div>
          <Link to="/advocates" className="btn btn-accent">
            <FiSearch size={16} /> Find Advocates
          </Link>
        </div>
      </div>

      <div className="container dashboard-content">
        {/* Stats */}
        <div className="stats-row">
          {stats.map((s, i) => (
            <div key={i} className="stat-tile">
              <div className="stat-tile-icon">{s.icon}</div>
              <div className="stat-tile-val">{s.value}</div>
              <div className="stat-tile-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {[['overview', 'Overview'], ['consultations', 'My Consultations'], ['saved', 'Saved Advocates'], ['messages', 'Messages']].map(([tab, label]) => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="tab-panel">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Recent Consultations</h3>
                {consultations.slice(0, 3).length === 0 ? (
                  <p className="text-muted">No consultations yet. <Link to="/advocates">Find an advocate</Link></p>
                ) : consultations.slice(0, 3).map((c) => (
                  <div key={c._id} className="mini-item">
                    <div>
                      <strong>{c.advocate?.user?.name || 'Advocate'}</strong>
                      <p className="text-muted">{c.caseType} • {formatDate(c.createdAt)}</p>
                    </div>
                    <span className={`badge badge-${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </div>
                ))}
                {consultations.length > 3 && (
                  <button className="view-more" onClick={() => setActiveTab('consultations')}>View all →</button>
                )}
              </div>
              <div className="overview-card">
                <h3>Saved Advocates</h3>
                {savedAdvocates.slice(0, 4).length === 0 ? (
                  <p className="text-muted">No saved advocates.</p>
                ) : savedAdvocates.slice(0, 4).map((a) => (
                  <div key={a._id} className="mini-item">
                    <span className="avatar avatar-sm">{getInitials(a.user?.name)}</span>
                    <div>
                      <Link to={`/advocates/${a._id}`}><strong>{a.user?.name}</strong></Link>
                      <p className="text-muted">{(a.specialties || []).slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Consultations */}
        {activeTab === 'consultations' && (
          <div className="tab-panel">
            {consultations.length === 0 ? (
              <div className="empty-state">
                <p>No consultations yet.</p>
                <Link to="/advocates" className="btn btn-primary mt-2">Find an Advocate</Link>
              </div>
            ) : (
              <div className="consult-list">
                {consultations.map((c) => (
                  <div key={c._id} className="consult-card card">
                    <div className="card-body">
                      <div className="consult-top">
                        <div>
                          <h4>Consultation with {c.advocate?.user?.name || 'Advocate'}</h4>
                          <p className="text-muted">{c.caseType} • {formatDate(c.createdAt)}</p>
                          {c.preferredDate && <p className="text-muted">Preferred: {formatDate(c.preferredDate)}</p>}
                          {c.advocateNote && <div className="advocate-note"><strong>Advocate's note:</strong> {c.advocateNote}</div>}
                        </div>
                        <div className="consult-right">
                          <span className={`badge badge-${STATUS_COLORS[c.status]}`}>{c.status}</span>
                          <span className="consult-fee">{formatCurrency(c.fee)}</span>
                        </div>
                      </div>
                      {c.description && <p className="consult-desc">{c.description}</p>}
                      <div className="consult-actions">
                        {c.advocate?.user && (
                          <Link to={`/chat/${c.advocate.user._id}`} className="btn btn-outline btn-sm">
                            <FiMessageSquare size={13} /> Message
                          </Link>
                        )}
                        {c.status === 'pending' && (
                          <button className="btn btn-danger btn-sm" onClick={() => cancelConsultation(c._id)}>Cancel</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Advocates */}
        {activeTab === 'saved' && (
          <div className="tab-panel">
            {savedAdvocates.length === 0 ? (
              <div className="empty-state">
                <p>No saved advocates yet.</p>
                <Link to="/advocates" className="btn btn-primary mt-2">Browse Advocates</Link>
              </div>
            ) : (
              <div className="grid grid-3">
                {savedAdvocates.map((a) => (
                  <div key={a._id} className="saved-card card">
                    <div className="card-body">
                      <div className="saved-info">
                        <span className="avatar avatar-md">{getInitials(a.user?.name)}</span>
                        <div>
                          <Link to={`/advocates/${a._id}`}><strong>{a.user?.name}</strong></Link>
                          <p className="text-muted">{(a.specialties || []).slice(0, 2).join(', ')}</p>
                          <p className="text-muted">⭐ {a.averageRating?.toFixed(1)} • {a.yearsOfExperience}yr exp</p>
                        </div>
                      </div>
                      <div className="saved-actions">
                        <Link to={`/chat/${a.user?._id}`} className="btn btn-outline btn-sm">Message</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => removeSaved(a._id)}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {activeTab === 'messages' && (
          <div className="tab-panel">
            {conversations.length === 0 ? (
              <div className="empty-state">
                <p>No conversations yet. Message an advocate to get started.</p>
                <Link to="/advocates" className="btn btn-primary mt-2">Find Advocates</Link>
              </div>
            ) : (
              <div className="conv-list">
                {conversations.map((conv) => (
                  <Link key={conv._id} to={`/chat/${conv.partner?._id}`} className="conv-item card">
                    <div className="card-body">
                      <div className="conv-avatar">
                        <span className="avatar avatar-md">{getInitials(conv.partner?.name)}</span>
                      </div>
                      <div className="conv-info">
                        <strong>{conv.partner?.name}</strong>
                        <p className="text-muted">{conv.lastMessage?.text || 'File attachment'}</p>
                      </div>
                      <div className="conv-meta">
                        <span className="conv-time text-muted">{timeAgo(conv.lastMessage?.createdAt)}</span>
                        {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
