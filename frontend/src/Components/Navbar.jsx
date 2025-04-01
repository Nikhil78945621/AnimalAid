import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProfileModal from "./ProfileModal";
import axios from "axios";
import "./../Views/Navbar.css";

const Navbar = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Fetch notifications
  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 300000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `http://localhost:8084/api/appointments/vets/search?name=${searchQuery}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setSearchResults(response.data.data);
          setShowResults(true);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".search-container")) {
        setShowResults(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8084/api/appointments/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNotifications(response.data.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        "http://localhost:8084/api/appointments/notifications/mark-read",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
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
        {isLoggedIn && role === "user" && (
          <li className="dropdown">
            <a href="#appointments">Appointments</a>
            <div className="dropdown-content">
              <Link to="/appointments">My Appointments</Link>
              <Link to="/appointments/new">Book Appointment</Link>
              <Link to="/home-visit">Home Visit Request</Link>
            </div>
          </li>
        )}
        {isLoggedIn && role === "vet" && (
          <li className="dropdown">
            <a href="/vet-appointments">Vet appointment</a>
            <div className="dropdown-content">
              <Link to="/vet-dashboard">Vet Dashboard</Link>
              <Link to="/vet-home-visit">Home Visit Requests</Link>
            </div>
          </li>
        )}
        <li>
          <Link to="/service">Services</Link>
        </li>
        <li>
          <Link to="/About">About Us</Link>
        </li>
        <li>
          <a href="#contact">Contact Us</a>
        </li>
      </ul>
      <div className="navbar-right">
        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search vets by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => setShowResults(true)}
            />
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
          </div>

          {showResults && searchQuery && (
            <div className="search-results-dropdown">
              {searchResults.length > 0 ? (
                searchResults.map((vet) => (
                  <div className="vet-card" key={vet._id}>
                    <h4>{vet.name}</h4>
                    <p>Speciality: {vet.speciality}</p>
                    <p>Fee: Rs.{vet.fee}</p>
                  </div>
                ))
              ) : (
                <div className="no-results">No vets found</div>
              )}
            </div>
          )}
        </div>
        {isLoggedIn ? (
          <div className="profile-section">
            <div className="notification-container">
              <button
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="fa-regular fa-bell"></i>
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="notification-badge">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  {notifications.length === 0 ? (
                    <div className="notification-item">No notifications</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`notification-item ${
                          notification.read ? "read" : "unread"
                        }`}
                      >
                        <div className="notification-message">
                          {notification.message}
                        </div>
                        <div className="notification-time">
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    className="mark-read-btn"
                    onClick={markNotificationsAsRead}
                  >
                    Mark All as Read
                  </button>
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
