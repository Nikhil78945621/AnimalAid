import React, { useState } from "react";
import { Link } from "react-router-dom";
import ProfileModal from "./ProfileModal";
import "./../Views/Navbar.css";

const Navbar = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="logo.png" alt="Logo" className="logo" />
      </div>
      <ul className="navbar-links">
        <li>
          <a href="/">Home</a>
        </li>
        {isLoggedIn && (
          <li>
            <Link to={role === "vet" ? "/vet-dashboard" : "/appointments"}>
              Appointments
            </Link>
          </li>
        )}
        <li>
          <a href="#services">Services</a>
        </li>
        <li>
          <Link to="/About">About Us</Link> {/* ✅ Correct */}
        </li>

        <li>
          <a href="#contact">Contact Us</a>
        </li>
      </ul>
      <div className="navbar-right">
        <div className="search-bar">
          <input type="text" placeholder="Search.." />
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
        </div>
        {isLoggedIn ? (
          <div className="profile-section">
            <button
              className="profile-btn"
              onClick={() => setShowProfileModal(true)}
            >
              <i className="fa-solid fa-user"></i>
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="signup-btn">
              <Link to="/signup" className="signup-link">
                Sign Up
              </Link>
            </button>
          </div>
        )}
      </div>
      <ProfileModal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </nav>
  );
};

export default Navbar;
