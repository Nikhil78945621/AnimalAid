import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./../Views/PaymentResult.css";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const appointmentId = searchParams.get("appointmentId");

  useEffect(() => {
    if (!appointmentId) {
      navigate("/appointments");
      return;
    }

    const verifyPayment = async () => {
      try {
        await axios.get(
          `http://localhost:8084/api/appointments/payment/verify/${appointmentId}`
        );
      } catch (error) {
        console.error("Payment verification failed:", error);
      }
    };

    verifyPayment();
  }, [appointmentId, navigate]);

  return (
    <div className="payment-result success">
      <h2>Payment Successful!</h2>
      <p>Your appointment has been confirmed.</p>
      <div className="button-group">
        <button onClick={() => navigate(`/appointments`)}>
          View Appointments
        </button>

        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
