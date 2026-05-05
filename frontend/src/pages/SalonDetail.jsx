import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Phone,
  ChevronLeft,
  Calendar,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { salonService, serviceService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";
import ReviewsList from "../components/ReviewsList";
import { handleSalonImageError } from "../utils/imageUtils";

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SalonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalonDetails();
  }, [id]);

  const fetchSalonDetails = async () => {
    try {
      setLoading(true);
      const data = await salonService.getSalonById(id);
      let servicesData = [];

      try {
        servicesData = await serviceService.getServicesBySalon(id);
      } catch (serviceError) {
        console.warn("Could not load salon services:", serviceError);
      }

      // Add image URL
      const salonWithImage = {
        ...data,
        services: servicesData,
        displayImage: salonService.getImageUrl(data.imagePath),
      };

      setSalon(salonWithImage);
    } catch (error) {
      console.error("Error fetching salon:", error);
      showToast(error.message || "Erreur lors du chargement du salon", "error");
      navigate("/salons");
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user.id) {
      showToast("Veuillez vous connecter pour réserver", "warning");
      navigate(
        `/login?redirect=${encodeURIComponent(`/rendez-vous/new?salonId=${id}`)}`,
      );
      return;
    }

    navigate(`/rendez-vous/new?salonId=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du salon...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Salon non trouvé</p>
          <button
            onClick={() => navigate("/salons")}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Retour aux salons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/salons")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Retour aux salons</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Salon Header Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Salon Image */}
            <div className="relative h-96">
              <img
                src={salon.displayImage}
                alt={salon.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={handleSalonImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h1 className="text-4xl font-bold mb-2">{salon.name}</h1>
                <div className="flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>
                      {salon.address}, {salon.city}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Salon Information */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Details */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Informations
                    </h2>

                    {/* Phone */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="text-gray-800 font-medium">
                          {salon.phone}
                        </p>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Horaires d'ouverture
                        </p>
                        <p className="text-gray-800 font-medium">
                          {salon.openingTime} - {salon.closingTime}
                        </p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Adresse</p>
                        <p className="text-gray-800 font-medium">
                          {salon.address}
                        </p>
                        <p className="text-gray-600">{salon.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {salon.description && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        À propos
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {salon.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column - Services */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Services disponibles
                  </h2>

                  {salon.services && salon.services.length > 0 ? (
                    <div className="space-y-3">
                      {salon.services.map((service) => (
                        <div
                          key={service.id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {service.name}
                              </h4>
                              {service.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {service.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-blue-600">
                                {service.price} MAD
                              </p>
                              <p className="text-sm text-gray-500">
                                {service.durationMinutes || service.duration} min
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      Aucun service disponible pour le moment
                    </p>
                  )}

                  {/* Book Appointment Button */}
                  <button
                    onClick={handleBookAppointment}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Calendar className="w-5 h-5" />
                    Réserver un rendez-vous
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section - Show salon location OR message if not provided */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Localisation
              </h2>
            </div>

            {salon.latitude && salon.longitude ? (
              <div className="h-96">
                <MapContainer
                  center={[salon.latitude, salon.longitude]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                  dragging={true}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[salon.latitude, salon.longitude]}>
                    <Popup>
                      <div className="text-center">
                        <h3 className="font-bold text-gray-800">
                          {salon.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {salon.address}
                        </p>
                        <p className="text-sm text-gray-600">{salon.city}</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg mb-2">
                  Localisation non fournie par le propriétaire du salon
                </p>
                <p className="text-gray-500 text-sm">
                  L'adresse complète est disponible ci-dessus
                </p>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <ReviewsList salonId={id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonDetail;
