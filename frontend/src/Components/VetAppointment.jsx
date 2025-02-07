import React, { useState, useEffect } from "react";
import axios from "axios";
import "./../Views/Appointment.css";

const VetAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch appointments for the logged-in vet
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You are not logged in. Please log in as a vet.");
          window.location.href = "/login";
          return;
        }

        const response = await axios.get(
          "http://localhost:8084/api/appointments/vet",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Set the fetched appointments in state
        setAppointments(response.data.data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        if (error.response?.status === 401) {
          alert("You are not logged in. Please log in as a vet.");
          window.location.href = "/login";
        } else if (error.response?.status === 403) {
          alert("You are not authorized to access this page.");
          window.location.href = "/";
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Update appointment status (confirm or complete)
  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `http://localhost:8084/api/appointments/${id}/${status}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the appointment in the state
      setAppointments(
        appointments.map((appt) =>
          appt._id === id ? response.data.data : appt
        )
      );
    } catch (error) {
      console.error(`Error ${status} appointment:`, error);
      alert(`Failed to ${status} appointment. Please try again.`);
    }
  };

  // Display loading message while fetching data
  if (loading) return <div>Loading appointments...</div>;

  // Render the list of appointments
  return (
    <div className="appointments-container">
      <h2>Vet Appointments</h2>
      <div className="appointments-list">
        {appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          appointments.map((appt) => (
            <div key={appt._id} className="appointment-card vet-card">
              <div className="appointment-info">
                <p>Date: {new Date(appt.dateTime).toLocaleString()}</p>
                <p>Pet: {appt.pet}</p>
                <p>Owner: {appt.petOwner?.name}</p>
                <p>Status: {appt.status}</p>
                {appt.feedback && (
                  <div className="feedback-section">
                    <p>Rating: {appt.feedback.rating}/5</p>
                    <p>Comment: {appt.feedback.comment}</p>
                  </div>
                )}
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
          ))
        )}
      </div>
    </div>
  );
};

export default VetAppointments;
