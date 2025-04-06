import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ServiceForm from "./ServiceForm";
import "./../Views/ServiceDetail.css";
import { jwtDecode } from "jwt-decode";

const ServiceDetail = () => {
  const { serviceType } = useParams();
  const [details, setDetails] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Get user info from localStorage
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
  }, [serviceType]);

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
        />
      )}

      <div className="details-grid">
        {details.map((detail) => (
          <div key={detail._id} className="detail-card">
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
              <h3>Common Reasons</h3>
              {detail.reasons.map((reason, i) => (
                <div key={i} className="reason">
                  <h4>{reason.title}</h4>
                  <p>{reason.description}</p>
                </div>
              ))}
            </div>
            <div className="content-section">
              <h3>Our Solutions</h3>
              {detail.solutions.map((solution, i) => (
                <div key={i} className="solution">
                  <h4>{solution.title}</h4>
                  <p>{solution.description}</p>
                </div>
              ))}
            </div>
            {/* Updated condition for showing edit/delete buttons */}
            {userRole === "vet" &&
              currentUserId &&
              detail.vet &&
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
