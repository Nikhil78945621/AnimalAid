import React, { useState } from "react";
import "./../Views/serviceform.css";

const ServiceForm = ({ setShowForm, setDetails, editing }) => {
  // State for form fields
  const [serviceName, setServiceName] = useState(editing?.serviceType || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(editing?.image || null);
  const [reasons, setReasons] = useState(
    editing?.reasons || [{ title: "", description: "" }]
  );
  const [solutions, setSolutions] = useState(
    editing?.solutions || [{ title: "", description: "" }]
  );

  // Handle Image Upload
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // Handle Reason Change
  const handleReasonChange = (index, field, value) => {
    const newReasons = [...reasons];
    newReasons[index][field] = value;
    setReasons(newReasons);
  };

  // Handle Solution Change
  const handleSolutionChange = (index, field, value) => {
    const newSolutions = [...solutions];
    newSolutions[index][field] = value;
    setSolutions(newSolutions);
  };

  // Add New Reason Field
  const addReason = () => {
    setReasons([...reasons, { title: "", description: "" }]);
  };

  // Add New Solution Field
  const addSolution = () => {
    setSolutions([...solutions, { title: "", description: "" }]);
  };

  // Handle Form Submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

    // Validate serviceType
    const validServiceTypes = [
      "Eye Care",
      "Vaccination",
      "Physiotherapy",
      "Cardiology",
      "Laboratory",
      "Medical Checkup",
    ];

    if (!validServiceTypes.includes(serviceName)) {
      alert("Invalid service type. Please select a valid option.");
      return;
    }

    // Create FormData object
    const formData = new FormData();
    formData.append("serviceType", serviceName);
    formData.append("description", description);
    if (image) formData.append("image", image); // Append image only if it exists
    formData.append("reasons", JSON.stringify(reasons));
    formData.append("solutions", JSON.stringify(solutions));

    try {
      const url = editing
        ? `http://localhost:8084/api/services/${editing._id}`
        : "http://localhost:8084/api/services";
      const method = editing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          editing
            ? "Service Updated Successfully!"
            : "Service Created Successfully!"
        );
        setShowForm(false);
        setDetails((prev) =>
          editing
            ? prev.map((item) => (item._id === result._id ? result : item))
            : [...prev, result]
        );
      } else {
        const errorData = await response.json();
        console.error("Error Response:", errorData);
        alert(`Error: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred! Check your network and try again.");
    }
  };

  return (
    <div className="container mt-5">
      <h2>{editing ? "Edit Service" : "Create a Service"}</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Service Name */}
        <div className="mb-3">
          <label className="form-label">Service Name</label>
          <select
            className="form-control"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
          >
            <option value="">Select a service type</option>
            <option value="Eye Care">Eye Care</option>
            <option value="Vaccination">Vaccination</option>
            <option value="Physiotherapy">Physiotherapy</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Medical Checkup">Medical Checkup</option>
          </select>
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>

        {/* Image Upload */}
        <div className="mb-3">
          <label className="form-label">Upload Image</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={handleImageChange}
            required={!editing} // Image is required only for new services
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="img-thumbnail mt-2"
              width="150"
            />
          )}
        </div>

        {/* Reasons */}
        <div className="mb-3">
          <label className="form-label">Reasons</label>
          {reasons.map((reason, index) => (
            <div key={index} className="mb-2">
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Reason Title"
                value={reason.title}
                onChange={(e) =>
                  handleReasonChange(index, "title", e.target.value)
                }
                required
              />
              <textarea
                className="form-control"
                placeholder="Reason Description"
                value={reason.description}
                onChange={(e) =>
                  handleReasonChange(index, "description", e.target.value)
                }
                required
              />
            </div>
          ))}
          <button
            type="button"
            className="btn btn-primary mt-2"
            onClick={addReason}
          >
            + Add Reason
          </button>
        </div>

        {/* Solutions */}
        <div className="mb-3">
          <label className="form-label">Solutions</label>
          {solutions.map((solution, index) => (
            <div key={index} className="mb-2">
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Solution Title"
                value={solution.title}
                onChange={(e) =>
                  handleSolutionChange(index, "title", e.target.value)
                }
                required
              />
              <textarea
                className="form-control"
                placeholder="Solution Description"
                value={solution.description}
                onChange={(e) =>
                  handleSolutionChange(index, "description", e.target.value)
                }
                required
              />
            </div>
          ))}
          <button
            type="button"
            className="btn btn-primary mt-2"
            onClick={addSolution}
          >
            + Add Solution
          </button>
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn btn-success">
          {editing ? "Update Service" : "Create Service"}
        </button>
      </form>
    </div>
  );
};

export default ServiceForm;
