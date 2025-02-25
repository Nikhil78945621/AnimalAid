import React, { useState, useEffect } from "react";
import axios from "axios";
import "./../Views/Home.css";

const Home = () => {
  const [news, setNews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Track visible news index
  const itemsPerPage = 3; // Show 3 news articles per slide

  useEffect(() => {
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

  // Move to the next set of articles
  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + itemsPerPage < news.length ? prevIndex + itemsPerPage : 0
    );
  };

  // Move to the previous set of articles
  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - itemsPerPage >= 0
        ? prevIndex - itemsPerPage
        : Math.max(0, news.length - itemsPerPage)
    );
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Animal Healthcare</h1>
          <p>
            Providing the best healthcare solutions for your pets and livestock.
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
