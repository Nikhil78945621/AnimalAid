// Components/payment/KhaltiPayment.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./../../Views/ESEWAPayment.css";

function KhaltiPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointment } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initiatePayment = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.post(
        "http://localhost:8084/api/appointments/payment/khalti-initiate",
        {
          appointmentId: appointment?._id,
          amount: appointment?.veterinarian.fee,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.data.payment_url) {
        window.location.href = response.data.data.payment_url;
      }
    } catch (error) {
      console.error("Error initiating Khalti payment:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(error.response?.data?.message || "Failed to initiate payment");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!appointment) {
      navigate("/appointments");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [appointment, navigate]);

  if (!appointment) {
    return (
      <div className="khalti-container">
        <p>No appointment data found. Please book an appointment first.</p>
        <button onClick={() => navigate("/appointments")}>
          Back to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className="khalti-container">
      <h2>Pay with Khalti</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="payment-summary">
        <h3>Appointment Summary</h3>
        <p>Veterinarian: {appointment.veterinarian.name}</p>
        <p>Fee: Rs. {appointment.veterinarian.fee}</p>
        <p>Date: {new Date(appointment.dateTime).toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="loading">Processing payment...</div>
      ) : (
        <button onClick={initiatePayment} className="khalti-button">
          Pay Rs. {appointment.veterinarian.fee} with Khalti
        </button>
      )}
    </div>
  );
}

export default KhaltiPayment;
