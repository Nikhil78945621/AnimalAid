import React, { useState, useEffect } from "react";
import axios from "axios";
import VetAppointments from "./VetAppointment"; // Ensure correct import
import "./../Views/VetDashboard.css";

const VetDashboard = () => {
  const [vetData, setVetData] = useState({
    fee: "",
    speciality: "",
    address: "",
    clinic: "",
  });
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const profileResponse = await axios.get(
          "http://localhost:8084/api/auth/profile",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const statsResponse = await axios.get(
          "http://localhost:8084/api/appointments/vet/stats",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setVetData({
          fee: profileResponse.data.fee || "",
          speciality: profileResponse.data.speciality || "",
          address: profileResponse.data.address || "",
          clinic: profileResponse.data.clinic || "",
        });

        setStats({
          totalAppointments: statsResponse.data.totalAppointments,
          totalIncome: statsResponse.data.totalIncome,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.patch("http://localhost:8084/api/auth/profile", vetData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="vet-dashboard">
      <div className="dashboard-header">
        <h1>Veterinarian Dashboard</h1>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p>{stats.totalAppointments}</p>
        </div>
        <div className="stat-card">
          <h3>Total Income</h3>
          <p>${stats.totalIncome}</p>
        </div>
      </div>

      <div className="profile-section">
        <h2>Professional Profile</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-row">
            <label>
              Hourly Fee ($):
              <input
                type="number"
                value={vetData.fee}
                onChange={(e) =>
                  setVetData({ ...vetData, fee: e.target.value })
                }
                required
              />
            </label>

            <label>
              Speciality:
              <input
                type="text"
                value={vetData.speciality}
                onChange={(e) =>
                  setVetData({ ...vetData, speciality: e.target.value })
                }
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Clinic Address:
              <input
                type="text"
                value={vetData.address}
                onChange={(e) =>
                  setVetData({ ...vetData, address: e.target.value })
                }
                required
              />
            </label>

            <label>
              Clinic Name:
              <input
                type="text"
                value={vetData.clinic}
                onChange={(e) =>
                  setVetData({ ...vetData, clinic: e.target.value })
                }
              />
            </label>
          </div>

          <button type="submit" className="update-btn">
            Update Profile
          </button>
        </form>
      </div>

      <div className="appointments-section">
        <VetAppointments stats={stats} setStats={setStats} />
      </div>
    </div>
  );
};

export default VetDashboard;
