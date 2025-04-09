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
import { FaCalendarAlt } from "react-icons/fa";

const services = [
  {
    type: "Eye Care",
    icon: <FaEye />,
    description: "Lorem spum lorem spum lorem spum",
  },
  {
    type: "Medical Checkup",
    icon: <FaStethoscope />,
    description: "Lorem spum lorem spum lorem spum",
  },
  {
    type: "Physiotherapy",
    icon: <FaPaw />,
    description: "Lorem spum lorem spum lorem spum",
  },
  {
    type: "Cardiology",
    icon: <FaHeart />,
    description: "Lorem spum lorem spum lorem spum",
  },
  {
    type: "Laboratory Services",
    icon: <FaVial />,
    description: "Lorem spum lorem spum lorem spum",
  },
  {
    type: "Vaccination",
    icon: <FaSyringe />,
    description: "Lorem spum lorem spum lorem spum",
  },
];

const Service = () => {
  return (
    <div className="service-container">
      <h5 className="service-subtitle">Medical Services</h5>
      <h2 className="section-title">Our Healthcare Service</h2>
      <p className="section-description">
        lorem spum lorem spum lorem spum lorem spum lorem spum lorem spum
      </p>

      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <div className="service-icon">{service.icon}</div>
            <h3 className="service-title">{service.type}</h3>
            <p className="service-description">{service.description}</p>
            <Link to={`/services/${service.type}`} className="read-more">
              Read More
            </Link>
            <div className="plus-icon">+</div>
          </div>
        ))}
      </div>

      <div className="appointmentSection">
        <div className="appointmentInfo">
          <FaCalendarAlt className="calendar-icon" />
          <div>
            <p className="appointment-title">Open for Appointments</p>
            <p className="appointment-text">Appointments open for all of us</p>
          </div>
        </div>
        <div className="appointmentButtons">
          <Link to="/appointments" className="book-btn">
            Open Appointments
          </Link>
          <Link to="/appointments" className="read-more">
            Read More
          </Link>
          <span className="plus-icon">+</span>
        </div>
      </div>
    </div>
  );
};

export default Service;
