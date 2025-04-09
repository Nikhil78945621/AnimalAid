import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import "./../Views/homevisit.css";

const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const HomeVisitRequestForm = () => {
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [petType, setPetType] = useState("Cow");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  const handleMapClick = async (latlng) => {
    setPosition(latlng);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await response.json();
      setAddress(data.display_name || "Address not found");
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress("Failed to fetch address");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to submit a request.");
      return;
    }

    if (!position) {
      alert("Please select a location on the map.");
      return;
    }

    const payload = {
      petType,
      description,
      coordinates: [position.lng, position.lat],
      address,
      priority,
    };
    console.log("Submitting payload:", payload);

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8084/api/home-visits",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Submission response:", response.data);
      alert("Request submitted successfully! Check 'My Requests' to track it.");
      // Reset form
      setPosition(null);
      setAddress("");
      setPetType("Cow");
      setDescription("");
      setPriority("medium");
    } catch (error) {
      console.error(
        "Submit error:",
        error.response?.data || error.message,
        error.response?.status
      );
      alert(
        error.response?.data?.message ||
          "Failed to submit request. Check your login or server status."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-visit-form">
      <h2>Emergency Home Visit Request</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Pet Type:</label>
          <select value={petType} onChange={(e) => setPetType(e.target.value)}>
            <option value="Cow">Cow</option>
            <option value="Buffalo">Buffalo</option>
            <option value="Horse">Horse</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Priority:</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Describe the emergency..."
            style={{ width: "100%", height: "100px" }}
          />
        </div>

        <div className="map-container">
          <p>Click on the map to select location:</p>
          <MapContainer
            center={[27.7172, 85.324]} // Default Kathmandu coordinates
            zoom={7}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler onLocationSelect={handleMapClick} />
            {position && <Marker position={position} />}
          </MapContainer>
          <p>Selected Address: {address || "No location selected"}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 20px" }}
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
};

export default HomeVisitRequestForm;
