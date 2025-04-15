import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./../../Views/ESEWAPayment.css";

function ESEWAPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointment } = location.state || {};

  const [formData, setFormData] = useState({
    amount: appointment?.veterinarian.fee || "0",
    tax_amount: "0",
    total_amount: appointment?.veterinarian.fee || "0",
    transaction_uuid: uuidv4(),
    product_code: "EPAYTEST",
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: `${window.location.origin}/payment/success?appointmentId=${appointment?._id}`,
    failure_url: `${window.location.origin}/payment/failure?appointmentId=${appointment?._id}`,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSignature = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.post(
        "http://localhost:8084/api/appointments/payment/generate-signature",
        {
          total_amount: formData.total_amount,
          transaction_uuid: formData.transaction_uuid,
          product_code: formData.product_code,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.signature) {
        setFormData((prev) => ({
          ...prev,
          signature: response.data.signature,
        }));
      }
    } catch (error) {
      console.error("Error generating signature:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to generate payment signature"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    formData.total_amount,
    formData.transaction_uuid,
    formData.product_code,
    navigate,
  ]);

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

    generateSignature();
  }, [appointment, navigate, generateSignature]);

  if (!appointment) {
    return (
      <div className="esewa-container">
        <p>No appointment data found. Please book an appointment first.</p>
        <button onClick={() => navigate("/appointments")}>
          Back to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className="esewa-container">
      <h2>Pay with eSewa</h2>

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
        <form
          action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
          method="POST"
          className="esewa-form"
        >
          {Object.entries(formData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <button type="submit" className="esewa-button">
            Pay Rs. {formData.total_amount} with eSewa
          </button>
        </form>
      )}
    </div>
  );
}

export default ESEWAPayment;
