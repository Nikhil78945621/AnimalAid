// Components/payment/PaymentSuccess.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./../../Views/PaymentResult.css";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const appointmentId = searchParams.get("appointmentId");

  // No need for useEffect or verifyPayment, as backend handles verification

  if (!appointmentId) {
    navigate("/appointments");
    return null;
  }

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
