import React, { useState, useEffect } from "react";
import axios from "axios";
import "./../Views/Home.css";
import { jwtDecode } from "jwt-decode";

const Home = () => {
  const [news, setNews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;
  const [userRole, setUserRole] = useState("");
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    qualifications: "",
    experience: "",
    specialty: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Check user role
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (err) {
        console.error("Token decoding failed:", err);
      }
    }

    // Fetch news
    const fetchNews = async () => {
      try {
        const response = await axios.get(
          "https://newsapi.org/v2/everything?q=veterinary+healthcare OR pet+healthcare OR livestock+health&apiKey=8f0e474baddf4180b88b130d5e0079a0"
        );
        setNews(response.data.articles);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };

    fetchNews();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + itemsPerPage < news.length ? prevIndex + itemsPerPage : 0
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - itemsPerPage >= 0
        ? prevIndex - itemsPerPage
        : Math.max(0, news.length - itemsPerPage)
    );
  };

  const handleApplicationChange = (e) => {
    const { name, value } = e.target;
    setApplicationData({ ...applicationData, [name]: value });
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Disable the submit button
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8084/api/vet-applications/submit",
        applicationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // Disable retries
          "axios-retry": { retries: 0 },
        }
      );
      setSuccess(
        "Application submitted successfully! Awaiting admin approval."
      );
      setApplicationData({
        qualifications: "",
        experience: "",
        specialty: "",
      });
      setShowApplicationForm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit application.");
    } finally {
      // Re-enable the submit button
      submitButton.disabled = false;
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Animal Aid</h1>
          <p>
            Providing the best healthcare solutions for your pets and livestock.
          </p>
          <a href="#services" className="btn-primary">
            Learn More
          </a>
          {userRole === "user" && (
            <button
              className="btn-secondary"
              onClick={() => setShowApplicationForm(true)}
            >
              Eligible Veterinarian ?
            </button>
          )}
        </div>
        <div className="hero-image">
          <img src="a.jpg" alt="Veterinarian with cow" />
        </div>
      </section>

      {showApplicationForm && (
        <>
          <div
            className="overlay"
            onClick={() => setShowApplicationForm(false)}
          ></div>
          <section className="application-form-section">
            <h2>Apply to Become a Veterinarian</h2>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            <form
              onSubmit={handleApplicationSubmit}
              className="application-form"
            >
              <div>
                <label>Qualifications</label>
                <input
                  name="qualifications"
                  value={applicationData.qualifications}
                  onChange={handleApplicationChange}
                  required
                  placeholder="e.g., DVM, BVSc, etc."
                />
              </div>
              <div>
                <label>Experience</label>
                <input
                  name="experience"
                  value={applicationData.experience}
                  onChange={handleApplicationChange}
                  required
                  placeholder="e.g., 5 years in small animal practice"
                />
              </div>
              <div>
                <label>Specialty</label>
                <input
                  type="text"
                  name="specialty"
                  value={applicationData.specialty}
                  onChange={handleApplicationChange}
                  required
                  placeholder="e.g., Small Animals, Livestock, Exotic Pets"
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-primary">
                  Submit Application
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowApplicationForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      {/* News Section */}
      <section className="news-section">
        <h2>Latest News and Articles</h2>
        {news.length === 0 ? (
          <p>Loading news...</p>
        ) : (
          <div className="news-carousel">
            <button className="btn-prev" onClick={prevSlide}>
              ◀ Prev
            </button>
            <div className="news-cards">
              {news
                .slice(currentIndex, currentIndex + itemsPerPage)
                .map((article, index) => (
                  <div className="news-card" key={index}>
                    <img
                      src={article.urlToImage || "fallback-image.jpg"}
                      alt={article.title}
                    />
                    <h3>{article.title}</h3>
                    <p>{article.description?.substring(0, 100)}...</p>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      Read More
                    </a>
                  </div>
                ))}
            </div>
            <button className="btn-next" onClick={nextSlide}>
              Next ▶
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
