import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Contact.css';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error('Please fill all required fields');
    setSent(true);
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Have questions or feedback? We'd love to hear from you.</p>
        </div>
      </div>

      <section className="section">
        <div className="container contact-grid">
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <p>Our support team is available Monday to Friday, 9am - 6pm IST. We typically respond within 24 hours.</p>
            <div className="contact-details">
              {[
                [<FiMail />, 'Email', 'support@legalconnect.in'],
                [<FiPhone />, 'Phone', '+91 98765 43210'],
                [<FiMapPin />, 'Office', 'Bengaluru, Karnataka, India']
              ].map(([icon, label, val]) => (
                <div key={label} className="contact-detail-item">
                  <span className="contact-icon">{icon}</span>
                  <div>
                    <strong>{label}</strong>
                    <p>{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="contact-form card card-body">
            <h3>Send Us a Message</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" className="form-control" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input type="text" className="form-control" placeholder="What is this about?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Message *</label>
                <textarea className="form-control" rows={5} placeholder="Tell us how we can help..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={sent}>
                <FiSend size={15} /> {sent ? 'Message Sent!' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
