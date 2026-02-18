import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, DollarSign, Clock, Save, X } from "lucide-react";
import { serviceService, salonService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";

const ServiceManagement = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationMinutes: "",
  });

  // ENDPOINT USED: getServicesBySalon(), getSalonById()
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      toast.error("Vous devez être connecté");
      navigate("/login");
      return;
    }

    fetchData();
  }, [salonId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ENDPOINT USED: salonService.getSalonById()
      const salonData = await salonService.getSalonById(salonId);
      setSalon(salonData);

      // ENDPOINT USED: serviceService.getServicesBySalon()
      const servicesData = await serviceService.getServicesBySalon(salonId);
      setServices(servicesData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
      setLoading(false);
    }
  };

  // ENDPOINT USED: createService()
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        durationMinutes: parseInt(formData.durationMinutes),
        salonId: parseInt(salonId),
      };

      // ENDPOINT USED: serviceService.createService()
      await serviceService.createService(serviceData);

      toast.success("Service créé avec succès");
      setShowAddForm(false);
      setFormData({
        name: "",
        description: "",
        price: "",
        durationMinutes: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("Erreur lors de la création du service");
    }
  };

  // ENDPOINT USED: updateService()
  const handleUpdate = async (serviceId) => {
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        durationMinutes: parseInt(formData.durationMinutes),
        salonId: parseInt(salonId),
      };

      // ENDPOINT USED: serviceService.updateService()
      await serviceService.updateService(serviceId, serviceData);

      toast.success("Service mis à jour avec succès");
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Erreur lors de la mise à jour du service");
    }
  };

  // ENDPOINT USED: deleteService()
  const handleDelete = async (serviceId, serviceName) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le service "${serviceName}"?\n\n` +
        `Cette action est irréversible.`,
    );

    if (!confirmed) return;

    try {
      // ENDPOINT USED: serviceService.deleteService()
      await serviceService.deleteService(serviceId);

      toast.success("Service supprimé avec succès");
      fetchData();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Erreur lors de la suppression du service");
    }
  };

  const startEdit = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      durationMinutes: service.durationMinutes.toString(),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", price: "", durationMinutes: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/salons")}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
          >
            ← Retour aux salons
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Services - {salon?.name}
          </h1>
          <p className="text-gray-600">
            Créez et gérez les services de votre salon
          </p>
        </div>

        {/* Add Service Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="mb-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
          >
            <Plus size={20} />
            Ajouter un service
          </button>
        )}

        {/* Add Service Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Nouveau Service
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du service <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Coupe Homme"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Décrivez le service..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix (MAD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="150.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMinutes: e.target.value,
                      })
                    }
                    placeholder="45"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Créer le service
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      name: "",
                      description: "",
                      price: "",
                      durationMinutes: "",
                    });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services List */}
        <div className="space-y-4">
          {services.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun service
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par ajouter votre premier service
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                <Plus size={20} />
                Ajouter un service
              </button>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                {editingId === service.id ? (
                  // Edit Mode
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Modifier le service
                    </h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                        rows="3"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="number"
                          value={formData.durationMinutes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              durationMinutes: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleUpdate(service.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                        >
                          <Save size={18} />
                          Enregistrer
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                        >
                          <X size={18} />
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {service.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign size={16} />
                            <span className="font-semibold text-primary-600">
                              {service.price} MAD
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={16} />
                            {service.durationMinutes} min
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(service)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id, service.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceManagement;
