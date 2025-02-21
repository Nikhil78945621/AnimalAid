import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate, // Import useLocation hook
} from "react-router-dom";

import Home from "./Components/Home";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import Navbar from "./Components/Navbar";
import UserAppointments from "./Components/UserAppointment";
import VetAppointments from "./Components/VetAppointment";
import CreateAppointment from "./Components/CreateAppointment";
import VetDashboard from "./Components/VetDashboard";
import { jwtDecode } from "jwt-decode";
import "./App.css";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token decoding failed. Redirecting to login.");
        setIsAuthenticated(false);
        localStorage.removeItem("token");
      }
    }
  }, []);

  return (
    <div>
      <Router>
        <Navbar isAuthenticated={isAuthenticated} userRole={userRole} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route
            path="/appointments"
            element={
              isAuthenticated ? (
                userRole === "vet" ? (
                  <VetAppointments />
                ) : (
                  <UserAppointments />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/appointments/new"
            element={
              isAuthenticated ? (
                userRole === "vet" ? (
                  <VetAppointments />
                ) : (
                  <CreateAppointment />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/vet-appointments"
            element={
              isAuthenticated ? (
                userRole === "user" ? (
                  <CreateAppointment />
                ) : (
                  <VetAppointments />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/vet-dashboard"
            element={
              isAuthenticated ? (
                userRole === "user" ? (
                  <CreateAppointment />
                ) : (
                  <VetDashboard />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
