import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import moment from "moment-timezone";
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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [vetTimezone, setVetTimezone] = useState("UTC");
  const navigate = useNavigate();
  const location = useLocation();

  const petTypes = [
    "Dog",
    "Cat",
    "Cow",
    "Bird",
    "Rabbit",
    "Horse",
    "Goat",
    "Hamster",
    "Turtle",
    "Fish",
  ];

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

        // Check if a vet is pre-selected from navigation state
        const preSelectedVetId = location.state?.selectedVetId;
        if (preSelectedVetId) {
          const selectedVet = response.data.data.find(
            (vet) => vet._id === preSelectedVetId
          );
          if (selectedVet) {
            setSelectedVet(preSelectedVetId);
            setVetFee(selectedVet.fee);
          }
        }
      } catch (err) {
        setError("Failed to fetch vets");
      }
    };
    fetchVets();
  }, [location.state]);

  const handleVetChange = (e) => {
    const selectedVetId = e.target.value;
    const selectedVet = vets.find((vet) => vet._id === selectedVetId);
    setSelectedVet(selectedVetId);
    setVetFee(selectedVet ? selectedVet.fee : 0);
    setDate("");
    setTime("");
    setAvailableSlots([]);
  };

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
    if (selectedVet && selectedDate) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:8084/api/appointments/available?vetId=${selectedVet}&date=${selectedDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setAvailableSlots(response.data.slots);
        setVetTimezone(response.data.timezone);
      } catch (err) {
        setError("Failed to fetch available slots");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateTime = moment
        .tz(`${date}T${time}`, vetTimezone)
        .utc()
        .format();
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
    } catch (error) {
      if (
        error.response?.data?.message === "This time slot is already booked"
      ) {
        alert("This time slot is already booked. Please choose another time.");
      } else {
        setError(
          error.response?.data?.message || "Failed to create appointment"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-appointment-container">
      <h2>Book your appointment now</h2>

      <div className="appointment-content">
        <div className="appointment-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Veterinarian:</label>
              <select value={selectedVet} onChange={handleVetChange} required>
                <option value="">Select a vet</option>
                {vets.map((vet) => (
                  <option key={vet._id} value={vet._id}>
                    {vet.name} ({vet.speciality}) - Fee: Rs {vet.fee}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={date}
                onChange={handleDateChange}
                required
                min={moment().format("YYYY-MM-DD")}
              />
            </div>

            <div className="form-group">
              <label>Time:</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              >
                <option value="">Select a time</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={moment(slot).format("HH:mm")}>
                    {moment(slot)
                      .tz(vetTimezone)
                      .format("h:mm A")}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Pet Type:</label>
              <select
                value={pet}
                onChange={(e) => setPet(e.target.value)}
                required
              >
                <option value="">Select pet type</option>
                {petTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Reason:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && <p className="error-message">{error}</p>}
            <button
              className="btnbookappointment"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating..." : " Book Appointment"}
            </button>
          </form>
        </div>

        <div className="appointment-image">
          <img
            src="https://img.freepik.com/free-vector/pet-hospital-concept-illustration_114360-25803.jpg?semt=ais_hybrid"
            alt="vet and pet"
          />
        </div>
      </div>
    </div>
  );
};

export default CreateAppointment;
