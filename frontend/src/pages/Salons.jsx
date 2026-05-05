import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, Loader2, AlertCircle } from "lucide-react";
import {
  salonService,
  serviceService,
  reviewService,
} from "../services/apiService";
import { useToast } from "../contexts/ToastContext";
import SalonFilterPanel from "../components/SalonFilterPanel";
import {
  handleSalonImageError,
  SALON_IMAGE_FALLBACK,
} from "../utils/imageUtils";

/**
 * Salons Page with Advanced Filtering
 * Allows users to search and filter salons by multiple criteria
 */
const Salons = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [salons, setSalons] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  // Debounce timer
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch all salons
      const salonsData = await salonService.getAllSalons();

      // Fetch all services for filter dropdown. Salons should still render if this helper request fails.
      try {
        const servicesData = await serviceService.getAllServices();
        setAllServices(servicesData);
      } catch (serviceError) {
        console.warn("Could not load service filters:", serviceError);
        setAllServices([]);
      }

      // Enhance salons with ratings and images
      const enhancedSalons = await enhanceSalonsWithRatings(salonsData);
      setSalons(enhancedSalons);

      // Extract unique cities
      const uniqueCities = [
        ...new Set(enhancedSalons.map((s) => s.city).filter(Boolean)),
      ];
      setCities(uniqueCities.sort());
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Erreur lors du chargement des salons");
    } finally {
      setLoading(false);
    }
  };

  // Enhance salons with rating stats and images
  const enhanceSalonsWithRatings = async (salonsData) => {
    return Promise.all(
      salonsData.map(async (salon) => {
        const displayImage = salonService.getImageUrl(salon.imagePath);
        try {
          const stats = await reviewService.getSalonRatingStats(salon.id);
          return {
            ...salon,
            displayImage,
            averageRating: stats.averageRating || 0,
            totalReviews: stats.totalReviews || 0,
          };
        } catch (error) {
          return {
            ...salon,
            displayImage,
            averageRating: 0,
            totalReviews: 0,
          };
        }
      }),
    );
  };

  // Handle filter changes with debouncing for search
  const handleFilterChange = useCallback(
    (filters) => {
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Debounce search input (300ms)
      const timeout = setTimeout(() => {
        applyFilters(filters);
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout],
  );

  // Apply filters to salon list
  const applyFilters = async (filters) => {
    setFilterLoading(true);
    try {
      // Build filter params for backend
      const filterParams = {};
      if (filters.name) filterParams.name = filters.name;
      if (filters.serviceId) filterParams.serviceId = filters.serviceId;
      if (filters.city) filterParams.city = filters.city;

      // Fetch filtered salons from backend
      const filteredSalons = await salonService.filterSalons(filterParams);

      // Enhance with ratings
      let enhancedSalons = await enhanceSalonsWithRatings(filteredSalons);

      // Apply frontend rating filter (since backend doesn't have ratings)
      if (filters.minRating > 0) {
        enhancedSalons = enhancedSalons.filter(
          (salon) => salon.averageRating >= filters.minRating,
        );
      }

      setSalons(enhancedSalons);
    } catch (err) {
      console.error("Error filtering salons:", err);
      toast.error("Erreur lors du filtrage");
    } finally {
      setFilterLoading(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    fetchInitialData();
  };

  // Navigate to salon detail
  const handleViewSalon = (salonId) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const salon = salons.find((s) => s.id === salonId);

    if (user.id && salon && salon.owner && salon.owner.id === user.id) {
      navigate(`/salon-dashboard/${salonId}`);
    } else {
      navigate(`/salon/${salonId}`);
    }
  };

  const getSalonCardImageSrc = (salon) => {
    const rawImagePath =
      typeof salon.imagePath === "string" ? salon.imagePath.trim() : "";

    if (/^https?:\/\//i.test(rawImagePath)) {
      return rawImagePath;
    }

    return salon.displayImage || SALON_IMAGE_FALLBACK;
  };

  const handleSalonCardImageError = (event, salon) => {
    const image = event.currentTarget;

    if (
      image.dataset.proxyTried !== "true" &&
      salon.displayImage &&
      image.src !== salon.displayImage
    ) {
      image.dataset.proxyTried = "true";
      image.src = salon.displayImage;
      return;
    }

    handleSalonImageError(event);
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={
            i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }
        />,
      );
    }
    return stars;
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200 animate-pulse"></div>
          <div className="p-4 space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Découvrez nos salons
          </h1>
          <p className="text-gray-600">
            Trouvez le salon parfait pour vos besoins
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <SalonFilterPanel
              onFilterChange={handleFilterChange}
              services={allServices}
              cities={cities}
              onReset={handleResetFilters}
              loading={filterLoading}
            />
          </div>

          {/* Salon List */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            {!loading && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-600">
                  {filterLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Recherche en cours...
                    </span>
                  ) : (
                    <span>
                      <span className="font-semibold text-gray-900">
                        {salons.length}
                      </span>{" "}
                      salon{salons.length !== 1 ? "s" : ""} trouvé
                      {salons.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && <LoadingSkeleton />}

            {/* Empty State */}
            {!loading && salons.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <AlertCircle size={64} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun salon trouvé
                </h3>
                <p className="text-gray-600 mb-6">
                  Aucun salon ne correspond à vos critères de recherche.
                  <br />
                  Essayez de modifier vos filtres.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {/* Salon Cards */}
            {!loading && salons.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {salons.map((salon) => (
                  <div
                    key={salon.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                    onClick={() => handleViewSalon(salon.id)}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={getSalonCardImageSrc(salon)}
                        alt={salon.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(event) =>
                          handleSalonCardImageError(event, salon)
                        }
                      />
                      {salon.averageRating > 0 && (
                        <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <Star
                            size={16}
                            className="fill-yellow-400 text-yellow-400"
                          />
                          <span className="font-bold text-gray-900">
                            {salon.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                        {salon.name}
                      </h3>

                      {/* Location */}
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin size={16} className="mr-1 flex-shrink-0" />
                        <span className="text-sm truncate">
                          {salon.address}, {salon.city}
                        </span>
                      </div>

                      {/* Rating - Always show, even with 0 reviews */}
                      <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                          {renderStars(Math.round(salon.averageRating || 0))}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({salon.totalReviews || 0} avis)
                        </span>
                      </div>

                      {/* Hours */}
                      <div className="text-sm text-gray-600 mb-4">
                        🕐 {salon.openingTime} - {salon.closingTime}
                      </div>

                      {/* View Button */}
                      <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition">
                        Voir les détails
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Salons;
