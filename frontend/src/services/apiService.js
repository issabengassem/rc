// API Service - Centralized backend communication
import { resolveImageUrl } from "../utils/imageUtils";

// Base URL for all API calls - FIXED: Made configurable for local development vs production
const isLocalDevelopment = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "0.0.0.0";

export const getBackendBaseUrl = () => {
  // 1) Explicit env var takes priority (for DigitalOcean / production)
  const envUrl = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  // 2) Local development
  if (isLocalDevelopment()) {
    // Use same hostname as frontend but backend port 8080 to avoid CORS mismatch
    return `http://${window.location.hostname}:8080`;
  }
  // 3) Production on same host (e.g. DigitalOcean single service or proxy)
  // If frontend and backend share same DigitalOcean App, use relative path
  return "";
};

export const getApiBaseUrl = () => `${getBackendBaseUrl()}/api`;

const API_BASE_URL = getApiBaseUrl();

// Normalize duration helper: if backend sent seconds (large numbers), convert to minutes
const normalizeDurationValue = (d) => {
  if (d == null) return null;
  const n = Number(d);
  if (Number.isNaN(n)) return d;
  // If value > 600, assume it's seconds and convert to minutes
  return n > 600 ? Math.round(n / 60) : n;
};

const normalizeServiceObject = (s) => {
  if (!s) return s;
  return {
    ...s,
    durationMinutes:
      normalizeDurationValue(s.durationMinutes) ?? s.durationMinutes,
  };
};

const getPublicHeaders = () => ({
  Accept: "application/json",
});

// Helper function to get auth headers with JWT token
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function for handling responses
const handleResponse = async (response) => {
  console.log("=== handleResponse ===");
  console.log("Response status:", response.status);
  console.log("Response ok:", response.ok);
  console.log(
    "Response headers:",
    Object.fromEntries(response.headers.entries()),
  );
  // Robust error handling: read text first (response.json() may fail on empty body)
  if (!response.ok) {
    // Handle 401 Unauthorized - token invalid or expired
    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const textResponse = await response.text();
      console.log("Error response as text:", textResponse);
      if (textResponse) {
        try {
          const errorData = JSON.parse(textResponse);
          console.log("Error data from backend:", errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonParseErr) {
          // Not JSON, use raw text
          errorMessage = textResponse;
        }
      }
    } catch (readErr) {
      console.error("Failed to read error response:", readErr);
    }

    // Provide a clearer message for 403 if backend provided nothing useful
    if (response.status === 403 && !errorMessage) {
      errorMessage =
        "Erreur d'authentification (403). Vérifiez que vous êtes connecté et que votre token est valide.";
    }

    throw new Error(errorMessage);
  }

  // success path: read text then try to parse JSON (some endpoints may return empty body)
  try {
    const text = await response.text();
    if (!text) {
      console.log("Success response: empty body");
      return null;
    }
    try {
      const data = JSON.parse(text);
      console.log("Success response data:", data);
      return data;
    } catch (parseErr) {
      // Not JSON, return raw text
      console.log("Success response is not JSON, returning text");
      return text;
    }
  } catch (err) {
    console.error("Failed to read success response:", err);
    throw err;
  }
};

// ==================== AUTHENTICATION ENDPOINTS ====================

export const authService = {
  // Login
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Email ou mot de passe incorrect",
      }));
      throw new Error(error.message || "Email ou mot de passe incorrect");
    }

    return response.json();
  },

  // Logout (clear local storage)
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("accessToken");
  },

  // Get token
  getToken: () => {
    return localStorage.getItem("accessToken");
  },

  // Google OAuth - redirect to backend authorization endpoint
  getGoogleAuthUrl: () => `${getBackendBaseUrl()}/oauth2/authorization/google`,

  // Google ID token login (GIS)
  googleIdTokenLogin: async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Échec Google login" }));
      throw new Error(err.error || err.message || "Échec Google login");
    }
    return response.json();
  },
};

// ==================== USER ENDPOINTS ====================

