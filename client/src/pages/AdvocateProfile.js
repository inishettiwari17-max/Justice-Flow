import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiMapPin, FiPhone, FiMail, FiClock,
  FiCheckCircle, FiMessageSquare, FiCalendar, FiHeart, FiEye, FiBook
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, getInitials, formatCurrency, renderStars, timeAgo } from '../utils/helpers';
import './AdvocateProfile.css';

const StarRating = ({ value, onChange }) => (
  <div className="star-picker">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" className={`star-pick ${n <= value ? 'on' : ''}`} onClick={() => onChange(n)}>★</button>
    ))}
  </div>
);

const AdvocateProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [advocate, setAdvocate] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [isSaved, setIsSaved] = useState(false);

  const [consultForm, setConsultForm] = useState({ caseType: '', description: '', preferredDate: '' });
  const [submitConsult, setSubmitConsult] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);

  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitReview, setSubmitReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/advocates/${id}`);
        setAdvocate(data.data);
        setReviews(data.reviews || []);
      } catch {
        toast.error('Advocate not found');
        navigate('/advocates');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!user) return toast.error('Please login to save advocates');
    if (user.role !== 'user') return;
    try {
      await api.post(`/users/save-advocate/${id}`);
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Removed from saved' : 'Advocate saved!');
    } catch { toast.error('Failed'); }
  };

  const handleConsult = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setSubmitConsult(true);
    try {
      await api.post('/consultations', { advocateId: id, ...consultForm });
      toast.success('Consultation request sent!');
      setShowConsultModal(false);
      setConsultForm({ caseType: '', description: '', preferredDate: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitConsult(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setSubmitReview(true);
    try {
      const { data } = await api.post(`/reviews/${id}`, reviewForm);
      setReviews([data.data, ...reviews]);
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, title: '', comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitReview(false);
    }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!advocate) return null;

  const u = advocate.user || {};
  const photoUrl = getAvatarUrl(u.photo);

  return (
    <div className="advocate-profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="container profile-header-inner">
          <div className="profile-main-info">
            <div className="profile-avatar-wrap">
              {photoUrl ? (
                <img src={photoUrl} alt={u.name} className="profile-avatar" />
              ) : (
                <span className="profile-avatar avatar-fallback">{getInitials(u.name)}</span>
              )}
              {advocate.isVerifiedBadge && (
                <span className="profile-verified" title="Verified Advocate">
                  <FiCheckCircle size={18} /> Verified
                </span>
              )}
            </div>

            <div className="profile-info">
              <div className="profile-name-row">
                <h1>{u.name}</h1>
                {advocate.verificationStatus === 'approved' && (
                  <span className="badge badge-verified"><FiCheckCircle size={11} /> Verified</span>
                )}
              </div>
              <p className="profile-specialties-text">
                {(advocate.specialties || []).join(' • ')}
              </p>

              <div className="profile-meta">
                {u.location?.city && (
                  <span><FiMapPin size={14} /> {u.location.city}{u.location.state ? `, ${u.location.state}` : ''}</span>
                )}
                <span><FiClock size={14} /> {advocate.yearsOfExperience || 0} years experience</span>
                <span><FiEye size={14} /> {advocate.profileViews || 0} profile views</span>
              </div>

              <div className="profile-rating-row">
                <div className="stars">
                  {renderStars(advocate.averageRating).map((s, i) => (
                    <span key={i} className={`star ${s === '★' ? 'filled' : 'empty'}`}>{s}</span>
                  ))}
                </div>
                <span className="profile-rating-num">{advocate.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="profile-rating-count">({advocate.totalReviews || 0} reviews)</span>
              </div>

              <div className="profile-languages">
                {(advocate.languages || []).map((l) => <span key={l} className="tag">{l}</span>)}
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <div className="profile-fee-card">
              <div className="fee-label">Consultation Fee</div>
              <div className="fee-big">{formatCurrency(advocate.consultationFee)}</div>
              <div className={`avail-status ${advocate.availability?.isAvailable ? 'available' : 'busy'}`}>
                ● {advocate.availability?.isAvailable ? 'Available' : 'Currently Busy'}
              </div>
            </div>

            {user && user.role === 'user' && (
              <>
                <button className="btn btn-primary btn-full" onClick={() => setShowConsultModal(true)}>
                  <FiCalendar size={16} /> Request Consultation
                </button>
                <Link to={`/chat/${u._id}`} className="btn btn-outline btn-full">
                  <FiMessageSquare size={16} /> Send Message
                </Link>
                <button className={`btn btn-full ${isSaved ? 'btn-danger' : 'btn-outline'}`} onClick={handleSave}>
                  <FiHeart size={16} /> {isSaved ? 'Saved' : 'Save Advocate'}
                </button>
              </>
            )}
            {!user && (
              <Link to="/login" className="btn btn-primary btn-full">Login to Connect</Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs-bar">
        <div className="container">
          {['about', 'education', 'cases', 'reviews'].map((tab) => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'reviews' && ` (${advocate.totalReviews || 0})`}
            </button>
          ))}
        </div>
      </div>

      <div className="container profile-body">
        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="tab-content">
            {advocate.bio && (
              <div className="profile-section">
                <h3>About</h3>
                <p className="bio-text">{advocate.bio}</p>
              </div>
            )}
            <div className="profile-section">
              <h3>Practice Areas</h3>
              <div className="tags-wrap">
                {(advocate.specialties || []).map((s) => <span key={s} className="tag tag-primary">{s}</span>)}
              </div>
            </div>
            <div className="profile-section">
              <h3>Court Practice Areas</h3>
              <div className="tags-wrap">
                {(advocate.courtPracticeAreas || []).map((c) => <span key={c} className="tag">{c}</span>)}
              </div>
            </div>
            <div className="profile-section">
              <h3>Contact Information</h3>
              <div className="contact-items">
                {u.phone && <div className="contact-item"><FiPhone /> {u.phone}</div>}
                {u.email && <div className="contact-item"><FiMail /> {u.email}</div>}
                {u.location?.city && <div className="contact-item"><FiMapPin /> {u.location.city}, {u.location.state}</div>}
              </div>
            </div>
            <div className="profile-section">
              <h3>Enrollment Number</h3>
              <p className="enrollment-num">{advocate.enrollmentNumber}</p>
            </div>
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="tab-content">
            <h3 className="tab-title">Education</h3>
            {(advocate.education || []).length === 0 ? (
              <p className="text-muted">No education details added.</p>
            ) : (
              <div className="edu-list">
                {advocate.education.map((edu, i) => (
                  <div key={i} className="edu-card">
                    <div className="edu-icon"><FiBook /></div>
                    <div>
                      <strong>{edu.degree}</strong>
                      <p>{edu.institution}</p>
                      {edu.year && <span className="tag">{edu.year}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cases Tab */}
        {activeTab === 'cases' && (
          <div className="tab-content">
            <h3 className="tab-title">Case History & Expertise</h3>
            {(advocate.caseHistory || []).length === 0 ? (
              <p className="text-muted">No case history added yet.</p>
            ) : (
              <div className="cases-list">
                {advocate.caseHistory.map((c, i) => (
                  <div key={i} className="case-card card">
                    <div className="card-body">
                      <h4>{c.title}</h4>
                      <p>{c.description}</p>
                      {c.outcome && <div className="case-outcome"><strong>Outcome:</strong> {c.outcome}</div>}
                      {c.year && <span className="tag mt-1">{c.year}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="tab-content">
            <h3 className="tab-title">Ratings & Reviews</h3>

            {/* Rating summary */}
            <div className="reviews-summary card">
              <div className="card-body review-summary-inner">
                <div className="big-rating">
                  <span className="big-num">{advocate.averageRating?.toFixed(1) || '0.0'}</span>
                  <div className="stars">
                    {renderStars(advocate.averageRating).map((s, i) => (
                      <span key={i} className={`star ${s === '★' ? 'filled' : 'empty'}`} style={{ fontSize: '1.4rem' }}>{s}</span>
                    ))}
                  </div>
                  <span className="text-muted">{advocate.totalReviews || 0} reviews</span>
                </div>
              </div>
            </div>

            {/* Write review */}
            {user?.role === 'user' && (
              <div className="write-review card">
                <div className="card-body">
                  <h4>Write a Review</h4>
                  <form onSubmit={handleReview}>
                    <div className="form-group">
                      <label>Rating</label>
                      <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm({ ...reviewForm, rating: v })} />
                    </div>
                    <div className="form-group">
                      <label>Title (optional)</label>
                      <input type="text" className="form-control" placeholder="Brief summary"
                        value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Your Review</label>
                      <textarea className="form-control" rows={4} placeholder="Share your experience..."
                        value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitReview}>
                      {submitReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Reviews list */}
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p className="text-muted">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r._id} className="review-item card">
                    <div className="card-body">
                      <div className="review-top">
                        <div className="review-user">
                          <span className="avatar avatar-sm">
                            {getAvatarUrl(r.user?.photo)
                              ? <img src={getAvatarUrl(r.user.photo)} alt="" className="avatar avatar-sm" />
                              : getInitials(r.user?.name)}
                          </span>
                          <div>
                            <strong>{r.user?.name}</strong>
                            <span className="review-date text-muted">{timeAgo(r.createdAt)}</span>
                          </div>
                        </div>
                        <div className="stars">
                          {renderStars(r.rating).map((s, i) => (
                            <span key={i} className={`star ${s === '★' ? 'filled' : 'empty'}`}>{s}</span>
                          ))}
                        </div>
                      </div>
                      {r.title && <h5 className="review-title">{r.title}</h5>}
                      <p className="review-comment">{r.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Consultation Modal */}
      {showConsultModal && (
        <div className="modal-overlay" onClick={() => setShowConsultModal(false)}>
          <div className="modal-box card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Consultation</h3>
              <button className="modal-close" onClick={() => setShowConsultModal(false)}>×</button>
            </div>
            <form onSubmit={handleConsult} className="card-body">
              <div className="form-group">
                <label>Case Type *</label>
                <input type="text" className="form-control" placeholder="e.g. Criminal case, property dispute..."
                  value={consultForm.caseType} onChange={(e) => setConsultForm({ ...consultForm, caseType: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Brief Description</label>
                <textarea className="form-control" rows={4} placeholder="Describe your legal issue briefly..."
                  value={consultForm.description} onChange={(e) => setConsultForm({ ...consultForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Preferred Date</label>
                <input type="date" className="form-control"
                  min={new Date().toISOString().split('T')[0]}
                  value={consultForm.preferredDate} onChange={(e) => setConsultForm({ ...consultForm, preferredDate: e.target.value })} />
              </div>
              <div className="consult-fee-note">
                Consultation fee: <strong>{formatCurrency(advocate.consultationFee)}</strong>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={submitConsult}>
                {submitConsult ? 'Sending...' : 'Send Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvocateProfile;
