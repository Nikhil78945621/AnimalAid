import React, { useState, useEffect } from "react";
import axios from "axios";
import "./../../Views/AdminApprovals.css";

const ServiceApproval = () => {
  const [pendingServices, setPendingServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingServices = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:8084/api/services/admin/pending",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPendingServices(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching pending services:", error);
        setLoading(false);
      }
    };
    fetchPendingServices();
  }, []);

  const handleApprove = async (id, feedback = "") => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:8084/api/services/admin/${id}/approve`,
        { feedback },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPendingServices(
        pendingServices.filter((service) => service._id !== id)
      );
    } catch (error) {
      console.error("Error approving service:", error);
    }
  };

  const handleReject = async (id, feedback = "") => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:8084/api/services/admin/${id}/reject`,
        { feedback },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPendingServices(
        pendingServices.filter((service) => service._id !== id)
      );
    } catch (error) {
      console.error("Error rejecting service:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-approval-container">
      <h2>Pending Service Approvals</h2>
      {pendingServices.length === 0 ? (
        <p>No pending services for approval</p>
      ) : (
        <div className="approval-list">
          {pendingServices.map((service) => (
            <div key={service._id} className="approval-item">
              <div className="service-header">
                <h3>{service.serviceType}</h3>
                <p>Submitted by: {service.vet?.name}</p>
              </div>

              <div className="service-content">
                {service.image && (
                  <img
                    src={`http://localhost:8084/${service.image.replace(
                      /\\/g,
                      "/"
                    )}`}
                    alt={service.serviceType}
                  />
                )}

                <div className="reasons-section">
                  <h4>Reasons:</h4>
                  {service.reasons.map((reason, index) => (
                    <div key={index} className="reason-item">
                      <h5>{reason.title}</h5>
                      <p>{reason.description}</p>
                    </div>
                  ))}
                </div>

                <div className="solutions-section">
                  <h4>Solutions:</h4>
                  {service.solutions.map((solution, index) => (
                    <div key={index} className="solution-item">
                      <h5>{solution.title}</h5>
                      <p>{solution.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="approval-actions">
                <textarea
                  className="feedback-input"
                  placeholder="Optional feedback..."
                  id={`feedback-${service._id}`}
                />
                <button
                  className="approve-btn"
                  onClick={() => {
                    const feedback = document.getElementById(
                      `feedback-${service._id}`
                    ).value;
                    handleApprove(service._id, feedback);
                  }}
                >
                  Approve
                </button>
                <button
                  className="reject-btn"
                  onClick={() => {
                    const feedback = document.getElementById(
                      `feedback-${service._id}`
                    ).value;
                    handleReject(service._id, feedback);
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceApproval;
