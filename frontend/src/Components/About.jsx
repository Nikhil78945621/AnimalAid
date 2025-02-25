import React from "react";
import "./../Views/About.css";

const About = () => {
  return (
    <div className="about">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-content">
          <h1>About Us</h1>
          <p>
            We are dedicated to providing the best healthcare solutions for your
            pets and livestock. Our mission is to ensure every animal gets the
            best medical attention they deserve.
          </p>
        </div>
        <div className="about-image">
          <img
            src="https://img.freepik.com/premium-photo/portrait-african-vet-doctor-with-domestic-dog-smiling-camera-while-working-clinic_249974-14722.jpg"
            alt="Veterinarian caring for a dog"
          />
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission">
        <h2>Our Mission</h2>
        <p>
          To revolutionize animal healthcare by offering cutting-edge solutions,
          expert guidance, and compassionate care for every pet and livestock.
        </p>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose">
        <h2>Why Choose Us?</h2>
        <div className="features">
          <div className="feature-card">
            <img src="certified.jpg" alt="Expert Vets" />
            <h3>Expert Veterinarians</h3>
            <p>
              Our team consists of highly qualified and experienced
              veterinarians.
            </p>
          </div>
          <div className="feature-card">
            <img src="modern-facility.jpg" alt="Modern Facility" />
            <h3>Advanced Facilities</h3>
            <p>We use state-of-the-art medical equipment and facilities.</p>
          </div>
          <div className="feature-card">
            <img
              src="data:image/png;base64,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"
              alt="24/7 Support"
            />
            <h3>24/7 Support</h3>
            <p>Emergency healthcare services are available round the clock.</p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team">
        <h2>Meet Our Team</h2>
        <div className="team-members">
          <div className="team-card">
            <img src="a.jpg" alt="Dr. Emily Smith" />
            <h3>Dr. Emily Smith</h3>
            <p>Senior Veterinarian</p>
          </div>
          <div className="team-card">
            <img src="a.jpg" alt="Dr. John Doe" />
            <h3>Dr. John Doe</h3>
            <p>Veterinary Surgeon</p>
          </div>
          <div className="team-card">
            <img src="a.jpg" alt="Dr. Sarah Johnson" />
            <h3>Dr. Sarah Johnson</h3>
            <p>Animal Nutritionist</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
