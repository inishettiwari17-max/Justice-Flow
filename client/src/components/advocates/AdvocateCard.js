import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiClock, FiCheckCircle, FiHeart } from 'react-icons/fi';
import { getAvatarUrl, getInitials, formatCurrency, renderStars } from '../../utils/helpers';
import './AdvocateCard.css';

const AdvocateCard = ({ advocate, isSaved, onSave }) => {
  const user = advocate.user || {};
  const photoUrl = getAvatarUrl(user.photo);

  return (
    <div className="advocate-card card card-hover">
      <div className="advocate-card-top">
        <div className="advocate-avatar-wrap">
          {photoUrl ? (
            <img src={photoUrl} alt={user.name} className="advocate-avatar" />
          ) : (
            <span className="advocate-avatar avatar-fallback">{getInitials(user.name)}</span>
          )}
          {advocate.isVerifiedBadge && (
            <span className="verified-badge" title="Verified Advocate">
              <FiCheckCircle size={14} />
            </span>
          )}
        </div>

        {onSave && (
          <button
            className={`save-btn ${isSaved ? 'saved' : ''}`}
            onClick={() => onSave(advocate._id)}
            aria-label={isSaved ? 'Remove from saved' : 'Save advocate'}
          >
            <FiHeart size={16} />
          </button>
        )}
      </div>

      <div className="advocate-card-body">
        <h3 className="advocate-name">
          <Link to={`/advocates/${advocate._id}`}>{user.name}</Link>
        </h3>

        <div className="advocate-rating">
          <div className="stars">
            {renderStars(advocate.averageRating).map((s, i) => (
              <span key={i} className={`star ${s === '★' ? 'filled' : 'empty'}`}>{s}</span>
            ))}
          </div>
          <span className="rating-num">{advocate.averageRating?.toFixed(1) || '0.0'}</span>
          <span className="rating-count">({advocate.totalReviews || 0})</span>
        </div>

        <div className="advocate-meta">
          {user.location?.city && (
            <span className="meta-item">
              <FiMapPin size={13} />
              {user.location.city}{user.location.state ? `, ${user.location.state}` : ''}
            </span>
          )}
          <span className="meta-item">
            <FiClock size={13} />
            {advocate.yearsOfExperience || 0} yrs exp
          </span>
        </div>

        <div className="advocate-specialties">
          {(advocate.specialties || []).slice(0, 3).map((s) => (
            <span key={s} className="tag tag-primary">{s}</span>
          ))}
          {advocate.specialties?.length > 3 && (
            <span className="tag">+{advocate.specialties.length - 3}</span>
          )}
        </div>

        {advocate.languages?.length > 0 && (
          <p className="advocate-langs">
            🗣 {advocate.languages.slice(0, 3).join(', ')}
          </p>
        )}
      </div>

      <div className="advocate-card-footer">
        <div className="advocate-fee">
          <span className="fee-label">Consultation</span>
          <span className="fee-value">{formatCurrency(advocate.consultationFee)}</span>
        </div>
        <div className="advocate-actions">
          <span className={`availability-dot ${advocate.availability?.isAvailable ? 'available' : 'busy'}`}>
            {advocate.availability?.isAvailable ? 'Available' : 'Busy'}
          </span>
          <Link to={`/advocates/${advocate._id}`} className="btn btn-primary btn-sm">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdvocateCard;
