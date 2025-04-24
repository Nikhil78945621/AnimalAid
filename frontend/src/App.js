import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./Components/Home";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import Navbar from "./Components/Navbar";
import UserAppointments from "./Components/UserAppointment";
import VetAppointments from "./Components/vet/VetAppointment";
import CreateAppointment from "./Components/CreateAppointment";
import VetDashboard from "./Components/vet/VetDashboard";
import { jwtDecode } from "jwt-decode";
import About from "./Components/About";
import Service from "./Components/Service/Service";
import ServiceDetail from "./Components/Service/ServiceDetail";
import HomeVisitRequestForm from "./Components/HomeVisitRequestForm";
import VetHomeVisitDashboard from "./Components/vet/VetHomeVisitDashboard";
import KhaltiPayment from "./Components/payment/KhaltiPayment";
import PaymentFailure from "./Components/payment/PaymentFailed";
import PaymentSuccess from "./Components/payment/PaymentSuccess";
import AdminDashboard from "./Components/admin/AdminDashboard";
import ServiceApproval from "./Components/admin/ServiceApproval";
import UserHomeVisitRequests from "./Components/UserHomeVisitRequests";
import VetChat from "./Components/vet/VetChat";
import "./Views/Theme.css";
import Footer from "./Components/Footer";
import Payment from "./Components/Payment";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div>
      <Router>
        <Navbar
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/About" element={<About />} />
          <Route path="/service" element={<Service />} />
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/services/:serviceType" element={<ServiceDetail />} />
          <Route path="/home-visit" element={<HomeVisitRequestForm />} />
          <Route path="/vet-home-visit" element={<VetHomeVisitDashboard />} />
          <Route path="/my-requests" element={<UserHomeVisitRequests />} />
          <Route path="/vet-appointments" element={<VetAppointments />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />

          <Route
            path="/payment/:appointmentId"
            element={
              isAuthenticated ? <KhaltiPayment /> : <Navigate to="/login" />
            }
          />
          <Route path="/vet-chat" element={<VetChat />} />
          <Route path="/Payment" element={<Payment />} />
          <Route
            path="/admin-dashboard"
            element={
              isAuthenticated ? (
                userRole === "vet" ? (
                  <VetAppointments />
                ) : (
                  <AdminDashboard />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/service-approvals" element={<ServiceApproval />} />
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
        <Footer />
      </Router>
    </div>
  );
};

export default App;
