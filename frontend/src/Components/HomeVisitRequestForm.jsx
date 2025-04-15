import React, { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import "./../Views/homevisit.css";

// Utility function for delay with jitter
const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 100));

// MapClickHandler component
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
  const [manualAddress, setManualAddress] = useState("");
  const [petType, setPetType] = useState("Cow");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAddress = useCallback(
    async (latlng, retries = 5, backoff = 2000) => {
      setAddressLoading(true);
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&countrycodes=NP`,
            {
              headers: { "User-Agent": "VetApp/1.0 (your.email@example.com)" },
            }
          );
          if (!response.ok)
            throw new Error(`Nominatim status: ${response.status}`);
          const data = await response.json();
          console.log("Nominatim success:", data);
          setAddressLoading(false);
          return data.display_name || "Address not found";
        } catch (error) {
          console.warn(`Nominatim attempt ${attempt} failed: ${error.message}`);
          if (attempt === retries) {
            setAddressLoading(false);
            return null;
          }
          await delay(backoff * attempt);
        }
      }
    },
    []
  );

  const handleMapClick = useCallback(
    async (latlng) => {
      setPosition(latlng);
      setError("");
      console.log("Map clicked:", latlng);
      const fetchedAddress = await fetchAddress(latlng);
      if (fetchedAddress) {
        setAddress(fetchedAddress);
        setManualAddress("");
      } else {
        const fallbackAddress = `Lat: ${latlng.lat}, Lon: ${latlng.lng}`;
        setAddress(fallbackAddress);
        setError(
          "Could not fetch address. Please enter manually or use coordinates."
        );
      }
    },
    [fetchAddress]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to submit a request.");
      return;
    }

    if (!position) {
      setError("Please select a location on the map.");
      return;
    }

    if (!description.trim()) {
      setError("Please provide a description of the emergency.");
      return;
    }

    const finalAddress = manualAddress.trim() || address;
    if (!finalAddress) {
      setError("Please provide an address or select a location.");
      return;
    }

    const payload = {
      petType,
      description,
      coordinates: [position.lng, position.lat],
      address: finalAddress,
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
      console.log("Submit success:", response.data);
      alert(response.data.message);
      setPosition(null);
      setAddress("");
      setManualAddress("");
      setPetType("Cow");
      setDescription("");
      setPriority("medium");
    } catch (error) {
      console.error("Submit error:", error.response?.data || error.message);
      setError(
        error.response?.data?.message ||
          "Failed to submit request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-visit-form">
      <h2>Emergency Home Visit Request</h2>
      {error && <p className="error-message">{error}</p>}
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
            center={[27.7172, 85.324]}
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
          <p>
            Selected Address:{" "}
            {addressLoading
              ? "Fetching address..."
              : address || "No location selected"}
          </p>
          <div className="form-group">
            <label>Manual Address (if needed):</label>
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Enter address manually"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || addressLoading}
          style={{ padding: "10px 20px" }}
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
};

export default HomeVisitRequestForm;
