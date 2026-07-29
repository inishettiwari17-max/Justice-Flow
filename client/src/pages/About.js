import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => (
  <div className="about-page">
    <div className="page-header">
      <div className="container">
        <h1>About LegalConnect</h1>
        <p>Making legal help accessible for every Indian citizen</p>
      </div>
    </div>

    <section className="section">
      <div className="container about-grid">
        <div className="about-text">
          <h2>Our Mission</h2>
          <p>LegalConnect was built with one goal: to bridge the gap between citizens who need legal help and qualified advocates who can provide it. We believe that access to justice shouldn't be limited by geography, language, or budget.</p>
          <p>Our platform makes it easy to find, vet, and connect with the right legal professional — whether you're facing a criminal charge, a property dispute, a family matter, or a complex corporate issue.</p>
          <h2 className="mt-4">What We Do</h2>
          <ul className="about-list">
            <li>✅ Verify every advocate's credentials and enrollment before listing</li>
            <li>✅ Enable transparent ratings and reviews from real clients</li>
            <li>✅ Provide secure, encrypted messaging between clients and advocates</li>
            <li>✅ Allow consultation requests to be made entirely online</li>
            <li>✅ Support 12+ regional languages for wider accessibility</li>
          </ul>
        </div>
        <div className="about-visual">
          <div className="about-card">
            <div className="about-stat-grid">
              {[['500+', 'Verified Advocates'], ['2000+', 'Cases Helped'], ['20', 'Legal Specialties'], ['4.8★', 'Avg. Rating']].map(([v, l]) => (
                <div key={l} className="about-stat">
                  <div className="about-stat-val">{v}</div>
                  <div className="about-stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="section" style={{ background: 'var(--gray-50)' }}>
      <div className="container">
        <h2 className="text-center mb-3">Our Values</h2>
        <div className="grid grid-3">
          {[
            ['🔒', 'Trust & Safety', 'Every advocate is manually verified. Every review is moderated. Your data is encrypted and never sold.'],
            ['⚖️', 'Fairness', 'We believe everyone deserves access to quality legal help regardless of background or location.'],
            ['💡', 'Transparency', 'Fees, experience, ratings, and case history are all visible upfront — no surprises.']
          ].map(([icon, title, desc]) => (
            <div key={title} className="card card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container text-center">
        <h2>Ready to Get Started?</h2>
        <p style={{ color: 'var(--gray-600)', margin: '0.75rem 0 2rem', fontSize: '1.05rem' }}>
          Join thousands of citizens and advocates already on the platform.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
          <Link to="/advocates" className="btn btn-outline btn-lg">Browse Advocates</Link>
        </div>
      </div>
    </section>
  </div>
);

export default About;
