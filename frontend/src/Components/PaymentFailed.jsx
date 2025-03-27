import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./../Views/PaymentResult.css";

function PaymentFailure() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const appointmentId = searchParams.get("appointmentId");

  const handleRetry = () => {
    navigate(`/payment/${appointmentId}`);
  };

  return (
    <div className="payment-result failure">
      <h2>Payment Failed</h2>
      <p>There was an issue processing your payment.</p>
      <div className="button-group">
        <button onClick={handleRetry}>Try Again</button>
        <button onClick={() => navigate("/appointments")}>
          Back to Appointments
        </button>
      </div>
    </div>
  );
}

export default PaymentFailure;
