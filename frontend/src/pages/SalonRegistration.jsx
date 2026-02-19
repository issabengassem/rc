import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  MapPin,
  Mail,
  Phone,
  Scissors,
  CheckCircle,
  Upload,
  Plus,
  X,
  DollarSign,
  Clock,
} from "lucide-react";
import { salonService, serviceService } from "../services/apiService"; // Import API services
import { useToast } from "../contexts/ToastContext";
import MapPicker from "../components/MapPicker";

const SalonRegistration = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    salonName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    description: "",
    openingHours: "09:00 - 20:00",
    latitude: null,
    longitude: null,
  });

  // Services are now managed separately as an array of objects
  const [services, setServices] = useState([
    {
      id: Date.now(),
      name: "",
      description: "",
      price: "",
      durationMinutes: "",
    },
  ]);

  // Add new service
  const addService = () => {
    setServices([
      ...services,
      {
        id: Date.now(),
        name: "",
        description: "",
        price: "",
        durationMinutes: "",
      },
    ]);
  };

  // Remove service
  const removeService = (id) => {
    if (services.length === 1) {
      toast.warning("Vous devez avoir au moins un service");
      return;
    }
    setServices(services.filter((service) => service.id !== id));
  };

  // Update service field
  const updateService = (id, field, value) => {
    setServices(
      services.map((service) =>
        service.id === id ? { ...service, [field]: value } : service,
      ),
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    // CHANGED: Validate file before setting
    if (file) {
      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.warning(
          "Veuillez sélectionner un fichier image (JPG, PNG, GIF, WebP)",
        );
        e.target.value = "";
        return;
      }

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.warning("La taille du fichier ne doit pas dépasser 5MB");
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
    }
  };

  // CHANGED: Better form validation including services
  const validateForm = () => {
    if (!formData.salonName.trim()) {
      toast.warning("Le nom du salon est requis");
      return false;
    }
    if (!formData.address.trim()) {
      toast.warning("L'adresse est requise");
      return false;
    }
    if (!formData.city.trim()) {
      toast.warning("La ville est requise");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.warning("Le téléphone est requis");
      return false;
    }
    if (!formData.openingHours.includes("-")) {
      toast.warning(
        "Format d'horaires invalide. Utilisez: HH:mm - HH:mm (ex: 09:00 - 20:00)",
      );
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      toast.warning(
        "Veuillez sélectionner l'emplacement du salon sur la carte",
      );
      return false;
    }

    // Validate services
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      if (!service.name.trim()) {
        toast.warning(`Service ${i + 1}: Le nom est requis`);
        return false;
      }
      if (!service.price || service.price <= 0) {
        toast.warning(`Service ${i + 1}: Le prix doit être supérieur à 0`);
        return false;
      }
      if (!service.durationMinutes || service.durationMinutes <= 0) {
        toast.warning(`Service ${i + 1}: La durée doit être supérieure à 0`);
        return false;
      }
    }
    return true;
  };

  // CHANGED: Using API service with better error handling
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // CHANGED: Parse opening hours
      const hours = formData.openingHours.split("-");
      const openingTime = hours[0] ? hours[0].trim() : "09:00";
      const closingTime = hours[1] ? hours[1].trim() : "20:00";

      // Validate time format (HH:mm)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(openingTime) || !timeRegex.test(closingTime)) {
        toast.error("Format d'heure invalide. Utilisez HH:mm (ex: 09:00)");
        setLoading(false);
        return;
      }

      // Get logged-in user
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) {
        toast.error("Vous devez être connecté pour créer un salon");
        navigate("/login");
        return;
      }

      // CHANGED: Prepare salon data
      const salonData = {
        name: formData.salonName,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
        description: formData.description || "",
        openingTime: openingTime,
        closingTime: closingTime,
        ownerId: user.id, // Get from authenticated user
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      // CHANGED: Call API service to create salon
      const result = await salonService.createSalon(salonData, selectedFile);

      console.log("Salon créé avec succès:", result);

      // Create services for the salon
      const servicePromises = services.map((service) =>
        serviceService.createService({
          name: service.name,
          description: service.description || "",
          price: parseFloat(service.price),
          durationMinutes: parseInt(service.durationMinutes),
          salonId: result.id, // Use the created salon's ID
        }),
      );

      const createdServices = await Promise.all(servicePromises);
      console.log("Services créés avec succès:", createdServices);

      toast.success(
        `Salon "${result.name}" créé avec succès! ${createdServices.length} service(s) ajouté(s)${selectedFile ? ", Image uploadée" : ""}`,
      );

      // Navigate to My Salons page to see the new salon
      navigate("/mes-salons");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur: ${error.message}. Vérifiez que le backend est démarré (port 8080), un propriétaire avec ID=1 existe, et tous les champs sont valides`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row relative z-10">
        {/* Left side branding */}
        <div
          className="hidden md:block w-1/2 bg-cover bg-center relative"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1521590832169-7dad6c8cc8c8?auto=format&fit=crop&q=80&w=1000")',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 to-rose-900/80 backdrop-blur-sm"></div>
          <div className="relative z-10 p-12 h-full flex flex-col justify-center text-white">
            <h2 className="text-4xl font-bold mb-6">
              Boostez votre visibilité
            </h2>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed">
              Rejoignez plus de 500 professionnels de la beauté. Gérez vos
              rendez-vous, attirez de nouveaux clients et développez votre
              activité simplement.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center">
                <CheckCircle className="mr-3 text-rose-400" /> Agenda en ligne
                24/7
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-3 text-rose-400" /> Rappels SMS
                automatiques
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-3 text-rose-400" /> Page vitrine
                personnalisée
              </li>
            </ul>
          </div>
        </div>

        {/* Right side form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Inscrivez votre établissement
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Commencez dès aujourd'hui, c'est gratuit pendant 30 jours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Salon Name */}
            <div className="relative">
              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">
                Nom du Salon <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Scissors
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  name="salonName"
                  value={formData.salonName}
                  onChange={(e) =>
                    setFormData({ ...formData, salonName: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition"
                  placeholder="Ex: Studio Chic"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="relative">
              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition"
                  placeholder="+212 6 00 00 00 00"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="relative">
              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">
                Adresse complète <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition"
                  placeholder="123 Boulevard Massira"
                  required
                />
              </div>
            </div>

            {/* City */}
            <div className="relative">
              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">
                Ville <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition"
                placeholder="Casablanca"
                required
              />
            </div>

            {/* Opening Hours */}
            <div className="relative">
              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">
                Horaires d'ouverture <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="openingHours"
                value={formData.openingHours}
                onChange={(e) =>
                  setFormData({ ...formData, openingHours: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition"
                placeholder="09:00 - 20:00"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Format: HH:mm - HH:mm
              </p>
            </div>

            {/* Description */}
            <div className="relative">
              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition resize-none"
                placeholder="Décrivez votre salon..."
                rows="3"
              />
            </div>

            {/* Map Location Picker */}
            <div className="border-2 border-primary-200 rounded-xl p-6 bg-gradient-to-br from-primary-50 to-white">
              <label className="text-xs font-semibold text-gray-700 uppercase mb-3 block">
                Emplacement du salon <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez l'emplacement exact de votre salon sur la carte
              </p>
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                city={formData.city}
                onLocationChange={(lat, lng) => {
                  setFormData({
                    ...formData,
                    latitude: lat,
                    longitude: lng,
                  });
                }}
              />
            </div>

            {/* Services Section */}
            <div className="border-2 border-primary-200 rounded-xl p-6 bg-primary-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase block">
                    Services offerts <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Ajoutez les services proposés dans votre salon
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addService}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>

              <div className="space-y-4">
                {services.map((service, index) => (
                  <div
                    key={service.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 relative"
                  >
                    {/* Remove button */}
                    {services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(service.id)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Supprimer ce service"
                      >
                        <X size={18} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {/* Service Name */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                          Nom du service *
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) =>
                            updateService(service.id, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          placeholder="Ex: Coupe femme"
                          required
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                          Prix (MAD) *
                        </label>
                        <div className="relative">
                          <DollarSign
                            className="absolute left-2 top-2.5 text-gray-400"
                            size={16}
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.price}
                            onChange={(e) =>
                              updateService(service.id, "price", e.target.value)
                            }
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="150"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Duration */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                          Durée (minutes) *
                        </label>
                        <div className="relative">
                          <Clock
                            className="absolute left-2 top-2.5 text-gray-400"
                            size={16}
                          />
                          <input
                            type="number"
                            min="1"
                            value={service.durationMinutes}
                            onChange={(e) =>
                              updateService(
                                service.id,
                                "durationMinutes",
                                e.target.value,
                              )
                            }
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="30"
                            required
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                          Description (optionnel)
                        </label>
                        <input
                          type="text"
                          value={service.description}
                          onChange={(e) =>
                            updateService(
                              service.id,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          placeholder="Détails du service..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* File upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer group">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                  <Camera size={24} />
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Ajouter une photo du salon
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, GIF, WebP (Max 5MB)
                </p>
              </label>
              {selectedFile && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">
                    ✓ {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 mt-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:opacity-95 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Création en cours...
                </>
              ) : (
                <>
                  <Upload size={20} className="mr-2" />
                  Créer mon compte partenaire
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalonRegistration;
