import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import "./../Views/VetHomeVisitDashboard.css";

const VetHomeVisitDashboard = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8084/api/home-visits/vet", // Full URL
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setRequests(response.data.data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };
    fetchRequests();
  }, []);

  const handleAccept = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `http://localhost:8084/api/home-visits/${id}/accept`, // Correct URL
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req._id === id ? { ...req, status: "accepted" } : req
        )
      );
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };
  return (
    <div className="vet-home-visit-dashboard">
      <h2>Emergency Home Visit Requests</h2>
      <div className="map-container">
        <MapContainer
          center={[27.7172, 85.324]} // Center on Nepal
          zoom={7} // Adjust zoom level to focus on Nepal
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {requests.map((request) => (
            <Marker
              key={request._id}
              position={[
                request.location.coordinates[1],
                request.location.coordinates[0],
              ]}
            >
              <Popup>
                <h3>{request.petType}</h3>
                <p>{request.description}</p>
                <p>Status: {request.status}</p>
                {request.status === "pending" && (
                  <button onClick={() => handleAccept(request._id)}>
                    Accept Request
                  </button>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default VetHomeVisitDashboard;
