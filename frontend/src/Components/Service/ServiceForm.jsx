import React, { useState } from "react";
import axios from "axios";
import "./../../Views/serviceform.css";

const ServiceForm = ({ serviceType, setShowForm, setDetails, editing }) => {
  const [formData, setFormData] = useState({
    serviceType: editing?.serviceType || serviceType,
    description: editing?.description || "",
    image: null,
    reasons: editing?.reasons || [{ title: "", description: "" }],
    solutions: editing?.solutions || [{ title: "", description: "" }],
  });
  const [preview, setPreview] = useState(editing?.image || null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, image: file });
    setPreview(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReasonChange = (index, field, value) => {
    const newReasons = [...formData.reasons];
    newReasons[index][field] = value;
    setFormData({ ...formData, reasons: newReasons });
  };

  const handleSolutionChange = (index, field, value) => {
    const newSolutions = [...formData.solutions];
    newSolutions[index][field] = value;
    setFormData({ ...formData, solutions: newSolutions });
  };

  const addReason = () => {
    setFormData({
      ...formData,
      reasons: [...formData.reasons, { title: "", description: "" }],
    });
  };

  const addSolution = () => {
    setFormData({
      ...formData,
      solutions: [...formData.solutions, { title: "", description: "" }],
    });
  };

  const removeReason = (index) => {
    const newReasons = formData.reasons.filter((_, i) => i !== index);
    setFormData({ ...formData, reasons: newReasons });
  };

  const removeSolution = (index) => {
    const newSolutions = formData.solutions.filter((_, i) => i !== index);
    setFormData({ ...formData, solutions: newSolutions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const data = new FormData();
    data.append("serviceType", formData.serviceType);
    data.append("reasons", JSON.stringify(formData.reasons));
    data.append("solutions", JSON.stringify(formData.solutions));
    if (formData.image) data.append("image", formData.image);

    try {
      let response;
      if (editing) {
        response = await axios.put(
          `http://localhost:8084/api/services/${editing._id}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        response = await axios.post(
          "http://localhost:8084/api/services",
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      setShowSuccessPopup(true);

      //hide the form after 2 seconds
      // Hide the form after 2 seconds
      setTimeout(() => {
        setShowForm(false);
        if (editing) {
          setDetails((prev) =>
            prev.map((item) =>
              item._id === response.data._id ? response.data : item
            )
          );
        } else {
          setDetails((prev) => [...prev, response.data]);
        }
      }, 2000);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit. Please try again.");
    }
  };

  return (
    <div className="service-form-modal">
      <div className="service-form-container">
        <h2>{editing ? "Edit Service" : "Add New Service"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Service Type</label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              disabled={!!editing}
            >
              <option value="Eye Care">Eye Care</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Physiotherapy">Physiotherapy</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Medical Checkup">Medical Checkup</option>
            </select>
          </div>

          <div className="form-group">
            <label>Image</label>
            <input type="file" onChange={handleImageChange} />
            {preview && (
              <img src={preview} alt="Preview" className="image-preview" />
            )}
          </div>

          <div className="form-group">
            <label>Solutions</label>
            {formData.solutions.map((solution, index) => (
              <div key={`solution-${index}`} className="nested-form-group">
                <input
                  type="text"
                  placeholder="Title"
                  value={solution.title}
                  onChange={(e) =>
                    handleSolutionChange(index, "title", e.target.value)
                  }
                  required
                />
                <textarea
                  placeholder="Description"
                  value={solution.description}
                  onChange={(e) =>
                    handleSolutionChange(index, "description", e.target.value)
                  }
                  required
                />
                {formData.solutions.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeSolution(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-more-btn"
              onClick={addSolution}
            >
              + Add Solution
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {editing ? "Update" : "Submit"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="popup-content">
            <h3>Submitted Successfully!</h3>
            <p>Your service detail is waiting for admin approval.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceForm;
