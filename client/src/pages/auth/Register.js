import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: params.get('role') === 'advocate' ? 'advocate' : 'user',
    phone: '', city: '', state: '',
    enrollmentNumber: '', specialty: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name, email: form.email, password: form.password,
        role: form.role, phone: form.phone,
        location: { city: form.city, state: form.state, country: 'India' }
      };
      if (form.role === 'advocate') {
        payload.enrollmentNumber = form.enrollmentNumber;
      }

      const { user } = await register(payload);
      toast.success(`Account created! Welcome, ${user.name.split(' ')[0]}!`);

      if (user.role === 'advocate') navigate('/advocate/dashboard');
      else navigate('/user/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">⚖️ LegalConnect</Link>
          <h1>Create Your Account</h1>
          <p>Join thousands of users on LegalConnect</p>
        </div>

        {/* Role selector */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${form.role === 'user' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'user' })}
          >
            👤 I Need Legal Help
          </button>
          <button
            type="button"
            className={`role-btn ${form.role === 'advocate' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'advocate' })}
          >
            ⚖️ I'm an Advocate
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <div className="input-icon-wrap">
                <FiUser className="input-icon" />
                <input type="text" name="name" className="form-control with-icon"
                  placeholder="Your full name" value={form.name} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <div className="input-icon-wrap">
                <FiMail className="input-icon" />
                <input type="email" name="email" className="form-control with-icon"
                  placeholder="you@example.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" />
                <input type={showPass ? 'text' : 'password'} name="password"
                  className="form-control with-icon with-icon-right"
                  placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
                <button type="button" className="icon-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" />
                <input type={showPass ? 'text' : 'password'} name="confirmPassword"
                  className="form-control with-icon"
                  placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <div className="input-icon-wrap">
                <FiPhone className="input-icon" />
                <input type="tel" name="phone" className="form-control with-icon"
                  placeholder="+91 9XXXXXXXXX" value={form.phone} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>City</label>
              <input type="text" name="city" className="form-control"
                placeholder="Your city" value={form.city} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>State</label>
            <input type="text" name="state" className="form-control"
              placeholder="State" value={form.state} onChange={handleChange} />
          </div>

          {form.role === 'advocate' && (
            <div className="form-group advocate-field">
              <label>Bar Council Enrollment Number *</label>
              <input type="text" name="enrollmentNumber" className="form-control"
                placeholder="e.g. MH/1234/2020" value={form.enrollmentNumber} onChange={handleChange} required />
              <small className="text-muted">You'll need to upload verification documents after registration.</small>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-terms">
          By registering, you agree to our <a href="#!">Terms of Service</a> and <a href="#!">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default Register;
