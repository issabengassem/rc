import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Filter,
  Heart,
  DollarSign,
  Clock,
} from "lucide-react";
import { salonService, reviewService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";

const SalonExplorerEnhanced = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [salons, setSalons] = useState([]);
  const [allSalons, setAllSalons] = useState([]); // Store all salons
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState({
    city: "",
    minRating: 0,
    maxPrice: 1000,
    hasAvailability: false,
  });
  const [cities, setCities] = useState([]);

  const handleViewSalon = (salonId) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // Check if user is owner of this salon
    const salon = salons.find((s) => s.id === salonId);
    if (user.id && salon && salon.owner && salon.owner.id === user.id) {
      // Owner viewing their own salon - go to dashboard
      navigate(`/salon-dashboard/${salonId}`);
    } else {
      // Regular user or not logged in - go to salon detail page
      navigate(`/salon/${salonId}`);
    }
  };

  useEffect(() => {
    fetchSalons();

    // Refetch when page becomes visible (e.g., returning from salon detail)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSalons();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchSalons = async () => {
    setLoading(true);
    try {
      const data = await salonService.getAllSalons();

      // Fetch review stats for each salon
      const salonsWithImagesAndRatings = await Promise.all(
        data.map(async (salon) => {
          try {
            const stats = await reviewService.getSalonRatingStats(salon.id);
            return {
              ...salon,
              displayImage: salon.imagePath
                ? salonService.getImageUrl(salon.imagePath)
                : "https://placehold.co/400x300?text=No+Image",
              averageRating: stats.averageRating || 0,
              totalReviews: stats.totalReviews || 0,
            };
          } catch (error) {
            // If review stats fail, continue without ratings
            return {
              ...salon,
              displayImage: salon.imagePath
                ? salonService.getImageUrl(salon.imagePath)
                : "https://placehold.co/400x300?text=No+Image",
              averageRating: 0,
              totalReviews: 0,
            };
          }
        }),
      );

      setAllSalons(salonsWithImagesAndRatings);
      setSalons(salonsWithImagesAndRatings);

      // Extract unique cities
      const uniqueCities = [
        ...new Set(
          salonsWithImagesAndRatings.map((s) => s.city).filter(Boolean),
        ),
      ];
      setCities(uniqueCities);

      setLoading(false);
    } catch (err) {
      console.error("Erreur fetch salons:", err);
      setLoading(false);
    }
  };

  // Server-side search by name
  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      // If search is empty, apply city filter or show all
      if (filters.city) {
        await fetchSalonsByCity(filters.city);
      } else {
        setSalons(allSalons);
      }
      return;
    }

    setSearchLoading(true);
    try {
      const data = await salonService.searchSalons(term);

      // Fetch review stats for search results
      const salonsWithImagesAndRatings = await Promise.all(
        data.map(async (salon) => {
          try {
            const stats = await reviewService.getSalonRatingStats(salon.id);
            return {
              ...salon,
              displayImage: salon.imagePath
                ? salonService.getImageUrl(salon.imagePath)
                : "https://placehold.co/400x300?text=No+Image",
              averageRating: stats.averageRating || 0,
              totalReviews: stats.totalReviews || 0,
            };
          } catch (error) {
            return {
              ...salon,
              displayImage: salon.imagePath
                ? salonService.getImageUrl(salon.imagePath)
                : "https://placehold.co/400x300?text=No+Image",
              averageRating: 0,
              totalReviews: 0,
            };
          }
        }),
      );

      // Apply city filter if active
      if (filters.city) {
        setSalons(
          salonsWithImagesAndRatings.filter((s) => s.city === filters.city),
        );
      } else {
        setSalons(salonsWithImagesAndRatings);
      }
    } catch (err) {
      console.error("Error searching salons:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Server-side filter by city
  const handleCityFilter = async (city) => {
    setFilters((prev) => ({ ...prev, city }));

    if (city === "") {
      // If no city selected, apply search or show all
      if (searchTerm) {
        await handleSearch(searchTerm);
      } else {
        setSalons(allSalons);
      }
      return;
    }

    setSearchLoading(true);
    try {
      await fetchSalonsByCity(city);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchSalonsByCity = async (city) => {
    try {
      const data = await salonService.getSalonsByCity(city);

      // Fetch review stats for city results
      const salonsWithImagesAndRatings = await Promise.all(
        data.map(async (salon) => {
          try {
            const stats = await reviewService.getSalonRatingStats(salon.id);
            return {
              ...salon,
              displayImage: salon.imagePath
                ? salonService.getImageUrl(salon.imagePath)
                : "https://placehold.co/400x300?text=No+Image",
              averageRating: stats.averageRating || 0,
              totalReviews: stats.totalReviews || 0,
            };
          } catch (error) {
            return {
              ...salon,
              displayImage: salon.imagePath
                ? salonService.getImageUrl(salon.imagePath)
                : "https://placehold.co/400x300?text=No+Image",
              averageRating: 0,
              totalReviews: 0,
            };
          }
        }),
      );

      // Apply search filter if active
      if (searchTerm) {
        const filtered = salonsWithImagesAndRatings.filter((s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );
        setSalons(filtered);
      } else {
        setSalons(salonsWithImagesAndRatings);
      }
    } catch (err) {
      console.error("Error fetching salons by city:", err);
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === "city") {
      handleCityFilter(value);
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  // Client-side filtering for other filters (rating, price, etc)
  const filteredSalons = salons.filter((salon) => {
    // Search and city are now handled server-side
    return true; // Additional filters can be added here
  });

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const decimal = rating % 1;

    // Star logic: Full star, Half star (0.25-0.75), Round up (>=0.75)
    let displayStars = fullStars;
    let hasHalfStar = false;

    if (decimal >= 0.75) {
      displayStars = fullStars + 1;
    } else if (decimal >= 0.25) {
      hasHalfStar = true;
    }

    for (let i = 1; i <= 5; i++) {
      if (i <= displayStars) {
        stars.push(
          <Star
            key={i}
            size={16}
            className="fill-yellow-400 text-yellow-400"
          />,
        );
      } else if (i === displayStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star size={16} className="fill-gray-200 text-gray-200" />
            <Star
              size={16}
              className="fill-yellow-400 text-yellow-400 absolute top-0 left-0"
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </div>,
        );
      } else {
        stars.push(
          <Star key={i} size={16} className="fill-gray-200 text-gray-200" />,
        );
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">
            Chargement des salons...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header & Search */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Explorez nos salons
          </h2>
          <p className="text-gray-600 mb-6">
            Recherche avancée et filtres personnalisés
          </p>

          <div className="max-w-2xl mx-auto relative shadow-sm rounded-full overflow-hidden border bg-white">
            <input
              type="text"
              placeholder="Rechercher un salon, une ville, une adresse..."
              className="w-full py-4 px-6 pl-12 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              </div>
            )}
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Filtres avancés
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Ville
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Star size={16} className="inline mr-1" />
                Note minimale
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={filters.minRating}
                onChange={(e) =>
                  handleFilterChange("minRating", Number(e.target.value))
                }
              >
                <option value="0">Toutes les notes</option>
                <option value="3">3+ étoiles</option>
                <option value="4">4+ étoiles</option>
                <option value="4.5">4.5+ étoiles</option>
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={16} className="inline mr-1" />
                Prix maximum
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={filters.maxPrice}
                onChange={(e) =>
                  handleFilterChange("maxPrice", Number(e.target.value))
                }
              >
                <option value="1000">Tous les prix</option>
                <option value="100">Jusqu'à 100 DH</option>
                <option value="200">Jusqu'à 200 DH</option>
                <option value="500">Jusqu'à 500 DH</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Disponibilité
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  checked={filters.hasAvailability}
                  onChange={(e) =>
                    handleFilterChange("hasAvailability", e.target.checked)
                  }
                />
                <span className="ml-2 text-sm text-gray-700">
                  Disponible aujourd'hui
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={() =>
              setFilters({
                city: "",
                minRating: 0,
                maxPrice: 1000,
                hasAvailability: false,
              })
            }
            className="mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Réinitialiser les filtres
          </button>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">
              {filteredSalons.length}
            </span>{" "}
            salon(s) trouvé(s)
          </p>
        </div>

        {/* Salons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredSalons.map((salon) => (
            <div
              key={salon.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
            >
              {/* Image Section */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={salon.displayImage}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error(
                      "Failed to load image for salon:",
                      salon.name,
                      "URL:",
                      e.target.src,
                    );
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src =
                      "https://placehold.co/400x300?text=Error+Image";
                  }}
                />
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full cursor-pointer hover:bg-white transition-colors">
                  <Heart size={18} className="text-gray-600" />
                </div>
              </div>

              {/* Content Section */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {salon.name}
                  </h3>
                  <span className="flex items-center bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold border border-green-100">
                    Nouveau
                  </span>
                </div>

                <div className="flex items-center text-gray-500 text-sm mb-3">
                  <MapPin size={16} className="mr-1" />
                  <span className="truncate">
                    {salon.city || "Ville non spécifiée"}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {salon.address || "Adresse non spécifiée"}
                </p>

                {/* Rating Display */}
                {salon.averageRating !== undefined &&
                salon.averageRating > 0 ? (
                  <div
                    className="flex items-center mb-4"
                    title={`Note moyenne basée sur ${salon.totalReviews || 0} avis`}
                  >
                    <div className="flex gap-0.5 mr-2">
                      {renderStars(salon.averageRating)}
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      {salon.averageRating.toFixed(1)}
                    </span>
                    {salon.totalReviews !== undefined && (
                      <span className="text-sm text-gray-500 ml-1.5">
                        ({salon.totalReviews} avis)
                      </span>
                    )}
                  </div>
                ) : salon.averageRating !== undefined ? (
                  <div className="flex items-center text-gray-400 text-sm mb-4">
                    <div className="flex gap-0.5 mr-2">{renderStars(0)}</div>
                    <span className="text-gray-500">Aucun avis</span>
                  </div>
                ) : (
                  <div className="flex items-center mb-4 animate-pulse">
                    <div className="flex gap-0.5 mr-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-[16px] h-[16px] bg-gray-200 rounded"
                        ></div>
                      ))}
                    </div>
                    <div className="h-4 w-8 bg-gray-200 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded ml-1.5"></div>
                  </div>
                )}

                <button
                  onClick={() => handleViewSalon(salon.id)}
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Réserver maintenant
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredSalons.length === 0 && (
          <div className="text-center py-16">
            <Search className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun salon trouvé
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalonExplorerEnhanced;