export const userService = {
  // Create new user (registration)
  createUser: async (userData) => {
    const requestBody = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password, // Add password field
      role: userData.role, // 'CLIENT' or 'OWNER'
    };

    console.log("API Request Body:", requestBody);

    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    return handleResponse(response);
  },

  // Get all users
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.ok;
  },

  // Get users by role
  getUsersByRole: async (role) => {
    const response = await fetch(`${API_BASE_URL}/users/role/${role}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== SALON ENDPOINTS ====================

export const salonService = {
  // Create salon with image - TWO STEP APPROACH (transparent to user)
  // Step 1: Create salon with JSON, Step 2: Upload image separately
  // This avoids Tomcat multipart file count limit issues
  createSalon: async (salonData, imageFile) => {
    console.log("Creating salon with data:", salonData);
    console.log("Image file:", imageFile);

    // Step 1: Create salon without image (using JSON - no multipart issues)
    const response = await fetch(`${API_BASE_URL}/salons`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: salonData.name,
        address: salonData.address,
        city: salonData.city,
        phone: salonData.phone,
        description: salonData.description || "",
        openingTime: salonData.openingTime,
        closingTime: salonData.closingTime,
        ownerId: salonData.ownerId,
        latitude: salonData.latitude,
        longitude: salonData.longitude,
      }),
    });

    const createdSalon = await handleResponse(response);
    console.log("Salon created successfully:", createdSalon);

    // Step 2: Upload image if provided (only 1 file = no multipart limit issues)
    if (imageFile) {
      try {
        console.log("Uploading image for salon ID:", createdSalon.id);
        const updatedSalon = await salonService.uploadSalonImage(
          createdSalon.id,
          imageFile,
        );
        console.log("Image uploaded successfully");
        return updatedSalon;
      } catch (error) {
        console.warn("Image upload failed, but salon was created:", error);
        // Return salon even if image upload fails
        return createdSalon;
      }
    }

    return createdSalon;
  },

  // Get all salons
  getAllSalons: async () => {
    const response = await fetch(`${API_BASE_URL}/salons`, {
      headers: getPublicHeaders(),
    });
    return handleResponse(response);
  },

  // Get salon by ID
  getSalonById: async (salonId) => {
    const response = await fetch(`${API_BASE_URL}/salons/${salonId}`, {
      headers: getPublicHeaders(),
    });
    return handleResponse(response);
  },

  // Update salon
  updateSalon: async (salonId, salonData) => {
    const response = await fetch(`${API_BASE_URL}/salons/${salonId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(salonData),
    });
    return handleResponse(response);
  },

  // Delete salon
  deleteSalon: async (salonId) => {
    const response = await fetch(`${API_BASE_URL}/salons/${salonId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.ok;
  },

  // Get salons by city
  getSalonsByCity: async (city) => {
    const response = await fetch(`${API_BASE_URL}/salons/city/${city}`, {
      headers: getPublicHeaders(),
    });
    return handleResponse(response);
  },

  // Get salons by owner
  getSalonsByOwner: async (ownerId) => {
    const response = await fetch(`${API_BASE_URL}/salons/owner/${ownerId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Search salons by name
  searchSalons: async (name) => {
    const response = await fetch(
      `${API_BASE_URL}/salons/search?name=${encodeURIComponent(name)}`,
      {
        headers: getPublicHeaders(),
      },
    );
    return handleResponse(response);
  },

  // Filter salons with multiple criteria
  filterSalons: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.name) params.append("name", filters.name);
    if (filters.serviceId) params.append("serviceId", filters.serviceId);
    if (filters.city) params.append("city", filters.city);

    const queryString = params.toString();
    const url = queryString
      ? `${API_BASE_URL}/salons/filter?${queryString}`
      : `${API_BASE_URL}/salons`;

    const response = await fetch(url, {
      headers: getPublicHeaders(),
    });
    return handleResponse(response);
  },

  // Upload salon image separately
  uploadSalonImage: async (salonId, imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const token = localStorage.getItem("accessToken");
    console.log("Uploading image - Token present:", !!token);
    console.log("Salon ID:", salonId);
    console.log("Image file:", imageFile.name, imageFile.size, imageFile.type);

    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // IMPORTANT: Do NOT set Content-Type header for FormData
    // The browser will automatically set it with the correct boundary
    const response = await fetch(
      `${API_BASE_URL}/salons/${salonId}/upload-image`,
      {
        method: "POST",
        headers: headers, // This will NOT include Content-Type - browser sets it
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload response:", response.status, errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    return handleResponse(response);
  },

  // Delete salon image
  deleteSalonImage: async (salonId) => {
    const response = await fetch(`${API_BASE_URL}/salons/${salonId}/image`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.ok;
  },

  // Update salon image with URL
  updateSalonImageUrl: async (salonId, imageUrl) => {
    const response = await fetch(
      `${API_BASE_URL}/salons/${salonId}/update-image-url`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ imageUrl }),
      },
    );
    return handleResponse(response);
  },

  // Get image URL
  getImageUrl: (imagePath) => {
    const baseUrl = getBackendBaseUrl();

    const buildExternalImageProxyUrl = (url) =>
      `${baseUrl}/api/files/external-image?url=${encodeURIComponent(url)}`;

    return resolveImageUrl(
      imagePath,
      (localPath) => `${baseUrl}/api/files/salons/${localPath}`,
      buildExternalImageProxyUrl,
    );
  },
};

// ==================== SERVICE ENDPOINTS ====================

