import React from "react";
import "./../Views/Service.css";
import {
  FaStethoscope,
  FaPaw,
  FaSyringe,
  FaHeart,
  FaVial,
  FaEye,
} from "react-icons/fa";

const Service = () => {
  const services = [
    {
      icon: <FaEye />,
      title: "Eye Care",
      description: "Comprehensive eye checkups and treatments.",
      link: "#",
    },
    {
      icon: <FaStethoscope />,
      title: "Medical Checkup",
      description: "Regular health checkups to ensure pet wellness.",
      link: "#",
    },
    {
      icon: <FaPaw />,
      title: "Physiotherapy",
      description: "Rehabilitation and pain management services.",
      link: "#",
    },
    {
      icon: <FaHeart />,
      title: "Cardiology",
      description: "Heart health monitoring and treatments.",
      link: "#",
    },
    {
      icon: <FaVial />,
      title: "Laboratory Service",
      description: "Diagnostic tests and lab services for pets.",
      link: "#",
    },
    {
      icon: <FaSyringe />,
      title: "Vaccination",
      description: "Essential vaccinations to keep pets healthy.",
      link: "#",
    },
  ];

  return (
    <div className="service-container">
      <h2 className="section-title">Our Healthcare Services</h2>
      <p className="section-subtitle">
        Providing quality care for your pets with professional veterinary
        services.
      </p>

      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <div className="service-icon">{service.icon}</div>
            <h3 className="service-title">{service.title}</h3>
            <p className="service-description">{service.description}</p>
            <a href={service.link} className="read-more">
              Read More →
            </a>
          </div>
        ))}
      </div>

      <div className="appointment-section">
        <h3>Open for Appointments</h3>
        <p>Schedule an appointment with our expert veterinarians today.</p>
        <a href="#book-appointment" className="book-btn">
          Make Appointment
        </a>
      </div>
    </div>
  );
};

export default Service;
