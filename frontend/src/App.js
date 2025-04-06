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
import VetAppointments from "./Components/VetAppointment";
import CreateAppointment from "./Components/CreateAppointment";
import VetDashboard from "./Components/VetDashboard";
import { jwtDecode } from "jwt-decode";
import About from "./Components/About";
import Service from "./Components/Service";
import ServiceDetail from "./Components/ServiceDetail";
import HomeVisitRequestForm from "./Components/HomeVisitRequestForm";
import VetHomeVisitDashboard from "./Components/VetHomeVisitDashboard";
import ESEWAPayment from "./Components/ESEWAPayment";
import PaymentFailure from "./Components/PaymentFailed";
import PaymentSuccess from "./Components/PaymentSuccess";
import AdminDashboard from "./Components/admin/AdminDashboard";
import ServiceApproval from "./Components/admin/ServiceApproval";
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
          <Route path="/vet-appointments" element={<VetAppointments />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route
            path="/payment/:appointmentId"
            element={
              isAuthenticated ? <ESEWAPayment /> : <Navigate to="/login" />
            }
          />
          {/* Admin Dashboard Route */}
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
