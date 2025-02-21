import React, { useState, useEffect } from "react";
import axios from "axios";
import "./../Views/Appointment.css";

const VetAppointments = ({ stats, setStats }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:8084/api/appointments/vet",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAppointments(response.data.data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      // Update appointment status
      await axios.patch(
        `http://localhost:8084/api/appointments/${id}/${status}`,
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
      const statsResponse = await axios.get(
        "http://localhost:8084/api/appointments/vet/stats",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats({
        totalAppointments: statsResponse.data.totalAppointments,
        totalIncome: statsResponse.data.totalIncome,
      });
    } catch (error) {
      console.error(`Error ${status} appointment:`, error);
    }
  };

  if (loading) return <div>Loading appointments...</div>;

  return (
    <div className="appointments-container">
      <h2>Appointments</h2>
      <div className="appointments-list">
        {appointments.map((appt) => (
          <div key={appt._id} className="appointment-card vet-card">
            <div className="appointment-info">
              <p>Date: {new Date(appt.dateTime).toLocaleString()}</p>
              <p>Pet: {appt.pet}</p>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VetAppointments;
