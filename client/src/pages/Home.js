import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShield, FiStar, FiUsers, FiCheckCircle, FiArrowRight, FiMessageSquare } from 'react-icons/fi';
import api from '../utils/api';
import AdvocateCard from '../components/advocates/AdvocateCard';
import { SPECIALTIES } from '../utils/helpers';
import './Home.css';

const STATS = [
  { icon: <FiUsers size={28} />, value: '500+', label: 'Verified Advocates' },
  { icon: <FiCheckCircle size={28} />, value: '2,000+', label: 'Cases Resolved' },
  { icon: <FiStar size={28} />, value: '4.8/5', label: 'Average Rating' },
  { icon: <FiShield size={28} />, value: '100%', label: 'Secure & Private' }
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Describe Your Case', desc: 'Tell us about your legal issue and what kind of help you need.' },
  { step: '02', title: 'Browse Advocates', desc: 'Filter by specialty, location, language, experience, and fee.' },
  { step: '03', title: 'Connect & Consult', desc: 'Message advocates directly and request a consultation online.' },
  { step: '04', title: 'Get Legal Help', desc: 'Work with your chosen advocate to resolve your legal matter.' }
];

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredAdvocates, setFeaturedAdvocates] = useState([]);
  const [loadingAdvocates, setLoadingAdvocates] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get('/advocates?sort=rating&limit=6');
        setFeaturedAdvocates(data.data || []);
      } catch {
        // silently fail on home page
      } finally {
        setLoadingAdvocates(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/advocates?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-overlay" />
        <div className="container hero-content">
          <div className="hero-badge">⚖️ India's Trusted Legal Platform</div>
          <h1 className="hero-title">
            Find the Right <span className="hero-accent">Advocate</span><br />
            for Your Legal Needs
          </h1>
          <p className="hero-subtitle">
            Connect with verified, experienced advocates across India. Filter by specialty, location, language, and fee. Get expert legal help from the comfort of your home.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <div className="search-input-wrap">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, specialty, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="btn btn-accent btn-lg">Find Advocate</button>
          </form>

          <div className="hero-specialties">
            {SPECIALTIES.slice(0, 8).map((s) => (
              <Link key={s} to={`/advocates?specialty=${encodeURIComponent(s)}`} className="specialty-pill">
                {s}
              </Link>
            ))}
            <Link to="/advocates" className="specialty-pill more">More →</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>How LegalConnect Works</h2>
            <p>Simple steps to connect with the right legal professional</p>
          </div>
          <div className="how-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="how-card">
                <div className="step-num">{step.step}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && <div className="step-arrow"><FiArrowRight /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Advocates */}
      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Top-Rated Advocates</h2>
              <p>Browse highly rated legal professionals in your area</p>
            </div>
            <Link to="/advocates" className="btn btn-outline">View All <FiArrowRight /></Link>
          </div>

          {loadingAdvocates ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : featuredAdvocates.length > 0 ? (
            <div className="grid grid-3">
              {featuredAdvocates.map((adv) => (
                <AdvocateCard key={adv._id} advocate={adv} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Advocates will appear here once verified.</p>
              <Link to="/register?role=advocate" className="btn btn-primary mt-2">Join as Advocate</Link>
            </div>
          )}
        </div>
      </section>

      {/* Why choose us */}
      <section className="section why-section">
        <div className="container">
          <div className="why-grid">
            <div className="why-content">
              <h2>Why Choose LegalConnect?</h2>
              <p>We make legal help accessible, transparent, and trustworthy for everyone.</p>
              <ul className="why-list">
                {[
                  ['🔒', 'Verified Advocates', 'Every advocate is manually verified with enrollment documents'],
                  ['⭐', 'Genuine Reviews', 'Real ratings from verified clients, moderated for quality'],
                  ['💬', 'Secure Chat', 'End-to-end encrypted messaging between you and your advocate'],
                  ['📍', 'Pan-India Coverage', 'Advocates from every state and district across India'],
                  ['💰', 'Transparent Fees', 'See consultation fees upfront — no hidden charges'],
                  ['📱', 'Mobile Friendly', 'Access from any device, anywhere, anytime']
                ].map(([icon, title, desc]) => (
                  <li key={title} className="why-item">
                    <span className="why-icon">{icon}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="why-visual">
              <div className="trust-card">
                <div className="trust-icon">🏛️</div>
                <h3>Trusted by Thousands</h3>
                <p>Join over 2,000 citizens who found the right legal help through LegalConnect.</p>
                <div className="trust-avatars">
                  {['A','B','C','D','E'].map((l) => (
                    <span key={l} className="trust-av">{l}</span>
                  ))}
                  <span className="trust-count">+2000</span>
                </div>
                <Link to="/register" className="btn btn-primary btn-full mt-3">Get Started Free</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="section specialty-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Browse by Legal Specialty</h2>
            <p>Find advocates who specialize in your area of law</p>
          </div>
          <div className="specialty-grid">
            {SPECIALTIES.map((s) => (
              <Link key={s} to={`/advocates?specialty=${encodeURIComponent(s)}`} className="specialty-card">
                <span className="specialty-name">{s}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-grid">
            <div className="cta-card cta-user">
              <FiMessageSquare size={36} className="cta-icon" />
              <h3>Need Legal Help?</h3>
              <p>Create a free account and connect with verified advocates in minutes.</p>
              <Link to="/register" className="btn btn-white">Register as User</Link>
            </div>
            <div className="cta-card cta-advocate">
              <FiShield size={36} className="cta-icon" />
              <h3>Are You an Advocate?</h3>
              <p>List your profile, get verified, and receive consultation requests from clients.</p>
              <Link to="/register?role=advocate" className="btn btn-accent">Join as Advocate</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
