import React, { useState, useEffect } from 'react';
import { FiUsers, FiShield, FiStar, FiAlertCircle, FiCheck, FiX, FiSlash } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDate, getInitials } from '../../utils/helpers';
import './Dashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [advFilter, setAdvFilter] = useState('pending');
  const [reviewFilter, setReviewFilter] = useState('flagged');

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, uRes, aRes, rRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/advocates?status=pending'),
          api.get('/admin/reviews?flagged=true')
        ]);
        setStats(sRes.data.stats);
        setUsers(uRes.data.data);
        setAdvocates(aRes.data.data);
        setReviews(rRes.data.data);
      } catch { toast.error('Failed to load admin data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const loadAdvocates = async (status) => {
    setAdvFilter(status);
    try {
      const { data } = await api.get(`/admin/advocates${status !== 'all' ? `?status=${status}` : ''}`);
      setAdvocates(data.data);
    } catch { toast.error('Failed'); }
  };

  const loadReviews = async (flagged) => {
    setReviewFilter(flagged ? 'flagged' : 'all');
    try {
      const { data } = await api.get(`/admin/reviews${flagged ? '?flagged=true' : ''}`);
      setReviews(data.data);
    } catch { toast.error('Failed'); }
  };

  const verifyAdvocate = async (id, status) => {
    const note = status === 'rejected' ? window.prompt('Rejection reason (optional):') : '';
    try {
      await api.put(`/admin/advocates/${id}/verify`, { status, note });
      setAdvocates((prev) => prev.map((a) => a._id === id ? { ...a, verificationStatus: status } : a));
      toast.success(`Advocate ${status}`);
    } catch { toast.error('Failed'); }
  };

  const toggleBan = async (id) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/ban`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBanned: data.isBanned } : u));
      toast.success(data.message);
    } catch { toast.error('Failed'); }
  };

  const handleReview = async (id, action) => {
    try {
      if (action === 'delete') {
        await api.delete(`/admin/reviews/${id}`);
        setReviews((prev) => prev.filter((r) => r._id !== id));
      } else {
        await api.put(`/admin/reviews/${id}`, { isApproved: action === 'approve', isFlagged: false });
        setReviews((prev) => prev.map((r) => r._id === id ? { ...r, isFlagged: false } : r));
      }
      toast.success(`Review ${action}d`);
    } catch { toast.error('Failed'); }
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get(`/admin/users${userSearch ? `?search=${userSearch}` : ''}`);
      setUsers(data.data);
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="container">
          <div className="dash-user-info">
            <div className="avatar avatar-lg" style={{ background: 'rgba(201,168,76,0.3)', color: '#c9a84c', fontSize: '1.5rem' }}>👑</div>
            <div>
              <h1>Admin Panel</h1>
              <p>Platform management & moderation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container dashboard-content">
        {/* Stats */}
        {stats && (
          <div className="admin-stats">
            {[
              { icon: <FiUsers />, label: 'Total Users', num: stats.totalUsers },
              { icon: <FiShield />, label: 'Advocates', num: stats.totalAdvocates },
              { icon: <FiAlertCircle />, label: 'Pending Verification', num: stats.pendingVerifications },
              { icon: <FiStar />, label: 'Flagged Reviews', num: stats.flaggedReviews }
            ].map((s, i) => (
              <div key={i} className="admin-stat">
                <div className="icon">{s.icon}</div>
                <div className="num">{s.num}</div>
                <div className="label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="dash-tabs">
          {[['stats', 'Overview'], ['advocates', 'Advocate Verification'], ['users', 'User Management'], ['reviews', 'Review Moderation']].map(([tab, label]) => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {label}
              {tab === 'advocates' && advocates.filter((a) => a.verificationStatus === 'pending').length > 0 && (
                <span className="unread-badge" style={{ marginLeft: '0.4rem' }}>{advocates.filter((a) => a.verificationStatus === 'pending').length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'stats' && stats && (
          <div className="tab-panel">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Platform Summary</h3>
                {[
                  ['Total Users', stats.totalUsers],
                  ['Total Advocates', stats.totalAdvocates],
                  ['Pending Verifications', stats.pendingVerifications],
                  ['Total Reviews', stats.totalReviews],
                  ['Total Consultations', stats.totalConsultations],
                  ['Flagged Reviews', stats.flaggedReviews],
                  ['Banned Users', stats.bannedUsers]
                ].map(([label, val]) => (
                  <div key={label} className="mini-item">
                    <span style={{ fontSize: '0.9rem', color: 'var(--gray-700)' }}>{label}</span>
                    <strong>{val}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Advocate Verification */}
        {activeTab === 'advocates' && (
          <div className="tab-panel">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {['pending', 'approved', 'rejected', 'all'].map((s) => (
                <button key={s} className={`btn btn-sm ${advFilter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => loadAdvocates(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Advocate</th>
                    <th>Enrollment No.</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Documents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {advocates.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>No advocates found</td></tr>
                  ) : advocates.map((a) => (
                    <tr key={a._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="avatar avatar-sm">{getInitials(a.user?.name)}</span>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.88rem' }}>{a.user?.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{a.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{a.enrollmentNumber}</td>
                      <td style={{ fontSize: '0.85rem' }}>{a.user?.location?.city}, {a.user?.location?.state}</td>
                      <td>
                        <span className={`badge badge-${a.verificationStatus === 'approved' ? 'verified' : a.verificationStatus === 'rejected' ? 'rejected' : 'pending'}`}>
                          {a.verificationStatus}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{a.documents?.length || 0} docs</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {a.verificationStatus !== 'approved' && (
                            <button className="btn btn-sm" style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none' }} onClick={() => verifyAdvocate(a._id, 'approved')}>
                              <FiCheck size={13} />
                            </button>
                          )}
                          {a.verificationStatus !== 'rejected' && (
                            <button className="btn btn-sm" style={{ background: '#ffebee', color: '#c62828', border: 'none' }} onClick={() => verifyAdvocate(a._id, 'rejected')}>
                              <FiX size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Management */}
        {activeTab === 'users' && (
          <div className="tab-panel">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <input type="text" className="form-control" style={{ maxWidth: 320 }}
                placeholder="Search users..." value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()} />
              <button className="btn btn-primary" onClick={loadUsers}>Search</button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.88rem' }}>{u.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{u.email}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{u.role}</span></td>
                      <td style={{ fontSize: '0.85rem' }}>{u.location?.city || '-'}</td>
                      <td style={{ fontSize: '0.82rem' }}>{formatDate(u.createdAt)}</td>
                      <td>
                        {u.isBanned
                          ? <span className="badge badge-rejected">Banned</span>
                          : <span className="badge badge-verified">Active</span>
                        }
                      </td>
                      <td>
                        {u.role !== 'admin' && (
                          <button className={`btn btn-sm ${u.isBanned ? 'btn-outline' : 'btn-danger'}`}
                            onClick={() => toggleBan(u._id)}>
                            <FiSlash size={12} /> {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Moderation */}
        {activeTab === 'reviews' && (
          <div className="tab-panel">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button className={`btn btn-sm ${reviewFilter === 'flagged' ? 'btn-primary' : 'btn-outline'}`} onClick={() => loadReviews(true)}>Flagged</button>
              <button className={`btn btn-sm ${reviewFilter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => loadReviews(false)}>All Reviews</button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reviewer</th>
                    <th>Advocate</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Flag Reason</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>No reviews found</td></tr>
                  ) : reviews.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontSize: '0.85rem' }}>{r.user?.name}</td>
                      <td style={{ fontSize: '0.85rem' }}>{r.advocate?.user?.name}</td>
                      <td>{'★'.repeat(r.rating)}</td>
                      <td style={{ fontSize: '0.82rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--danger)' }}>{r.flagReason || '-'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{formatDate(r.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button className="btn btn-sm" style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none' }} onClick={() => handleReview(r._id, 'approve')} title="Approve">
                            <FiCheck size={12} />
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleReview(r._id, 'delete')} title="Delete">
                            <FiX size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
