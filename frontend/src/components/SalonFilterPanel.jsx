import React, { useState, useEffect } from "react";
import { Search, Filter, X, Star, MapPin, Scissors } from "lucide-react";

/**
 * SalonFilterPanel Component
 * Comprehensive filtering system for salon search
 */
const SalonFilterPanel = ({
  onFilterChange,
  services = [],
  cities = [],
  onReset,
  loading = false,
}) => {
  const [filters, setFilters] = useState({
    name: "",
    serviceId: "",
    city: "",
    minRating: 0,
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Rating options
  const ratingOptions = [
    { value: 0, label: "Tous les avis", icon: "⭐" },
    { value: 4, label: "4★ et plus", icon: "⭐⭐⭐⭐" },
    { value: 3, label: "3★ et plus", icon: "⭐⭐⭐" },
  ];

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Reset all filters
  const handleReset = () => {
    const resetFilters = {
      name: "",
      serviceId: "",
      city: "",
      minRating: 0,
    };
    setFilters(resetFilters);
    onReset();
  };

  // Check if any filter is active
  const hasActiveFilters =
    filters.name || filters.serviceId || filters.city || filters.minRating > 0;

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition"
        >
          <Filter size={20} />
          Filtrer les salons
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-1 bg-primary-600 text-white text-xs rounded-full">
              {Object.values(filters).filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      <div
        className={`bg-white rounded-lg shadow-md p-6 space-y-6 ${
          showMobileFilters ? "block" : "hidden lg:block"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Filter size={20} className="text-primary-600" />
            Filtres
          </h3>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <X size={16} />
              Réinitialiser
            </button>
          )}
        </div>

        {/* Search by Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Search size={16} className="inline mr-1" />
            Rechercher par nom
          </label>
          <input
            type="text"
            placeholder="Ex: Beauty Salon..."
            value={filters.name}
            onChange={(e) => handleFilterChange("name", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
          />
        </div>

        {/* Service Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Scissors size={16} className="inline mr-1" />
            Service
          </label>
          <select
            value={filters.serviceId}
            onChange={(e) => handleFilterChange("serviceId", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            disabled={loading}
          >
            <option value="">Tous les services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Filtrer par service spécifique
          </p>
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MapPin size={16} className="inline mr-1" />
            Ville
          </label>
          <select
            value={filters.city}
            onChange={(e) => handleFilterChange("city", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            disabled={loading}
          >
            <option value="">Toutes les villes</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Star size={16} className="inline mr-1 text-yellow-500" />
            Évaluation minimum
          </label>
          <div className="space-y-2">
            {ratingOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                  filters.minRating === option.value
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-primary-300"
                }`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={option.value}
                  checked={filters.minRating === option.value}
                  onChange={(e) =>
                    handleFilterChange("minRating", parseInt(e.target.value))
                  }
                  className="w-4 h-4 text-primary-600"
                  disabled={loading}
                />
                <span className="ml-3 text-sm text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Filtres actifs:
            </p>
            <div className="flex flex-wrap gap-2">
              {filters.name && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  Nom: {filters.name}
                </span>
              )}
              {filters.serviceId && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  Service:{" "}
                  {services.find((s) => s.id === parseInt(filters.serviceId))
                    ?.name || filters.serviceId}
                </span>
              )}
              {filters.city && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  Ville: {filters.city}
                </span>
              )}
              {filters.minRating > 0 && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  Note: {filters.minRating}★+
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mobile Close Button */}
        <div className="lg:hidden pt-4">
          <button
            onClick={() => setShowMobileFilters(false)}
            className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Appliquer les filtres
          </button>
        </div>
      </div>
    </>
  );
};

export default SalonFilterPanel;
