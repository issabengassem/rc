import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/apiService";

/**
 * ProtectedRoute component to protect routes that require authentication
 *
 * Usage:
 * <ProtectedRoute>
 *   <YourComponent />
 * </ProtectedRoute>
 *
 * With role checking:
 * <ProtectedRoute requiredRole="OWNER">
 *   <OwnerDashboard />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  // Check if user is authenticated
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if role is required and matches
  if (requiredRole && currentUser.role !== requiredRole) {
    // Redirect to appropriate dashboard or home
    if (currentUser.role === "CLIENT") {
      return <Navigate to="/salons" replace />;
    } else if (currentUser.role === "OWNER") {
      return <Navigate to="/mes-salons" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
