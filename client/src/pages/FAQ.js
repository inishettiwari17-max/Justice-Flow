import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import './FAQ.css';

const FAQS = [
  { q: 'How does advocate verification work?', a: 'Every advocate is required to upload their Bar Council enrollment certificate and other identification documents. Our admin team reviews these documents before approving the profile. Verified advocates receive a Verified badge on their profiles.' },
  { q: 'Is using LegalConnect free?', a: 'Creating an account and browsing advocates is completely free. Consultation fees are set by individual advocates and are transparently displayed on their profiles. We do not add any hidden charges.' },
  { q: 'How do I request a consultation?', a: 'Visit the advocate\'s profile page, click "Request Consultation", fill in your case details and preferred date, and submit. The advocate will receive your request and can accept, reject, or message you for more details.' },
  { q: 'Can I chat with an advocate before hiring?', a: 'Yes. Once you create an account, you can send a message to any advocate directly through our secure in-built chat system, free of charge.' },
  { q: 'How are reviews verified?', a: 'Only registered users can submit reviews. All reviews are moderated by our admin team to remove fake or abusive content. We take review integrity seriously.' },
  { q: 'Is my personal information safe?', a: 'Yes. We use industry-standard encryption for data storage and transmission. Your personal information and chat history are private and never shared with third parties.' },
  { q: 'I\'m an advocate. How do I register?', a: 'Click "Join as Advocate" on the homepage or register page, fill in your details including your enrollment number, then log in to your dashboard to complete your profile and upload your verification documents.' },
  { q: 'Can I change my profile information?', a: 'Yes. You can update your profile information anytime from your dashboard. Advocates can update their bio, specialties, fees, and availability. Users can update their contact info and preferences.' },
  { q: 'What if I have a problem with a consultation?', a: 'You can report any issue through our Contact page or flag it to our admin. We have a dispute moderation process to help resolve any problems between users and advocates.' },
  { q: 'Does LegalConnect provide legal advice?', a: 'No. LegalConnect is a platform that connects you with licensed advocates. The platform itself does not provide legal advice. Any legal guidance you receive comes directly from the advocate you hire.' }
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <FiChevronDown className={`faq-chevron ${open ? 'rotated' : ''}`} size={18} />
      </button>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  );
};

const FAQ = () => (
  <div>
    <div className="page-header">
      <div className="container">
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about LegalConnect</p>
      </div>
    </div>
    <section className="section">
      <div className="container faq-container">
        {FAQS.map((f, i) => <FAQItem key={i} {...f} />)}
      </div>
    </section>
  </div>
);

export default FAQ;
