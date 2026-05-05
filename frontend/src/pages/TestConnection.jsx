import React, { useState } from "react";
import {
  salonService,
  userService,
  appointmentService,
  serviceService,
} from "../services/apiService";

const TestConnection = () => {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  const testEndpoint = async (name, testFn) => {
    try {
      const result = await testFn();
      setResults((prev) => ({
        ...prev,
        [name]: { success: true, data: result },
      }));
      return true;
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [name]: { success: false, error: error.message },
      }));
      return false;
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults({});

    // FIXED: Use configurable API URL for local development vs production
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080/api'
      : 'https://rc-production-3ae4.up.railway.app/api';

    // Test backend connection
    await testEndpoint("Backend Connection", async () => {
      const response = await fetch(`${baseUrl}/salons`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return "Connected";
    });

    // Test Salons
    await testEndpoint("Get All Salons", () => salonService.getAllSalons());

    // Test Users
    await testEndpoint("Get All Users", () => userService.getAllUsers());

    // Test Services
    await testEndpoint("Get All Services", () =>
      serviceService.getAllServices(),
    );

    // Test Appointments
    await testEndpoint("Get All Appointments", () =>
      appointmentService.getAllAppointments(),
    );

    setTesting(false);
  };

  const testUserRegistration = async () => {
    setTesting(true);
    const testUser = {
      name: "Test User",
      email: `test${Date.now()}@example.com`,
      phone: "+212612345678",
      role: "CLIENT",
    };

    await testEndpoint("Create User", () => userService.createUser(testUser));
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Backend Connection Test</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Make sure your Spring Boot backend is running on port 8080</li>
            <li>Click "Run All Tests" to test connectivity</li>
            <li>Check console for detailed error messages (F12)</li>
          </ol>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={testing}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {testing ? "Testing..." : "Run All Tests"}
          </button>

          <button
            onClick={testUserRegistration}
            disabled={testing}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
          >
            Test User Registration
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(results).map(([name, result]) => (
            <div
              key={name}
              className={`p-4 rounded-lg border-2 ${
                result.success
                  ? "bg-green-50 border-green-500"
                  : "bg-red-50 border-red-500"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{name}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    result.success
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {result.success ? "✓ SUCCESS" : "✗ FAILED"}
                </span>
              </div>

              {result.success ? (
                <div className="text-sm text-gray-700">
                  <p>
                    Data received:{" "}
                    {Array.isArray(result.data)
                      ? `${result.data.length} items`
                      : JSON.stringify(result.data)}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-red-700">
                  <p className="font-medium">Error: {result.error}</p>
                  <p className="mt-2 text-xs">Common causes:</p>
                  <ul className="list-disc list-inside mt-1 text-xs">
                    <li>Backend not running on port 8080</li>
                    <li>CORS not properly configured</li>
                    <li>Database connection issues</li>
                    <li>No data in database</li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {Object.keys(results).length === 0 && !testing && (
          <div className="text-center text-gray-500 py-12">
            <p>Click "Run All Tests" to check backend connectivity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestConnection;
