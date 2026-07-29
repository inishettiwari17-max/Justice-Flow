import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiUpload, FiEdit, FiCheck, FiX, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatCurrency, getAvatarUrl, getInitials, SPECIALTIES, LANGUAGES } from '../../utils/helpers';
import './Dashboard.css';

const AdvocateDashboard = () => {
  const { user, advocateProfile: ap, setAdvocateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [consultations, setConsultations] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const [profileForm, setProfileForm] = useState({
    bio: '', yearsOfExperience: 0, consultationFee: 0,
    specialties: [], languages: [], courtPracticeAreas: [],
    availability: { isAvailable: true, schedule: '' }
  });

  useEffect(() => {
    if (ap) {
      setProfileForm({
        bio: ap.bio || '',
        yearsOfExperience: ap.yearsOfExperience || 0,
        consultationFee: ap.consultationFee || 0,
        specialties: ap.specialties || [],
        languages: ap.languages || [],
        courtPracticeAreas: ap.courtPracticeAreas || [],
        availability: ap.availability || { isAvailable: true, schedule: '' }
      });
    }
  }, [ap]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, convRes] = await Promise.all([
          api.get('/consultations/my'),
          api.get('/chat/conversations')
        ]);
        setConsultations(cRes.data.data || []);
        setConversations(convRes.data.data || []);
      } catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/advocates/profile', profileForm);
      setAdvocateProfile(data.data);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('document', file);
    fd.append('docName', file.name);
    try {
      await api.post('/advocates/upload-document', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded for verification');
    } catch { toast.error('Upload failed'); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Photo updated');
      window.location.reload();
    } catch { toast.error('Photo upload failed'); }
  };

  const updateConsultation = async (id, status, note = '') => {
    try {
      const { data } = await api.put(`/consultations/${id}/status`, { status, advocateNote: note });
      setConsultations((prev) => prev.map((c) => c._id === id ? { ...c, status: data.data.status } : c));
      toast.success(`Consultation ${status}`);
    } catch { toast.error('Failed'); }
  };

  const toggleSpecialty = (s) => {
    setProfileForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter((x) => x !== s)
        : [...prev.specialties, s]
    }));
  };
  const toggleLang = (l) => {
    setProfileForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(l)
        ? prev.languages.filter((x) => x !== l)
        : [...prev.languages, l]
    }));
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const photoUrl = getAvatarUrl(user?.photo);
  const verificationStatus = ap?.verificationStatus || 'pending';

  const statusColors = { pending: 'badge-pending', approved: 'badge-verified', rejected: 'badge-rejected' };
  const consultStatus = { pending: 'badge-warning', accepted: 'badge-success', rejected: 'badge-danger', completed: 'badge-info', cancelled: 'badge-secondary' };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="container">
          <div className="dash-user-info">
            <label style={{ cursor: 'pointer', position: 'relative' }}>
              <div className="avatar avatar-lg" style={{ position: 'relative' }}>
                {photoUrl ? <img src={photoUrl} alt={user?.name} className="avatar avatar-lg" /> : getInitials(user?.name)}
                <span style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiEdit size={11} color="#fff" />
                </span>
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
            <div>
              <h1>{user?.name}</h1>
              <p>{user?.email}</p>
              <span className={`badge ${statusColors[verificationStatus]}`} style={{ marginTop: '0.3rem' }}>
                {verificationStatus === 'approved' && '✓ Verified Advocate'}
                {verificationStatus === 'pending' && '⏳ Verification Pending'}
                {verificationStatus === 'rejected' && '✗ Verification Rejected'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline-white" onClick={() => setActiveTab('profile')}>
              <FiEdit size={15} /> Edit Profile
            </button>
            <button className="btn btn-accent" onClick={() => fileRef.current.click()}>
              <FiUpload size={15} /> Upload Doc
            </button>
            <input type="file" ref={fileRef} onChange={handleDocUpload} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
          </div>
        </div>
      </div>

      <div className="container dashboard-content">
        {/* Stats */}
        <div className="stats-row">
          {[
            { label: 'Total Consultations', value: ap?.totalConsultations || 0 },
            { label: 'Avg Rating', value: ap?.averageRating?.toFixed(1) || '0.0' },
            { label: 'Total Reviews', value: ap?.totalReviews || 0 },
            { label: 'Profile Views', value: ap?.profileViews || 0 }
          ].map((s, i) => (
            <div key={i} className="stat-tile">
              <div className="stat-tile-val">{s.value}</div>
              <div className="stat-tile-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Verification alert */}
        {verificationStatus === 'pending' && (
          <div className="alert alert-warning">
            <strong>Verification Pending:</strong> Upload your Bar Council certificate to get verified. Verified advocates appear higher in search results.
          </div>
        )}
        {verificationStatus === 'rejected' && ap?.verificationNote && (
          <div className="alert alert-error">
            <strong>Verification Rejected:</strong> {ap.verificationNote}. Please re-upload the required documents.
          </div>
        )}

        {/* Tabs */}
        <div className="dash-tabs">
          {[['overview', 'Overview'], ['requests', 'Consultation Requests'], ['profile', 'Edit Profile'], ['messages', 'Messages']].map(([tab, label]) => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {label}
              {tab === 'requests' && consultations.filter((c) => c.status === 'pending').length > 0 && (
                <span className="unread-badge" style={{ marginLeft: '0.4rem' }}>{consultations.filter((c) => c.status === 'pending').length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="tab-panel">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Pending Requests</h3>
                {consultations.filter((c) => c.status === 'pending').length === 0 ? (
                  <p className="text-muted">No pending requests.</p>
                ) : consultations.filter((c) => c.status === 'pending').slice(0, 3).map((c) => (
                  <div key={c._id} className="mini-item">
                    <div>
                      <strong>{c.user?.name}</strong>
                      <p className="text-muted">{c.caseType}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button className="btn btn-sm" style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none' }} onClick={() => updateConsultation(c._id, 'accepted')}>
                        <FiCheck size={13} />
                      </button>
                      <button className="btn btn-sm" style={{ background: '#ffebee', color: '#c62828', border: 'none' }} onClick={() => updateConsultation(c._id, 'rejected')}>
                        <FiX size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {consultations.filter((c) => c.status === 'pending').length > 3 && (
                  <button className="view-more" onClick={() => setActiveTab('requests')}>View all →</button>
                )}
              </div>
              <div className="overview-card">
                <h3>Your Profile</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)', lineHeight: 1.7 }}>
                  <p><strong>Enrollment:</strong> {ap?.enrollmentNumber}</p>
                  <p><strong>Experience:</strong> {ap?.yearsOfExperience || 0} years</p>
                  <p><strong>Fee:</strong> {formatCurrency(ap?.consultationFee)}</p>
                  <p><strong>Specialties:</strong> {(ap?.specialties || []).slice(0, 3).join(', ') || 'Not set'}</p>
                  <p><strong>Available:</strong> {ap?.availability?.isAvailable ? 'Yes' : 'No'}</p>
                </div>
                {ap?._id && (
                  <Link to={`/advocates/${ap._id}`} className="btn btn-outline btn-sm mt-2" style={{ display: 'inline-flex' }}>
                    View Public Profile
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Consultation Requests */}
        {activeTab === 'requests' && (
          <div className="tab-panel requests-list">
            {consultations.length === 0 ? (
              <div className="empty-state"><p>No consultation requests yet.</p></div>
            ) : consultations.map((c) => (
              <div key={c._id} className="request-card card">
                <div className="card-body">
                  <div className="request-top">
                    <div className="request-user">
                      <span className="avatar avatar-sm">{getInitials(c.user?.name)}</span>
                      <div>
                        <strong>{c.user?.name}</strong>
                        <p className="text-muted">{c.user?.phone || c.user?.email}</p>
                      </div>
                    </div>
                    <span className={`badge ${consultStatus[c.status]}`}>{c.status}</span>
                  </div>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}><strong>Case Type:</strong> {c.caseType}</p>
                  {c.description && <p style={{ fontSize: '0.88rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>{c.description}</p>}
                  {c.preferredDate && <p className="text-muted" style={{ fontSize: '0.85rem' }}>Preferred date: {formatDate(c.preferredDate)}</p>}
                  <p className="text-muted" style={{ fontSize: '0.82rem' }}>Received {formatDate(c.createdAt)}</p>
                  {c.status === 'pending' && (
                    <div className="consult-actions" style={{ marginTop: '0.75rem' }}>
                      <button className="btn btn-sm" style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }} onClick={() => updateConsultation(c._id, 'accepted')}>
                        <FiCheck size={13} /> Accept
                      </button>
                      <button className="btn btn-sm" style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a' }} onClick={() => updateConsultation(c._id, 'rejected')}>
                        <FiX size={13} /> Decline
                      </button>
                      {c.user?._id && (
                        <Link to={`/chat/${c.user._id}`} className="btn btn-outline btn-sm">
                          <FiMessageSquare size={13} /> Message
                        </Link>
                      )}
                    </div>
                  )}
                  {c.status === 'accepted' && (
                    <div className="consult-actions" style={{ marginTop: '0.75rem' }}>
                      <button className="btn btn-sm btn-primary" onClick={() => updateConsultation(c._id, 'completed')}>
                        Mark Completed
                      </button>
                      {c.user?._id && (
                        <Link to={`/chat/${c.user._id}`} className="btn btn-outline btn-sm">
                          <FiMessageSquare size={13} /> Message
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Profile Tab */}
        {activeTab === 'profile' && (
          <div className="tab-panel">
            <div className="card" style={{ maxWidth: 720 }}>
              <div className="card-body">
                <h3 style={{ marginBottom: '1.5rem' }}>Update Your Profile</h3>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea className="form-control" rows={5} value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Describe your expertise and experience..." />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input type="number" className="form-control" min="0" max="60" value={profileForm.yearsOfExperience} onChange={(e) => setProfileForm({ ...profileForm, yearsOfExperience: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Consultation Fee (₹)</label>
                    <input type="number" className="form-control" min="0" value={profileForm.consultationFee} onChange={(e) => setProfileForm({ ...profileForm, consultationFee: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Available for Consultations</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                    {[true, false].map((v) => (
                      <label key={String(v)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 500 }}>
                        <input type="radio" checked={profileForm.availability.isAvailable === v} onChange={() => setProfileForm({ ...profileForm, availability: { ...profileForm.availability, isAvailable: v } })} />
                        {v ? 'Yes, I\'m available' : 'Not available now'}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Specialties (select all that apply)</label>
                  <div className="tag-selector">
                    {SPECIALTIES.map((s) => (
                      <button key={s} type="button" className={`tag-option ${profileForm.specialties.includes(s) ? 'selected' : ''}`} onClick={() => toggleSpecialty(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Languages</label>
                  <div className="tag-selector">
                    {LANGUAGES.map((l) => (
                      <button key={l} type="button" className={`tag-option ${profileForm.languages.includes(l) ? 'selected' : ''}`} onClick={() => toggleLang(l)}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Availability Schedule (optional)</label>
                  <input type="text" className="form-control" placeholder="e.g. Mon-Fri, 10am-5pm" value={profileForm.availability.schedule || ''} onChange={(e) => setProfileForm({ ...profileForm, availability: { ...profileForm.availability, schedule: e.target.value } })} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="tab-panel conv-list">
            {conversations.length === 0 ? (
              <div className="empty-state"><p>No messages yet.</p></div>
            ) : conversations.map((conv) => (
              <Link key={conv._id} to={`/chat/${conv.partner?._id}`} className="conv-item card">
                <div className="card-body">
                  <span className="avatar avatar-md">{getInitials(conv.partner?.name)}</span>
                  <div className="conv-info">
                    <strong>{conv.partner?.name}</strong>
                    <p className="text-muted">{conv.lastMessage?.text || 'File attachment'}</p>
                  </div>
                  <div className="conv-meta">
                    {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvocateDashboard;
