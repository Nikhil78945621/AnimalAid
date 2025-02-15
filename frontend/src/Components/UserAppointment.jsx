import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import "./../Views/Appointment.css";

const UserAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:8084/api/appointments/user",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAppointments(response.data.data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        if (error.response?.status === 403) {
          alert("You are not authorized to access this page.");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [location.state?.refresh]);

  const handleCancel = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:8084/api/appointments/${id}/cancel`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAppointments(
        appointments.map((appt) =>
          appt._id === id ? { ...appt, status: "cancelled" } : appt
        )
      );
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  const handleFeedback = async (id, feedback) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `http://localhost:8084/api/appointments/${id}/feedback`,
        feedback,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments(
        appointments.map((appt) =>
          appt._id === id ? response.data.data : appt
        )
      );
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const handlePayment = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `http://localhost:8084/api/appointments/${id}/payment`,
        { status: "paid" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments(
        appointments.map((appt) =>
          appt._id === id ? response.data.data : appt
        )
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  if (loading) return <div>Loading appointments...</div>;

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h2>My Appointments</h2>
        <Link to="/appointments/new" className="new-appointment-button">
          + New Appointment
        </Link>
      </div>
      <div className="appointments-list">
        {appointments.map((appt) => {
          const payment = appt.payment || { amount: 0, status: "pending" }; // Default value
          return (
            <div key={appt._id} className="appointment-card">
              <div className="appointment-info">
                <p>Date: {new Date(appt.dateTime).toLocaleString()}</p>
                <p>Pet: {appt.pet}</p>
                <p>Status: {appt.status}</p>
                <p>Vet: {appt.veterinarian?.name}</p>
                <p>Address: {appt.address}</p>
                <p>Fee: ${payment.amount}</p>
                <p>Payment Status: {payment.status}</p>
              </div>
              <div className="appointment-actions">
                {["pending", "confirmed"].includes(appt.status) && (
                  <button onClick={() => handleCancel(appt._id)}>Cancel</button>
                )}
                {appt.status === "completed" && !appt.feedback && (
                  <FeedbackForm appointment={appt} onSubmit={handleFeedback} />
                )}
                {payment.status === "pending" && (
                  <button onClick={() => handlePayment(appt._id)}>
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FeedbackForm = ({ appointment, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(appointment._id, { rating, comment });
  };

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <select value={rating} onChange={(e) => setRating(e.target.value)}>
        {[1, 2, 3, 4, 5].map((num) => (
          <option key={num} value={num}>
            {num} Stars
          </option>
        ))}
      </select>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Enter your feedback..."
      />
      <button type="submit">Submit Feedback</button>
    </form>
  );
};

export default UserAppointments;
