import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Toast Provider
import { ToastProvider } from "./contexts/ToastContext";

// Components
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/Register";
import SalonRegistration from "./pages/SalonRegistration";
import MyAppointments from "./pages/MyAppointments";

// New Components
import MySalons from "./pages/MySalons";
import SalonEdit from "./pages/SalonEdit";
import SalonDashboard from "./pages/SalonDashboard";
import SalonExplorerEnhanced from "./pages/SalonExplorerEnhanced";
import Salons from "./pages/Salons";
import SalonDetail from "./pages/SalonDetail";
import AppointmentDetail from "./pages/AppointmentDetail";
import ServiceFilter from "./pages/ServiceFilter";
import TestConnection from "./pages/TestConnection";
import UserProfile from "./pages/UserProfile";
import BookAppointment from "./pages/BookAppointment";
import BackendTest from "./pages/BackendTest";

function App() {
  return (
    <ToastProvider>
      <Router>
        <NavBar />
        <Routes>
          {/* Public Pages - No Authentication Required */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Pages - Authentication Required */}

          {/* Salon Exploration */}
          <Route
            path="/salons"
            element={
              <ProtectedRoute>
                <Salons />
              </ProtectedRoute>
            }
          />

          {/* Alternative route for old salon explorer (if needed) */}
          <Route
            path="/salons-old"
            element={
              <ProtectedRoute>
                <SalonExplorerEnhanced />
              </ProtectedRoute>
            }
          />

          {/* Salon Detail Page - Public access for reviews */}
          <Route path="/salon/:id" element={<SalonDetail />} />

          {/* Service Management */}
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <ServiceFilter />
              </ProtectedRoute>
            }
          />

          {/* Owner/Salon Management - OWNER Role Required */}
          <Route
            path="/proposer-salon"
            element={
              <ProtectedRoute requiredRole="OWNER">
                <SalonRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mes-salons"
            element={
              <ProtectedRoute requiredRole="OWNER">
                <MySalons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon-edit/:id"
            element={
              <ProtectedRoute requiredRole="OWNER">
                <SalonEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon-dashboard/:id"
            element={
              <ProtectedRoute requiredRole="OWNER">
                <SalonDashboard />
              </ProtectedRoute>
            }
          />

          {/* Appointments - Authentication Required */}
          <Route
            path="/mes-rendez-vous"
            element={
              <ProtectedRoute>
                <MyAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rendez-vous/:id"
            element={
              <ProtectedRoute>
                <AppointmentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rendez-vous/new"
            element={
              <ProtectedRoute>
                <BookAppointment />
              </ProtectedRoute>
            }
          />

          {/* User Profile - Authentication Required */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* Testing - Remove in production */}
          <Route path="/test-connection" element={<TestConnection />} />
          <Route path="/backend-test" element={<BackendTest />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
