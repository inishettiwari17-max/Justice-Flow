import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiSave, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, getInitials, CASE_TYPES, LANGUAGES } from '../utils/helpers';
import './EditProfile.css';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const photoRef = useRef();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.location?.city || '',
    state: user?.location?.state || '',
    preferredLanguage: user?.preferredLanguage || 'English',
    caseType: user?.caseType || '',
    requirements: user?.requirements || ''
  });

  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const photoUrl = getAvatarUrl(user?.photo);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    try {
      const { data } = await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ photo: data.data.photo });
      toast.success('Photo updated!');
    } catch { toast.error('Photo upload failed'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const { data } = await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(data.data);
      toast.success('Profile updated!');
      navigate(-1);
    } catch { toast.error('Failed to save profile'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match');
    if (passForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setChangingPass(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setChangingPass(false); }
  };

  return (
    <div className="edit-profile-page">
      <div className="page-header">
        <div className="container">
          <h1>Edit Profile</h1>
          <p>Update your personal information and preferences</p>
        </div>
      </div>

      <div className="container edit-grid">
        {/* Photo */}
        <div className="edit-photo-card card card-body">
          <div className="photo-preview">
            {photoUrl
              ? <img src={photoUrl} alt={user?.name} className="avatar avatar-xl" />
              : <span className="avatar avatar-xl">{getInitials(user?.name)}</span>
            }
          </div>
          <button className="btn btn-outline mt-2" onClick={() => photoRef.current.click()}>
            <FiUpload size={15} /> Change Photo
          </button>
          <input type="file" ref={photoRef} accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          <div className="edit-role-badge">
            <span className="badge badge-primary">{user?.role}</span>
          </div>
        </div>

        <div className="edit-forms">
          {/* Profile form */}
          <div className="card card-body mb-3">
            <h3>Personal Information</h3>
            <form onSubmit={handleSave}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>City</label>
                  <input type="text" className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" className="form-control" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Preferred Language</label>
                <select className="form-control" value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}>
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              {user?.role === 'user' && (
                <>
                  <div className="form-group">
                    <label>Case Type</label>
                    <select className="form-control" value={form.caseType} onChange={(e) => setForm({ ...form, caseType: e.target.value })}>
                      <option value="">Select case type</option>
                      {CASE_TYPES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Requirements / Notes</label>
                    <textarea className="form-control" rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Any specific requirements or notes for advocates..." />
                  </div>
                </>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <FiSave size={15} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Password form */}
          <div className="card card-body">
            <h3><FiLock size={16} /> Change Password</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" className="form-control" value={passForm.currentPassword} onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })} required />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" className="form-control" value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" className="form-control" value={passForm.confirmPassword} onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn btn-outline" disabled={changingPass}>
                {changingPass ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
