import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./../Views/Appointment.css";
import moment from "moment";

const UserAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleData, setRescheduleData] = useState({
    appointmentId: "",
    newDateTime: "",
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const location = useLocation();

  // Fetch appointments for the logged-in user
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

  useEffect(() => {
    fetchAppointments();
  }, [location.state?.refresh]);

  // Handle canceling an appointment
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

  // Handle rescheduling an appointment
  const handleReschedule = async (id) => {
    const appointment = appointments.find((appt) => appt._id === id);
    if (!appointment) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8084/api/appointments/available?vetId=${
          appointment.veterinarian._id
        }&date=${new Date(appointment.dateTime).toISOString().split("T")[0]}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAvailableSlots(response.data.slots);
      setRescheduleData({ appointmentId: id, newDateTime: "" });
    } catch (error) {
      console.error("Error fetching available slots:", error);
    }
  };

  // Handle reschedule submission
  const handleRescheduleSubmit = async () => {
    const { appointmentId, newDateTime } = rescheduleData;

    if (!appointmentId || !newDateTime) {
      alert("Please select a new date and time.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `http://localhost:8084/api/appointments/${appointmentId}/reschedule`,
        { newDateTime },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        alert("Appointment rescheduled successfully!");
        fetchAppointments(); // Refresh the appointments list
        setRescheduleData({ appointmentId: "", newDateTime: "" }); // Reset reschedule form
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      alert("Failed to reschedule appointment. Please try again.");
    }
  };

  if (loading) return <div>Loading appointments...</div>;

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h2>My Appointments</h2>
      </div>
      <div className="appointments-list">
        {appointments.map((appt) => {
          const payment = appt.payment || { amount: 0, status: "pending" };
          return (
            <div key={appt._id} className="appointment-card">
              <div className="appointment-info">
                <p>Date: {new Date(appt.dateTime).toLocaleString()}</p>
                <p>Pet Type: {appt.pet}</p>
                <p>Reason: {appt.notes || "No additional notes"}</p>
                <p>Status: {appt.status}</p>
                <p>Vet: {appt.veterinarian?.name}</p>
                <p>Fee: ${payment.amount}</p>
                <p>Payment Status: {payment.status}</p>
              </div>
              <div className="appointment-actions">
                {["pending", "confirmed"].includes(appt.status) && (
                  <>
                    <button onClick={() => handleCancel(appt._id)}>
                      Cancel
                    </button>
                    <button onClick={() => handleReschedule(appt._id)}>
                      Reschedule
                    </button>
                  </>
                )}
                {rescheduleData.appointmentId === appt._id && (
                  <div className="reschedule-form">
                    <select
                      value={rescheduleData.newDateTime}
                      onChange={(e) =>
                        setRescheduleData({
                          ...rescheduleData,
                          newDateTime: e.target.value,
                        })
                      }
                    >
                      <option value="">Select a new time</option>
                      {availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {moment(slot).format("LLLL")}
                        </option>
                      ))}
                    </select>
                    <button onClick={handleRescheduleSubmit}>Confirm</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserAppointments;
