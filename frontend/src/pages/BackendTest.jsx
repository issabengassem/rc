import React, { useState } from "react";
import {
  salonService,
  getApiBaseUrl,
} from "../services/apiService";

/**
 * Backend Connection Test Component
 * Use this to diagnose API connectivity issues
 */
function BackendTest() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, success, message, data = null) => {
    setResults((prev) => [
      ...prev,
      {
        test,
        success,
        message,
        data,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const runTests = async () => {
    setResults([]);
    setLoading(true);

    try {
      // Test 1: Check if backend is reachable
      addResult("Connection Test", null, "Testing backend connection...");
      try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/salons`);
        if (response.ok) {
          addResult(
            "Connection Test",
            true,
            "✅ Backend is reachable",
          );
        } else {
          addResult(
            "Connection Test",
            false,
            `❌ Backend returned status: ${response.status}`,
          );
        }
      } catch (err) {
        addResult(
          "Connection Test",
          false,
          `❌ Cannot connect to backend: ${err.message}`,
        );
      }

      // Test 2: Get all salons
      addResult("Get All Salons", null, "Fetching all salons...");
      try {
        const salons = await salonService.getAllSalons();
        addResult(
          "Get All Salons",
          true,
          `✅ Found ${salons.length} salons`,
          salons,
        );
      } catch (err) {
        addResult("Get All Salons", false, `❌ Error: ${err.message}`);
      }

      // Test 3: Check localStorage user
      addResult("User Auth", null, "Checking localStorage...");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.id) {
        addResult(
          "User Auth",
          true,
          `✅ User found: ${user.name} (ID: ${user.id}, Role: ${user.role})`,
          user,
        );

        // Test 4: Get user's salons (if owner)
        if (user.role === "OWNER") {
          addResult("Owner Salons", null, "Fetching owner salons...");
          try {
            const ownerSalons = await salonService.getSalonsByOwner(user.id);
            addResult(
              "Owner Salons",
              true,
              `✅ Found ${ownerSalons.length} salons for owner`,
              ownerSalons,
            );

            // Test 5: Get specific salon details
            if (ownerSalons.length > 0) {
              const firstSalon = ownerSalons[0];
              addResult(
                "Salon Details",
                null,
                `Fetching salon #${firstSalon.id}...`,
              );
              try {
                const salonDetails = await salonService.getSalonById(
                  firstSalon.id,
                );
                addResult(
                  "Salon Details",
                  true,
                  `✅ Successfully fetched salon: ${salonDetails.name}`,
                  salonDetails,
                );
              } catch (err) {
                addResult(
                  "Salon Details",
                  false,
                  `❌ Error fetching salon #${firstSalon.id}: ${err.message}`,
                );
              }
            }
          } catch (err) {
            addResult("Owner Salons", false, `❌ Error: ${err.message}`);
          }
        }
      } else {
        addResult(
          "User Auth",
          false,
          "❌ No user found in localStorage. Please login.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔧 Backend Connection Test
          </h1>
          <p className="text-gray-600 mb-6">
            This tool helps diagnose API connectivity issues between frontend
            and backend.
          </p>

          <button
            onClick={runTests}
            disabled={loading}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mb-6"
          >
            {loading ? "⏳ Running Tests..." : "▶️ Run Diagnostic Tests"}
          </button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Test Results:
              </h2>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.success === true
                      ? "bg-green-50 border-green-200"
                      : result.success === false
                        ? "bg-red-50 border-red-200"
                        : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {result.test}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {result.timestamp}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">
                    {result.message}
                  </p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                        View Data
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-64">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">
              📋 Common Issues:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                <strong>❌ Cannot connect to backend:</strong>
                <br />
                → Make sure your Spring Boot backend is running and the `/api`
                proxy is reachable
                <br />→ Check terminal for backend errors
              </li>
              <li>
                <strong>❌ CORS Error:</strong>
                <br />→ Ensure your backend has CORS configured to allow
                your frontend origin
              </li>
              <li>
                <strong>❌ 404 Not Found:</strong>
                <br />→ Verify API endpoints match backend routes (/api/salons,
                /api/appointments, etc.)
              </li>
              <li>
                <strong>❌ No user in localStorage:</strong>
                <br />→ Login through the frontend to save user data
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BackendTest;
