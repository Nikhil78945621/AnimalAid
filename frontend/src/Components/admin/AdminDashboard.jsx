import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./../../Views/AdminDashboard.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVets: 0,
    totalAdmins: 0,
  });
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Verify admin role first
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      navigate("/");
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [usersRes, statsRes, applicationsRes] = await Promise.all([
        axios.get("https://animalaid-9duz.onrender.com/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://animalaid-9duz.onrender.com/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://animalaid-9duz.onrender.com/api/vet-applications/pending", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setUsers(usersRes.data.data);
      setStats(statsRes.data.data);
      setPendingApplications(applicationsRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to load dashboard data. Please try again.");
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `https://animalaid-9duz.onrender.com/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh data after update
    } catch (error) {
      console.error("Failed to update role:", error);
      setError("Failed to update user role. Please try again.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://animalaid-9duz.onrender.com/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData(); // Refresh data after deletion
    } catch (error) {
      console.error("Failed to delete user:", error);
      setError("Failed to delete user. Please try again.");
    }
  };

  const handleReviewApplication = async (applicationId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        "https://animalaid-9duz.onrender.com/api/vet-applications/review",
        { applicationId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh data after review
    } catch (error) {
      console.error("Failed to review application:", error);
      setError("Failed to review application. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Veterinarians</h3>
          <p>{stats.totalVets}</p>
        </div>
        <div className="stat-card">
          <h3>Admins</h3>
          <p>{stats.totalAdmins}</p>
        </div>
      </div>

      <div className="users-table-container">
        <h2>User Management</h2>
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className="role-select"
                  >
                    <option value="user">User</option>
                    <option value="vet">Veterinarian</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="applications-table-container">
        <h2>Vet Verification Requests</h2>
        {pendingApplications.length === 0 ? (
          <p>No pending vet applications.</p>
        ) : (
          <table className="applications-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email</th>
                <th>Qualifications</th>
                <th>Experience</th>
                <th>Specialty</th>
                <th>Submitted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApplications.map((app) => (
                <tr key={app._id}>
                  <td>{app.user?.name || "N/A"}</td>
                  <td>{app.user?.email || "N/A"}</td>
                  <td>{app.qualifications}</td>
                  <td>{app.experience}</td>
                  <td>{app.specialty}</td>
                  <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() =>
                        handleReviewApplication(app._id, "approved")
                      }
                      className="approve-btn"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleReviewApplication(app._id, "rejected")
                      }
                      className="reject-btn"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
