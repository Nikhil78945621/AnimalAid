import React, { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "./../../Views/VetHomeVisitDashboard.css";

const VetHomeVisitDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef(null);
  const wsRef = useRef(null);
  const retryCountRef = useRef(0);
  const navigate = useNavigate();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8084/api/home-visits/vet",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests(response.data.data);
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    } catch (error) {
      console.error(
        "Fetch requests error:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to load requests. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const websocket = new WebSocket("ws://localhost:8084");
    wsRef.current = websocket;

    websocket.onopen = () => {
      retryCountRef.current = 0;
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (["NEW_REQUEST", "REQUEST_UPDATED"].includes(data.type)) {
        fetchRequests();
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = () => {
      wsRef.current = null;
      const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 16000);
      retryCountRef.current += 1;
      setTimeout(connectWebSocket, delay);
    };
  }, [fetchRequests]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || jwtDecode(token).exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    connectWebSocket();
    fetchRequests();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [navigate, connectWebSocket, fetchRequests]);

  const handleAccept = async (id) => {
    const request = requests.find((r) => r._id === id);
    if (request.status !== "pending") {
      alert("This request has already been processed.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:8084/api/home-visits/${id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
      alert("Request accepted successfully! Check the Vet Chat page.");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to accept request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vet-home-visit-dashboard">
      <h2>Emergency Home Visit Requests</h2>
      {error && <p className="error-message">{error}</p>}
      {loading && <p>Loading requests...</p>}
      <div className="dashboard-container">
        <div className="map-wrapper" style={{ height: "500px", width: "70%" }}>
          <MapContainer
            center={[27.7172, 85.324]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(map) => (mapRef.current = map)}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            {requests
              .filter(
                (r) =>
                  r.status === "pending" &&
                  r.isEligible &&
                  typeof r.distance === "number" &&
                  r.distance <= 100 &&
                  r.location?.coordinates?.length === 2 &&
                  !isNaN(r.location.coordinates[0]) &&
                  !isNaN(r.location.coordinates[1])
              )
              .map((r) => (
                <Marker
                  key={r._id}
                  position={[
                    r.location.coordinates[1],
                    r.location.coordinates[0],
                  ]}
                  icon={L.icon({
                    iconUrl:
                      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                  })}
                >
                  <Popup>
                    <h3>{r.petType}</h3>
                    <p>Priority: {r.priority}</p>
                    <p>{r.description}</p>
                    <p>Distance: {r.distance.toFixed(2)} km</p>
                    <p>ETA: {r.eta || "N/A"} minutes</p>
                    <p>Status: {r.status}</p>
                    <button
                      onClick={() => handleAccept(r._id)}
                      style={{ padding: "5px 10px", marginTop: "10px" }}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Accept Request"}
                    </button>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
        <div
          className="request-list"
          style={{ width: "30%", overflowY: "auto", height: "500px" }}
        >
          {requests.length === 0 && !loading ? (
            <p>No requests available within 100 km.</p>
          ) : (
            requests.map((r) => (
              <div
                key={r._id}
                className="request-item"
                style={{ padding: "10px", borderBottom: "1px solid #ccc" }}
              >
                <h4>
                  {r.petType} - {r.priority}
                </h4>
                <p>
                  Distance:{" "}
                  {typeof r.distance === "number"
                    ? r.distance.toFixed(2)
                    : "N/A"}{" "}
                  km
                </p>
                <p>ETA: {r.eta || "N/A"} minutes</p>
                <p>Status: {r.status}</p>
                {r.status === "accepted" && (
                  <p>
                    Chat available on <a href="/vet-chat">Vet Chat page</a>.
                  </p>
                )}
                {r.status === "pending" && (
                  <button
                    onClick={() => handleAccept(r._id)}
                    style={{ padding: "5px 10px", marginTop: "10px" }}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Accept Request"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VetHomeVisitDashboard;