export const serviceService = {
  // Create service
  createService: async (serviceData) => {
    const response = await fetch(`${API_BASE_URL}/services`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        durationMinutes: serviceData.durationMinutes,
        salonId: serviceData.salonId,
      }),
    });
    return handleResponse(response);
  },

  // Get all services
  getAllServices: async () => {
    const response = await fetch(`${API_BASE_URL}/services`, {
      headers: getPublicHeaders(),
    });
    const data = await handleResponse(response);
    if (Array.isArray(data)) return data.map(normalizeServiceObject);
    return data;
  },

  // Get service by ID
  getServiceById: async (serviceId) => {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      headers: getPublicHeaders(),
    });
    const data = await handleResponse(response);
    return normalizeServiceObject(data);
  },

  // Update service
  updateService: async (serviceId, serviceData) => {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(serviceData),
    });
    return handleResponse(response);
  },

  // Delete service
  deleteService: async (serviceId) => {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.ok;
  },

  // Get services by salon
  getServicesBySalon: async (salonId) => {
    const response = await fetch(`${API_BASE_URL}/services/salon/${salonId}`, {
      headers: getPublicHeaders(),
    });
    const data = await handleResponse(response);
    if (Array.isArray(data)) return data.map(normalizeServiceObject);
    return data;
  },

  // Get services by max price
  getServicesByMaxPrice: async (maxPrice) => {
    const response = await fetch(
      `${API_BASE_URL}/services/price?maxPrice=${maxPrice}`,
      {
        headers: getPublicHeaders(),
      },
    );
    return handleResponse(response);
  },
};

// ==================== APPOINTMENT ENDPOINTS ====================

export const appointmentService = {
  // Create appointment - CLIENT (creates for themselves)
  createAppointment: async (appointmentData) => {
    const user = authService.getCurrentUser();
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        appointmentDateTime: appointmentData.appointmentDateTime, // format: "2026-02-20T14:30"
        notes: appointmentData.notes,
        clientId: user.id, // Explicitly send the user ID
        salonId: appointmentData.salonId,
        serviceId: appointmentData.serviceId,
      }),
    });
    return handleResponse(response);
  },

  // Create appointment - OWNER (creates for a client)
  createAppointmentForClient: async (appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/appointments/owner-create`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        appointmentDateTime: appointmentData.appointmentDateTime,
        notes: appointmentData.notes,
        clientId: appointmentData.clientId, // Required: which client
        salonId: appointmentData.salonId,
        serviceId: appointmentData.serviceId,
        // createdBy is auto-assigned by backend from JWT token
      }),
    });
    return handleResponse(response);
  },

  // Get my appointments (for logged-in user)
  getMyAppointments: async () => {
    const user = authService.getCurrentUser();
    if (!user || !user.id) {
      throw new Error("User not logged in");
    }

    // Use existing backend endpoint /appointments/client/{clientId}
    const response = await fetch(
      `${API_BASE_URL}/appointments/client/${user.id}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  // Get all appointments
  getAllAppointments: async () => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get appointment by ID
  getAppointmentById: async (appointmentId) => {
    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId, status) => {
    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}/status?status=${status}`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId) => {
    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}/cancel`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      },
    );
    return response.ok;
  },

  // Delete appointment
  deleteAppointment: async (appointmentId) => {
    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );
    return response.ok;
  },

  // Get appointments by client
  getAppointmentsByClient: async (clientId) => {
    const response = await fetch(
      `${API_BASE_URL}/appointments/client/${clientId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  // Get appointments by salon
  getAppointmentsBySalon: async (salonId) => {
    const response = await fetch(
      `${API_BASE_URL}/appointments/salon/${salonId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  // Get appointments by status
  getAppointmentsByStatus: async (status) => {
    const response = await fetch(
      `${API_BASE_URL}/appointments/status/${status}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  // Get appointments by service (optionally filtered by date)
  getAppointmentsByService: async (serviceId, date = null) => {
    let url = `${API_BASE_URL}/appointments/service/${serviceId}`;
    if (date) {
      url += `?date=${date}`;
    }
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    // Normalize reservation service durations if present
    if (Array.isArray(data)) {
      return data.map((apt) => {
        const normalized = { ...apt };
        if (normalized.service) {
          normalized.service = normalizeServiceObject(normalized.service);
        }
        // Normalize any top-level serviceDuration field
        if (normalized.serviceDuration != null) {
          normalized.serviceDuration = normalizeDurationValue(
            normalized.serviceDuration,
          );
        }
        return normalized;
      });
    }
    return data;
  },
};

// ==================== REVIEW ENDPOINTS ====================

export const reviewService = {
  // Create a new review (AUTH REQUIRED)
  createReview: async (reviewData) => {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse(response);
  },

  // Get all reviews for a salon (PUBLIC)
  getSalonReviews: async (salonId) => {
    const response = await fetch(`${API_BASE_URL}/reviews/salon/${salonId}`, {
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
  },

  // Get salon rating statistics (PUBLIC)
  getSalonRatingStats: async (salonId) => {
    const response = await fetch(
      `${API_BASE_URL}/reviews/salon/${salonId}/stats`,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    return handleResponse(response);
  },

  // Delete a review (AUTH REQUIRED - only owner)
  deleteReview: async (reviewId) => {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Check if user has already reviewed a salon (AUTH REQUIRED)
  checkIfReviewed: async (salonId) => {
    const response = await fetch(`${API_BASE_URL}/reviews/check/${salonId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Export all services
export default {
  userService,
  salonService,
  serviceService,
  appointmentService,
  reviewService,
};
