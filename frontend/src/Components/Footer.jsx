import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import "./../Views/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section about-us">
          <div className="section-divider-upper"></div>
          <h3>About Us</h3>
          <div className="section-divider"></div>
          <p>
            Animal Healthcare provides comprehensive veterinary services for
            pets and livestock, ensuring the best care for your animals with our
            team of experienced professionals.
          </p>
          <div className="social-icons">
            <a href="https://facebook.com" aria-label="Facebook">
              <FaFacebook />
            </a>
            <a href="https://twitter.com" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="https://instagram.com" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://linkedin.com" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
          </div>
        </div>

        <div className="footer-section quick-links">
          <div className="section-divider-upper"></div>
          <h3>Quick Links</h3>
          <div className="section-divider"></div>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/service">Services</Link>
            </li>
            <li>
              <Link to="/appointments">Appointments</Link>
            </li>
            <li>
              <Link to="/home-visit">Home Visit</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Services</h3>
          <div className="section-divider"></div>
          <ul>
            <li>
              <Link to="/services/Eye Care">Eye Care</Link>
            </li>
            <li>
              <Link to="/services/livestock">Livestock</Link>
            </li>
            <li>
              <Link to="/services/surgery">Surgery</Link>
            </li>
            <li>
              <Link to="/services/vaccination">Vaccination</Link>
            </li>
            <li>
              <Link to="/services/emergency">Emergency Care</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section contact-us">
          <div className="section-divider-upper"></div>
          <h3>Contact Us</h3>
          <div className="section-divider"></div>
          <ul className="contact-info">
            <li>
              <FaMapMarkerAlt /> 123 Vet Street, Kathmandu, Nepal
            </li>
            <li>
              <FaPhone /> +977 9841234567
            </li>
            <li>
              <FaEnvelope /> info@animalhealthcare.com
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="copyright-divider"></div>
        <p>
          © {new Date().getFullYear()} Animal Healthcare. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
