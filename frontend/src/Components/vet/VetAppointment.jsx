import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./../../Views/Appointment.css";

const VetAppointments = ({ stats, setStats }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Redirecting to login.");
        navigate("/login");
        return;
      }

      // Check token expiry
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        console.error("Token expired. Redirecting to login.");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:8084/api/appointments/vet",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAppointments(response.data.data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        if (error.response?.status === 401) {
          console.error("Unauthorized. Redirecting to login.");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [navigate]);

  const updateStatus = async (id, action) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Redirecting to login.");
      navigate("/login");
      return;
    }

    // Check token expiry
    const decodedToken = jwtDecode(token);
    if (decodedToken.exp * 1000 < Date.now()) {
      console.error("Token expired. Redirecting to login.");
      navigate("/login");
      return;
    }

    try {
      await axios.patch(
        `http://localhost:8084/api/appointments/${id}/${action}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh appointments list
      const appointmentsResponse = await axios.get(
        "http://localhost:8084/api/appointments/vet",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments(appointmentsResponse.data.data);

      // Refresh stats
      if (setStats) {
        const statsResponse = await axios.get(
          "http://localhost:8084/api/appointments/vet/stats",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStats({
          totalAppointments: statsResponse.data.totalAppointments,
          totalIncome: statsResponse.data.totalIncome,
        });
      }
    } catch (error) {
      console.error(`Error ${action} appointment:`, error);
      if (error.response?.status === 401) {
        console.error("Unauthorized. Redirecting to login.");
        navigate("/login");
      }
    }
  };

  if (loading) return <div>Loading appointments...</div>;

  return (
    <div className="appointments-container">
      <div className="appointments-list">
        {appointments.map((appt) => (
          <div key={appt._id} className="appointment-card vet-card">
            <div className="appointment-info">
              <p>Date: {new Date(appt.dateTime).toLocaleString()}</p>
              <p>Pet Type: {appt.pet}</p>
              <p>Reason: {appt.notes || "No additional notes"}</p>
              <p>Owner: {appt.petOwner?.name}</p>
              <p>Status: {appt.status}</p>
            </div>
            <div className="appointment-actions">
              {appt.status === "pending" && (
                <button onClick={() => updateStatus(appt._id, "confirm")}>
                  Confirm
                </button>
              )}
              {appt.status === "confirmed" && (
                <button onClick={() => updateStatus(appt._id, "complete")}>
                  Complete
                </button>
              )}
              {(appt.status === "pending" || appt.status === "confirmed") && (
                <button onClick={() => updateStatus(appt._id, "cancel-vet")}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VetAppointments;
