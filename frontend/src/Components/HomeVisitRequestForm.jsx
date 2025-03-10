import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

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
    }
  };

  // Update the POST request URL to include full backend address
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8084/api/home-visits",
        {
          petType,
          description,
          coordinates: position ? [position.lng, position.lat] : [],
          address,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Request submitted successfully!");
    } catch (error) {
      console.error("Submission error:", error);
      alert(
        error.response?.data?.message ||
          "Failed to submit request. Please try again."
      );
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
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="map-container">
          <p>Click on map to select location:</p>
          <MapContainer
            center={[27.7172, 85.324]} // Default to Kathmandu
            zoom={13}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler onLocationSelect={handleMapClick} />
            {position && <Marker position={position} />}
          </MapContainer>
          <p>Selected Address: {address}</p>
        </div>

        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
};

export default HomeVisitRequestForm;
