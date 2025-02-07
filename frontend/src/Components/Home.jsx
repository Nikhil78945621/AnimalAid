import React from "react";
import "./../Views/Home.css";

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Animal Healthcare</h1>
          <p>
            Lorem ipsum dolor sit amet consectetur. Orcit fermentum posuere
            elementum quam lectus. Venenatis mattis rhoncus sapien semper. Lorem
            vivamus urna sit amet consectetur bibendum. Nisl facilisis ipsum est
            et velit malesuada tempus.
          </p>
          <a href="#services" className="btn-primary">
            Learn More
          </a>
        </div>
        <div className="hero-image">
          <img src="a.jpg" alt="Veterinarian with cow" />
        </div>
      </section>

      {/* News Section */}
      <section className="news-section">
        <h2>Latest News and Articles</h2>
        <div className="news-cards">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div className="news-card" key={index}>
                <img src="a.jpg" /* Replace with news image */ alt="News" />
                <h3>Breaking News</h3>
                <p>
                  A Synchrony study highlights the need for more client
                  education.
                </p>
                <a href="#read-more" className="btn-secondary">
                  Read More
                </a>
              </div>
            ))}
        </div>
        {/* Pagination */}
        <div className="pagination">
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </section>
    </div>
  );
};

export default Home;
