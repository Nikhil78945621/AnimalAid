import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "./../Views/VetHomeVisitDashboard.css";

const VetHomeVisitDashboard = () => {
  const [requests, setRequests] = useState([]);
  const mapRef = useRef(null);
  const wsRef = useRef(null);
  const retryCountRef = useRef(0);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8084/api/home-visits/vet",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Fetched requests (Vet Dashboard):", response.data.data);
      response.data.data.forEach((req) => {
        if (req.distance === null || req.distance === undefined) {
          console.warn(
            `Request ${req._id} has invalid distance: ${req.distance}`
          );
        }
      });
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
        alert(
          "Failed to load requests: " +
            (error.response?.data?.message || "Server error")
        );
      }
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected (Vet), skipping reconnect");
      return;
    }

    const websocket = new WebSocket("ws://localhost:8084");
    wsRef.current = websocket;

    websocket.onopen = () => {
      console.log("WebSocket connected (Vet)");
      retryCountRef.current = 0;
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received (Vet):", data);
      switch (data.type) {
        case "NEW_REQUEST":
        case "REQUEST_UPDATED":
          console.log("Fetching updated requests due to:", data.type);
          fetchRequests();
          break;
        default:
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error (Vet):", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected (Vet)");
      wsRef.current = null;
      const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 16000);
      retryCountRef.current += 1;
      console.log(
        `Reconnecting in ${delay / 1000} seconds... (Attempt ${
          retryCountRef.current
        })`
      );
      setTimeout(connectWebSocket, delay);
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const decodedToken = jwtDecode(token);
    if (decodedToken.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    connectWebSocket();
    fetchRequests();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.onclose = null;
      } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        console.log("WebSocket closed on unmount (Vet)");
      }
    };
  }, [navigate, connectWebSocket, fetchRequests]);

  const handleAccept = async (id) => {
    const request = requests.find((r) => r._id === id);
    if (request.status !== "pending") {
      alert("This request has already been processed.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `http://localhost:8084/api/home-visits/${id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Accept request response:", response.data);
      fetchRequests();
      alert("Request accepted successfully! Check the Vet Chat page.");
    } catch (error) {
      console.error(
        "Error accepting request:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message ||
          "Failed to accept request. Please try again or check server status."
      );
    }
  };

  return (
    <div className="vet-home-visit-dashboard">
      <h2>Emergency Home Visit Requests</h2>
      <div className="dashboard-container">
        <div className="map-wrapper" style={{ height: "500px", width: "70%" }}>
          <MapContainer
            center={[27.7172, 85.324]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(map) => {
              mapRef.current = map;
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            {requests
              .filter(
                (request) =>
                  request.status === "pending" &&
                  request.isEligible &&
                  typeof request.distance === "number" &&
                  request.distance <= 100
              )
              .map((request) => (
                <Marker
                  key={request._id}
                  position={[
                    request.location.coordinates[1],
                    request.location.coordinates[0],
                  ]}
                >
                  <Popup>
                    <h3>{request.petType}</h3>
                    <p>Priority: {request.priority}</p>
                    <p>{request.description}</p>
                    <p>
                      Distance:{" "}
                      {typeof request.distance === "number"
                        ? request.distance.toFixed(2)
                        : "N/A"}{" "}
                      km
                    </p>
                    <p>
                      ETA:{" "}
                      {typeof request.eta === "number" && request.eta > 0
                        ? request.eta
                        : "N/A"}{" "}
                      minutes
                    </p>
                    <p>Status: {request.status}</p>
                    <button
                      onClick={() => handleAccept(request._id)}
                      style={{ padding: "5px 10px", marginTop: "10px" }}
                    >
                      Accept Request
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
          {requests.length === 0 ? (
            <p>No requests available within 100 km.</p>
          ) : (
            requests.map((request) => (
              <div
                key={request._id}
                className="request-item"
                style={{ padding: "10px", borderBottom: "1px solid #ccc" }}
              >
                <h4>
                  {request.petType} - {request.priority}
                </h4>
                <p>
                  Distance:{" "}
                  {typeof request.distance === "number"
                    ? request.distance.toFixed(2)
                    : "N/A"}{" "}
                  km
                </p>
                <p>
                  ETA:{" "}
                  {typeof request.eta === "number" && request.eta > 0
                    ? request.eta
                    : "N/A"}{" "}
                  minutes
                </p>
                <p>Status: {request.status}</p>
                {request.status === "accepted" && (
                  <p>
                    Chat available on the <a href="/vet-chat">Vet Chat page</a>.
                  </p>
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
