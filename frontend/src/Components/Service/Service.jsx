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
import "./../../Views/Service.css";
import { FaCalendarAlt } from "react-icons/fa";

const services = [
  {
    type: "Eye Care",
    icon: <FaEye />,
    description:
      "Comprehensive eye exams, treatment for infections, and monitoring of vision issues in animals.",
  },
  {
    type: "Medical Checkup",
    icon: <FaStethoscope />,
    description:
      "Routine health evaluations to detect illnesses early and ensure your animal stays healthy.",
  },
  {
    type: "Physiotherapy",
    icon: <FaPaw />,
    description:
      "Physical therapy to aid recovery from injury, surgery, or chronic conditions affecting mobility.",
  },
  {
    type: "Cardiology",
    icon: <FaHeart />,
    description:
      "Heart health assessment, diagnosis, and treatment for cardiovascular conditions in animals.",
  },
  {
    type: "Laboratory Services",
    icon: <FaVial />,
    description:
      "Accurate diagnostic testing including blood work, urinalysis, and pathology reports.",
  },
  {
    type: "Vaccination",
    icon: <FaSyringe />,
    description:
      "Preventive vaccinations to protect your animals from common infectious diseases.",
  },
];

const Service = () => {
  return (
    <div className="service-container">
      <h2 className="section-title">Our Healthcare Service</h2>
      <p className="section-description">
        We offer a wide range of medical services to ensure your animals receive
        the best care possible. From routine checkups to specialized treatments,
        our dedicated team is here to support their health and well-being.
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
          <Link to="/appointments/new" className="book-btn">
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
