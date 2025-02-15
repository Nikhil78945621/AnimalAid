import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./../Views/CreateAppointment.css";

const CreateAppointment = () => {
  const [vets, setVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pet, setPet] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [vetFee, setVetFee] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVets = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:8084/api/appointments/vets",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setVets(response.data.data);
      } catch (err) {
        setError("Failed to fetch vets");
      }
    };
    fetchVets();
  }, []);

  const handleVetChange = (e) => {
    const selectedVetId = e.target.value;
    const selectedVet = vets.find((vet) => vet._id === selectedVetId);
    setSelectedVet(selectedVetId);
    setVetFee(selectedVet ? selectedVet.fee : 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateTime = new Date(`${date}T${time}`);
      await axios.post(
        "http://localhost:8084/api/appointments",
        {
          veterinarian: selectedVet,
          pet,
          dateTime,
          notes,
          address,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      navigate("/appointments", { state: { refresh: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-appointment-container">
      <h2>Create New Appointment</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Veterinarian:</label>
          <select value={selectedVet} onChange={handleVetChange} required>
            <option value="">Select a vet</option>
            {vets.map((vet) => (
              <option key={vet._id} value={vet._id}>
                {vet.name} ({vet.speciality}) - Fee: ${vet.fee}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Time:</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Pet Name:</label>
          <input
            type="text"
            value={pet}
            onChange={(e) => setPet(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Address:</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Vet Fee:</label>
          <input type="number" value={vetFee} readOnly />
        </div>
        <div className="form-group">
          <label>Notes:</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Appointment"}
        </button>
      </form>
    </div>
  );
};

export default CreateAppointment;
