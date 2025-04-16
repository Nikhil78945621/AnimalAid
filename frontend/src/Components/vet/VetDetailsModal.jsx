import React from "react";
import { useNavigate } from "react-router-dom";
import "./../../Views/VetDetailsModal.css";

const VetDetailsModal = ({ vet, onClose }) => {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate("/appointments/new", { state: { selectedVetId: vet._id } });
  };

  return (
    <div className="vet-details-modal-overlay">
      <div className="vet-details-modal-content">
        <button
          className="vet-details-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>
        <h2>Veterinarian Details</h2>
        <div className="vet-details-modal-vet-details">
          <p>
            <strong>Name:</strong> Dr. {vet.name}
          </p>
          <p>
            <strong>Speciality:</strong> {vet.speciality}
          </p>
          <p>
            <strong>Fee:</strong> Rs {vet.fee}
          </p>
          {vet.clinic && (
            <p>
              <strong>Clinic:</strong> {vet.clinic}
            </p>
          )}
          {vet.email && (
            <p>
              <strong>Email:</strong> {vet.email}
            </p>
          )}
        </div>
        <div className="vet-details-modal-actions">
          <button
            className="vet-details-modal-book-now-btn"
            onClick={handleBookNow}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default VetDetailsModal;
