// src/Components/Navbar.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  // Fetch notifications periodically when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 300000); // Every 5 minutes
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Debounced search for vets
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `http://localhost:8084/api/appointments/vets/search?name=${encodeURIComponent(
              searchQuery
            )}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setSearchResults(response.data.data || []);
          setShowResults(true);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
          setShowResults(true);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8084/api/appointments/notifications",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark all notifications as read
  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        "http://localhost:8084/api/appointments/notifications/mark-read",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
    window.location.reload();
  };

  return (
    <nav className="navbar">
      {/* Logo Section */}
      <div className="navbar-logo">
        <Link to="/">
          <img src="logo.png" alt="Logo" className="logo" />
        </Link>
      </div>

      {/* Navigation Links */}
      <ul className="navbar-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        {isLoggedIn && role === "admin" && (
          <li>
            <Link to="/admin-dashboard">Admin Dashboard</Link>
          </li>
        )}
        {isLoggedIn && role === "admin" && (
          <li>
            <Link to="/service-approvals ">Approve Services</Link>
          </li>
        )}
        {isLoggedIn && role === "user" && (
          <li className="dropdown">
            <span className="dropdown-toggle">Appointments</span>
            <div className="dropdown-content">
              <Link to="/appointments">My Appointments</Link>
              <Link to="/appointments/new">Book Appointment</Link>
            </div>
          </li>
        )}
        {isLoggedIn && role === "vet" && (
          <li className="dropdown">
            <span className="dropdown-toggle">Vet Appointment</span>
            <div className="dropdown-content">
              <Link to="/vet-dashboard">Vet Dashboard</Link>
              <Link to="/vet-appointments ">Vet Appointments</Link>
            </div>
          </li>
        )}

        {isLoggedIn && role === "user" && (
          <li className="dropdown">
            <span className="dropdown-toggle"> Home Visit</span>
            <div className="dropdown-content">
              <Link to="/home-visit"> Home Visit</Link>
              <Link to="/my-requests"> Chat</Link>
            </div>
          </li>
        )}
        {isLoggedIn && role === "vet" && (
          <li className="dropdown">
            <span className="dropdown-toggle">Vet Home visit</span>
            <div className="dropdown-content">
              <Link to="/vet-home-visit">Home Visit Requests</Link>
              <Link to="/vet-Chat">Vet Chat</Link>
            </div>
          </li>
        )}
        <li>
          <Link to="/service">Services</Link>
        </li>
        <li>
          <Link to="/About">About Us</Link>
        </li>
      </ul>

      {/* Right Section: Search, Notifications, Profile, Auth */}
      <div className="navbar-right">
        {/* Search Bar */}
        <div className="search-container" ref={searchRef}>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search vets by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
              aria-label="Search veterinarians"
            />
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
          </div>
          {showResults && (
            <div className="search-results-dropdown">
              {searchResults.length > 0 ? (
                searchResults.map((vet) => (
                  <div className="vet-card" key={vet._id}>
                    <h4>{vet.name}</h4>
                    <p>Speciality: {vet.speciality || "N/A"}</p>
                    <p>Fee: Rs.{vet.fee || "N/A"}</p>
                  </div>
                ))
              ) : (
                <div className="no-results">No vets found</div>
              )}
            </div>
          )}
        </div>

        {/* Authenticated User Actions */}
        {isLoggedIn ? (
          <div className="profile-section">
            {/* Notifications */}
            <div className="notification-container" ref={notificationRef}>
              <button
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="View notifications"
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
                  {notifications.length > 0 && (
                    <button
                      className="mark-read-btn"
                      onClick={markNotificationsAsRead}
                    >
                      Mark All as Read
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Profile Button */}
            <button
              className="profile-btn"
              onClick={() => setShowProfileModal(true)}
              aria-label="View profile"
            >
              <i className="fa-solid fa-user"></i>
            </button>

            {/* Logout Button */}
            <button
              className="logout-btn"
              onClick={handleLogout}
              aria-label="Log out"
            >
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

      {/* Profile Modal */}
      <ProfileModal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </nav>
  );
};

export default Navbar;
