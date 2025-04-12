import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ServiceForm from "./ServiceForm";
import "./../../Views/ServiceDetail.css";
import { jwtDecode } from "jwt-decode";

const ServiceDetail = () => {
  const { serviceType } = useParams();
  const [details, setDetails] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [showPendingMessage, setShowPendingMessage] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded._id);
        setUserRole(decoded.role);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }

    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8084/api/services/${serviceType}`
        );
        setDetails(res.data);
      } catch (err) {
        console.error("Error fetching service details:", err);
      }
    };
    fetchDetails();
  }, [serviceType, showForm]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8084/api/services/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDetails(details.filter((detail) => detail._id !== id));
    } catch (err) {
      console.error("Error deleting service detail:", err);
    }
  };

  return (
    <div className="service-detail-container">
      <h1>{serviceType.replace(/-/g, " ")} Services</h1>

      {userRole === "vet" && (
        <button
          className="add-btn"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          Add New Content
        </button>
      )}

      {showForm && (
        <ServiceForm
          serviceType={serviceType.replace(/-/g, " ")}
          editing={editing}
          setShowForm={setShowForm}
          setDetails={setDetails}
          setShowPendingMessage={setShowPendingMessage}
        />
      )}

      {showPendingMessage && (
        <div className="pending-message">
          <p>Your submission is waiting for admin approval.</p>
          <button onClick={() => setShowPendingMessage(false)}>×</button>
        </div>
      )}

      <div className="details-grid">
        {details.map((detail) => (
          <div key={detail._id} className="detail-card">
            {detail.status === "pending" && (
              <div className="pending-badge">⏳ Waiting for admin approval</div>
            )}

            {detail.vet && (
              <div className="vet-badge">
                <span>By Dr. {detail.vet.name}</span>
                {detail.vet.clinic && <span>{detail.vet.clinic}</span>}
              </div>
            )}

            {detail.image && (
              <img
                src={`http://localhost:8084/${detail.image.replace(
                  /\\/g,
                  "/"
                )}`}
                alt={detail.serviceType}
                onError={(e) => {
                  console.error("Image failed to load:", e.target.src);
                  e.target.style.display = "none";
                }}
              />
            )}

            <div className="content-section">
              <h3>Our Solutions</h3>
              {detail.solutions.map((solution, i) => (
                <div key={i} className="solution">
                  <h4>{solution.title}</h4>
                  <p>{solution.description}</p>
                </div>
              ))}
            </div>

            {userRole === "vet" &&
              currentUserId &&
              detail.vet &&
              detail.vet._id &&
              currentUserId === detail.vet._id.toString() && (
                <div className="actions">
                  <button
                    className="edit-btn"
                    onClick={() => {
                      setEditing(detail);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(detail._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceDetail;
