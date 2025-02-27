import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProfileModal from "./ProfileModal";
import axios from "axios";
import "./../Views/Navbar.css";

const Navbar = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      // Refresh notifications every 5 minutes
      const interval = setInterval(fetchNotifications, 300000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8084/api/appointments/notifications",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setNotifications(response.data.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
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
          <Link to="/About">About Us</Link>
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
            <div className="notification-container">
              <button
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="fa-regular fa-bell"></i>
                {notifications.length > 0 && (
                  <span className="notification-badge">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  {notifications.length === 0 ? (
                    <div className="notification-item">No notifications</div>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="notification-item">
                        <div className="notification-message">
                          {notification.message}
                        </div>
                        <div className="notification-time">
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
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
