import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">⚖️ LegalConnect</Link>
          <p>India's trusted platform connecting citizens with verified legal professionals. Get the right legal help, fast.</p>
          <div className="footer-social">
            <a href="#!" aria-label="Twitter">🐦</a>
            <a href="#!" aria-label="LinkedIn">💼</a>
            <a href="#!" aria-label="Facebook">📘</a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Platform</h4>
          <Link to="/advocates">Find Advocates</Link>
          <Link to="/about">About Us</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="footer-col">
          <h4>For Advocates</h4>
          <Link to="/register?role=advocate">Join as Advocate</Link>
          <Link to="/advocate/dashboard">Advocate Dashboard</Link>
          <Link to="/faq">Verification Process</Link>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <Link to="#">Privacy Policy</Link>
          <Link to="#">Terms of Service</Link>
          <Link to="#">Disclaimer</Link>
          <Link to="#">Cookie Policy</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} LegalConnect. All rights reserved.</p>
        <p>Not a law firm. We connect you with licensed advocates.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
