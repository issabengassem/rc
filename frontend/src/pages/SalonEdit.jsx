import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building2,
  Upload,
  X,
  Save,
  Plus,
  DollarSign,
  Clock,
  Trash2,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { salonService, serviceService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import MapPicker from "../components/MapPicker";
import { handleSalonImageError } from "../utils/imageUtils";

function SalonEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salon, setSalon] = useState({
    name: "",
    city: "",
    address: "",
    phone: "",
    description: "",
    openingTime: "",
    closingTime: "",
    latitude: null,
    longitude: null,
  });
  const [services, setServices] = useState([]);
  const [deletedServiceIds, setDeletedServiceIds] = useState([]);
  const [newImage, setNewImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [imageMode, setImageMode] = useState("upload"); // 'upload' or 'url'
  const [imageUrl, setImageUrl] = useState("");
  const [urlPreview, setUrlPreview] = useState(null);
  const [urlError, setUrlError] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    // Check authentication and ownership
    if (!user.id || user.role !== "OWNER") {
      toast.error("Accès non autorisé");
      navigate("/");
      return;
    }

    fetchSalonData();
  }, [id]);

  const fetchSalonData = async () => {
    setLoading(true);
    try {
      console.log("Fetching salon with ID:", id);
      console.log("User:", user);

      const data = await salonService.getSalonById(id);
      console.log("Salon data received:", data);

      // Verify ownership - handle both owner.id and ownerId formats
      const salonOwnerId = data.owner?.id || data.ownerId;

      if (!salonOwnerId) {
        console.error("Owner ID not found in salon data:", data);
        toast.error(
          "Erreur: Données du propriétaire manquantes. Structure de données invalide.",
        );
        navigate("/mes-salons");
        return;
      }

      console.log(
        "Comparing owner ID:",
        salonOwnerId,
        "with user ID:",
        user.id,
      );

      if (salonOwnerId !== user.id) {
        toast.error("Vous n'êtes pas le propriétaire de ce salon");
        navigate("/mes-salons");
        return;
      }

      setSalon({
        name: data.name,
        city: data.city,
        address: data.address,
        phone: data.phone,
        description: data.description || "",
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      if (data.imagePath) {
        setCurrentImage(salonService.getImageUrl(data.imagePath));
      }

      // Fetch services for this salon
      try {
        const servicesData = await serviceService.getServicesBySalon(id);
        console.log("Services data received:", servicesData);
        setServices(servicesData.map((s) => ({ ...s, isExisting: true })));
      } catch (error) {
        console.error("Error fetching services:", error);
        // Continue even if services fail to load
        setServices([]);
      }
    } catch (error) {
      console.error("Error fetching salon:", error);

      // Provide detailed error message
      let errorMessage = "Erreur lors du chargement du salon";

      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        errorMessage =
          "❌ Impossible de contacter le serveur. Veuillez vérifier votre connexion et réessayer.";
      } else if (error.message.includes("404")) {
        errorMessage = `❌ Salon #${id} introuvable.\n\nLe salon a peut-être été supprimé.`;
      } else if (
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
        errorMessage =
          "❌ Accès non autorisé.\n\nVous n'avez pas les permissions nécessaires.";
      } else {
        errorMessage = `❌ Erreur: ${error.message}`;
      }

      toast.error(errorMessage);
      navigate("/mes-salons");
    } finally {
      setLoading(false);
    }
  };

  // Service management functions
  const addService = () => {
    setServices([
      ...services,
      {
        id: `new-${Date.now()}`,
        name: "",
        description: "",
        price: "",
        durationMinutes: "",
        isExisting: false,
      },
    ]);
  };

  const removeService = (service) => {
    if (service.isExisting) {
      // Mark existing service for deletion
      setDeletedServiceIds([...deletedServiceIds, service.id]);
    }
    setServices(services.filter((s) => s.id !== service.id));
  };

  const updateServiceField = (serviceId, field, value) => {
    setServices(
      services.map((s) => (s.id === serviceId ? { ...s, [field]: value } : s)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!salon.name || !salon.address || !salon.city || !salon.phone) {
      toast.warning("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);

    try {
      // Update salon details
      const updatedData = {
        name: salon.name,
        address: salon.address,
        city: salon.city,
        phone: salon.phone,
        description: salon.description,
        openingTime: salon.openingTime,
        closingTime: salon.closingTime,
        ownerId: user.id,
        latitude: salon.latitude,
        longitude: salon.longitude,
      };

      await salonService.updateSalon(id, updatedData);

      // Handle image updates
      if (imageMode === "upload" && newImage) {
        // Upload new image file
        await salonService.uploadSalonImage(id, newImage);
      } else if (imageMode === "url" && imageUrl && imageUrl.trim() !== "") {
        // Update with URL
        await salonService.updateSalonImageUrl(id, imageUrl.trim());
      }

      // Handle service changes
      // 1. Delete removed services
      for (const serviceId of deletedServiceIds) {
        try {
          await serviceService.deleteService(serviceId);
          console.log(`Service ${serviceId} deleted`);
        } catch (error) {
          console.error(`Error deleting service ${serviceId}:`, error);
        }
      }

      // 2. Create new services and update existing ones
      for (const service of services) {
        if (!service.name || !service.price || !service.durationMinutes) {
          continue; // Skip incomplete services
        }

        const serviceData = {
          name: service.name,
          description: service.description || "",
          price: parseFloat(service.price),
          durationMinutes: parseInt(service.durationMinutes),
          salonId: parseInt(id),
        };

        try {
          if (service.isExisting) {
            // Update existing service
            await serviceService.updateService(service.id, serviceData);
            console.log(`Service ${service.id} updated`);
          } else {
            // Create new service
            await serviceService.createService(serviceData);
            console.log(`New service created`);
          }
        } catch (error) {
          console.error(`Error saving service:`, error);
        }
      }

      toast.success("Salon modifié avec succès!");
      navigate("/mes-salons");
    } catch (error) {
      console.error("Error updating salon:", error);
      toast.error("Erreur lors de la modification: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSalon((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.warning("Veuillez sélectionner une image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.warning("La taille de l'image ne doit pas dépasser 5MB");
        return;
      }
      setNewImage(file);
    }
  };

  const handleRemoveNewImage = () => {
    setNewImage(null);
    const fileInput = document.getElementById("imageInput");
    if (fileInput) fileInput.value = "";
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setUrlError("");
    setUrlPreview(null);

    // Clear any previous image selections
    setNewImage(null);
    const fileInput = document.getElementById("imageInput");
    if (fileInput) fileInput.value = "";
  };

  const handleUrlBlur = () => {
    if (imageUrl && imageUrl.trim() !== "") {
      const url = imageUrl.trim();

      // Validate URL format
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        setUrlError("L'URL doit commencer par http:// ou https://");
        return;
      }

      // Try to load the image to validate it
      const img = new Image();
      img.onload = () => {
        setUrlPreview(url);
        setUrlError("");
      };
      img.onerror = () => {
        setUrlError("Impossible de charger l'image depuis cette URL");
        setUrlPreview(null);
      };
      img.src = url;
    }
  };

  const handleImageModeChange = (mode) => {
    setImageMode(mode);
    // Clear both selections when switching modes
    if (mode === "upload") {
      setImageUrl("");
      setUrlPreview(null);
      setUrlError("");
    } else {
      setNewImage(null);
      const fileInput = document.getElementById("imageInput");
      if (fileInput) fileInput.value = "";
    }
  };

  const handleDeleteImageClick = () => {
    setShowDeleteImageModal(true);
  };

  const handleConfirmDeleteImage = async () => {
    setShowDeleteImageModal(false);
    try {
      await salonService.deleteSalonImage(id);
      setCurrentImage(null);
      toast.success("Image supprimée avec succès");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Erreur lors de la suppression de l'image");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/mes-salons")}
            className="text-primary-600 hover:text-primary-800 font-medium mb-4"
          >
            ← Retour à mes salons
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
              <Building2 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Modifier le salon
              </h1>
              <p className="text-gray-600">
                Mettez à jour les informations et gérez les images
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Informations générales
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du salon *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  type="text"
                  name="name"
                  value={salon.name}
                  onChange={handleInputChange}
                  placeholder="Nom du salon"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  type="text"
                  name="city"
                  value={salon.city}
                  onChange={handleInputChange}
                  placeholder="Ville"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  type="text"
                  name="address"
                  value={salon.address}
                  onChange={handleInputChange}
                  placeholder="Adresse complète"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  type="tel"
                  name="phone"
                  value={salon.phone}
                  onChange={handleInputChange}
                  placeholder="+212 6 12 34 56 78"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure d'ouverture *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  type="time"
                  name="openingTime"
                  value={salon.openingTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de fermeture *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  type="time"
                  name="closingTime"
                  value={salon.closingTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows="4"
                name="description"
                value={salon.description}
                onChange={handleInputChange}
                placeholder="Décrivez votre salon..."
              />
            </div>
          </div>

          {/* Location Map */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Emplacement du salon
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez l'emplacement exact de votre salon sur la carte
            </p>
            <MapPicker
              latitude={salon.latitude}
              longitude={salon.longitude}
              city={salon.city}
              onLocationChange={(lat, lng) => {
                setSalon({
                  ...salon,
                  latitude: lat,
                  longitude: lng,
                });
              }}
            />
          </div>

          {/* Services Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Services
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Gérez les services proposés dans votre salon
                </p>
              </div>
              <button
                type="button"
                onClick={addService}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                Ajouter un service
              </button>
            </div>

            {services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>
                  Aucun service. Cliquez sur "Ajouter un service" pour
                  commencer.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors relative"
                  >
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeService(service)}
                      className="absolute top-3 right-3 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                      title="Supprimer ce service"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {/* Service Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom du service *
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) =>
                            updateServiceField(
                              service.id,
                              "name",
                              e.target.value,
                            )
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Ex: Coupe femme"
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix (MAD) *
                        </label>
                        <div className="relative">
                          <DollarSign
                            className="absolute left-3 top-2.5 text-gray-400"
                            size={18}
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.price}
                            onChange={(e) =>
                              updateServiceField(
                                service.id,
                                "price",
                                e.target.value,
                              )
                            }
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="150"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Durée (minutes) *
                        </label>
                        <div className="relative">
                          <Clock
                            className="absolute left-3 top-2.5 text-gray-400"
                            size={18}
                          />
                          <input
                            type="number"
                            min="1"
                            value={service.durationMinutes}
                            onChange={(e) =>
                              updateServiceField(
                                service.id,
                                "durationMinutes",
                                e.target.value,
                              )
                            }
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="30"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (optionnel)
                        </label>
                        <input
                          type="text"
                          value={service.description}
                          onChange={(e) =>
                            updateServiceField(
                              service.id,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Détails du service..."
                        />
                      </div>
                    </div>

                    {service.isExisting && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded">
                          Service existant
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Gestion de l'image
            </h2>

            {/* Mode Toggle */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleImageModeChange("upload")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  imageMode === "upload"
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Upload size={20} />
                Télécharger une image
              </button>
              <button
                type="button"
                onClick={() => handleImageModeChange("url")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  imageMode === "url"
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <LinkIcon size={20} />
                Coller une URL
              </button>
            </div>

            {/* Current Image */}
            {currentImage && !newImage && !urlPreview && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Image actuelle
                </p>
                <div className="relative inline-block">
                  <img
                    src={currentImage}
                    alt="Current salon"
                    className="w-64 h-48 object-cover rounded-lg border border-gray-200"
                    referrerPolicy="no-referrer"
                    onError={handleSalonImageError}
                  />
                  <button
                    type="button"
                    onClick={handleDeleteImageClick}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Upload Mode */}
            {imageMode === "upload" && (
              <>
                {/* New Image Preview */}
                {newImage && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Nouvelle image
                    </p>
                    <div className="relative inline-block">
                      <img
                        src={URL.createObjectURL(newImage)}
                        alt="New salon"
                        className="w-64 h-48 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveNewImage}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div>
                  <input
                    type="file"
                    id="imageInput"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="imageInput"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-100 cursor-pointer transition-colors"
                  >
                    <ImageIcon size={20} />
                    {newImage || currentImage
                      ? "Changer l'image"
                      : "Sélectionner une image"}
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, WEBP jusqu'à 5MB
                  </p>
                </div>
              </>
            )}

            {/* URL Mode */}
            {imageMode === "url" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de l'image
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={handleUrlChange}
                    onBlur={handleUrlBlur}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      urlError ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {urlError && (
                    <p className="text-sm text-red-600 mt-1">{urlError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Collez l'URL d'une image hébergée en ligne
                  </p>
                </div>

                {/* URL Preview */}
                {urlPreview && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Aperçu de l'image
                    </p>
                    <div className="relative inline-block">
                      <img
                        src={urlPreview}
                        alt="URL preview"
                        className="w-64 h-48 object-cover rounded-lg border border-gray-200"
                        onError={() => {
                          setUrlError("Impossible de charger l'image");
                          setUrlPreview(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl("");
                          setUrlPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate("/mes-salons")}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Image Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteImageModal}
        onClose={() => setShowDeleteImageModal(false)}
        onConfirm={handleConfirmDeleteImage}
        title="Supprimer l'image"
        message="Êtes-vous sûr de vouloir supprimer l'image actuelle du salon?"
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}

export default SalonEdit;
