import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Clock,
  DollarSign,
  Tag,
  AlertCircle,
} from "lucide-react";
import { serviceService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";

const ServiceFilter = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    maxPrice: 1000,
    maxDuration: 180,
  });

  const categories = [
    "Coupe",
    "Coloration",
    "Brushing",
    "Coiffure",
    "Soins",
    "Manucure",
    "Pédicure",
    "Épilation",
    "Maquillage",
    "Massage",
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviceService.getAllServices();
      setServices(data);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Erreur lors du chargement des services");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description &&
        service.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      !filters.category || service.category === filters.category;
    const matchesPrice = service.price <= filters.maxPrice;
    const matchesDuration =
      (service.duration || service.durationMinutes || 0) <= filters.maxDuration;

    return matchesSearch && matchesCategory && matchesPrice && matchesDuration;
  });

  const handleBookService = (service) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      toast.warning("Vous devez être connecté pour réserver");
      navigate("/login");
      return;
    }
    // Navigate to salon page or booking page
    navigate(`/salons`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="text-red-600 mb-2" size={32} />
          <h2 className="text-lg font-semibold text-red-900 mb-2">Erreur</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchServices}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explorer les services
          </h1>
          <p className="text-gray-600 mb-6">
            Parcourez et filtrez tous les services disponibles
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative shadow-sm rounded-full overflow-hidden border bg-white">
            <input
              type="text"
              placeholder="Rechercher un service..."
              className="w-full py-4 px-6 pl-12 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag size={16} className="inline mr-1" />
                Catégorie
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={16} className="inline mr-1" />
                Prix maximum: {filters.maxPrice} DH
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                className="w-full"
                value={filters.maxPrice}
                onChange={(e) =>
                  handleFilterChange("maxPrice", Number(e.target.value))
                }
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 DH</span>
                <span>1000 DH</span>
              </div>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Durée maximum: {filters.maxDuration} min
              </label>
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                className="w-full"
                value={filters.maxDuration}
                onChange={(e) =>
                  handleFilterChange("maxDuration", Number(e.target.value))
                }
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15 min</span>
                <span>180 min</span>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              setFilters({ category: "", maxPrice: 1000, maxDuration: 180 })
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
              {filteredServices.length}
            </span>{" "}
            service(s) trouvé(s)
          </p>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Search className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun service trouvé
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {service.name}
                    </h3>
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                      {service.category}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  {service.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={16} />
                    <span>
                      {service.duration || service.durationMinutes} min
                    </span>
                  </div>
                  <div className="text-lg font-bold text-primary-600">
                    {service.price} MAD
                  </div>
                </div>

                <button
                  onClick={() => handleBookService(service)}
                  className="w-full mt-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Réserver
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceFilter;
