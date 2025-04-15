// src/Components/ProfileModal.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./../Views/ProfileModel.css";

const ProfileModal = ({ show, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateMessage, setUpdateMessage] = useState("");

  // Fetch profile data when modal opens
  useEffect(() => {
    if (show) {
      fetchProfile();
    }
  }, [show]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8084/api/auth/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("API Response:", response.data); // Debug the full response
      const userData = response.data.data.user;
      console.log("User Data:", userData); // Debug the extracted user data
      setProfile(userData);
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
        ...(userData.role === "vet" && {
          speciality: userData.speciality || "",
          fee: userData.fee || "",
          clinic: userData.clinic || "",
          postalCode: userData.postalCode || "",
        }),
      });
      setLoading(false);
    } catch (err) {
      console.error("Fetch Profile Error:", err.response?.data || err.message); // Debug the error
      setError("Failed to load profile.");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setUpdateMessage("");
      const token = localStorage.getItem("token");
      await axios.patch("http://localhost:8084/api/auth/profile", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpdateMessage("Profile updated successfully!");
      setIsEditing(false);
      await fetchProfile(); // Refresh profile data
    } catch (err) {
      setUpdateMessage("Failed to update profile.");
    } finally {
      setLoading(false);
      setTimeout(() => setUpdateMessage(""), 3000); // Clear message after 3s
    }
  };

  if (!show) return null;

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close profile modal"
        >
          ×
        </button>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            {isEditing ? (
              <div className="update-profile-form">
                <h2>Update Profile</h2>
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-grid">
                    <label>
                      Name:
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        aria-required="true"
                      />
                    </label>
                    <label>
                      Email:
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        aria-required="true"
                      />
                    </label>
                    <label>
                      Phone:
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </label>
                    <label>
                      Address:
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </label>
                  </div>
                  {profile.role === "vet" && (
                    <>
                      <h3>Vet Details</h3>
                      <div className="form-grid">
                        <label>
                          Speciality:
                          <input
                            type="text"
                            name="speciality"
                            value={formData.speciality}
                            onChange={handleInputChange}
                          />
                        </label>
                        <label>
                          Fee:
                          <input
                            type="number"
                            name="fee"
                            value={formData.fee}
                            onChange={handleInputChange}
                            min="0"
                          />
                        </label>
                        <label>
                          Clinic:
                          <input
                            type="text"
                            name="clinic"
                            value={formData.clinic}
                            onChange={handleInputChange}
                          />
                        </label>
                        <label>
                          Postal Code:
                          <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                          />
                        </label>
                      </div>
                    </>
                  )}
                  <div className="form-buttons">
                    <button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                {updateMessage && (
                  <div
                    className={`update-message ${
                      updateMessage.includes("Failed") ? "error" : "success"
                    }`}
                  >
                    {updateMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className="profile-details">
                <h2>My Profile</h2>
                <div className="profile-field">
                  <strong>Name:</strong> {profile.name || "N/A"}
                </div>
                <div className="profile-field">
                  <strong>Email:</strong> {profile.email || "N/A"}
                </div>
                {profile.phone && (
                  <div className="profile-field">
                    <strong>Phone:</strong> {profile.phone}
                  </div>
                )}
                {profile.address && (
                  <div className="profile-field">
                    <strong>Address:</strong> {profile.address}
                  </div>
                )}
                <div className="profile-field">
                  <strong>Role:</strong>{" "}
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </div>
                {profile.role === "vet" && (
                  <>
                    <div className="profile-field">
                      <strong>Speciality:</strong>{" "}
                      {profile.speciality || "Not specified"}
                    </div>
                    <div className="profile-field">
                      <strong>Fee:</strong>{" "}
                      {profile.fee ? `Rs.${profile.fee}` : "Not specified"}
                    </div>
                    <div className="profile-field">
                      <strong>Postal Code:</strong>{" "}
                      {profile.postalCode || "Not specified"}
                    </div>
                    {profile.clinic && (
                      <div className="profile-field">
                        <strong>Clinic:</strong> {profile.clinic}
                      </div>
                    )}
                  </>
                )}
                <button
                  className="update-profile-btn"
                  onClick={() => setIsEditing(true)}
                >
                  Update Profile
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
