import React from "react";
import { Link } from "react-router-dom";
import {
  FaStethoscope,
  FaPaw,
  FaSyringe,
  FaHeart,
  FaVial,
  FaEye,
} from "react-icons/fa";
import "./../Views/Service.css";

const services = [
  { type: "Eye Care", icon: <FaEye /> },
  { type: "Medical Checkup", icon: <FaStethoscope /> },
  { type: "Physiotherapy", icon: <FaPaw /> },
  { type: "Cardiology", icon: <FaHeart /> },
  { type: "Laboratory", icon: <FaVial /> },
  { type: "Vaccination", icon: <FaSyringe /> },
];

const Service = () => {
  return (
    <div className="service-container">
      <h2 className="section-title">Our Healthcare Services</h2>

      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <div className="service-icon">{service.icon}</div>
            <h3 className="service-title">{service.type}</h3>
            <Link to={`/services/${service.type}`} className="read-more">
              Read More →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Service;
