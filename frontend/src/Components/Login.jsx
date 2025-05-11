import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Corrected import
import "./../Views/Login.css";

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        "https://animalaid-9duz.onrender.com/api/auth/login",
        { email, password }
      );

      if (response.data.status === "success") {
        const decode = jwtDecode(response.data.token); // Decode token after successful login
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", decode.role); // Store the role from decoded token
        setIsAuthenticated(true);
        navigate("/");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {message && <p className="login-message error">{message}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing In..." : "Login"}
          </button>

          <div className="login-footer">
            <p className="login-link-text">
              Don't have an account?{" "}
              <Link to="/signup" className="login-link">
                Create Account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
