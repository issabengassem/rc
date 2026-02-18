import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, DollarSign, MessageSquare } from "lucide-react";
import {
  salonService,
  serviceService,
  appointmentService,
} from "../services/apiService";
import { useToast } from "../contexts/ToastContext";

const AppointmentBooking = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    serviceId: "",
    appointmentDate: "",
    appointmentTime: "",
    notes: "",
  });

  // CHANGED: Fetch salon and services on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salonData, servicesData] = await Promise.all([
          salonService.getSalonById(salonId),
          serviceService.getServicesBySalon(salonId),
        ]);

        setSalon(salonData);
        setServices(servicesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Erreur lors du chargement des données");
        setLoading(false);
      }
    };

    fetchData();
  }, [salonId]);

  // CHANGED: Handle form submission - NO ROLE CHECK
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user.id) {
      toast.warning("Vous devez être connecté pour réserver un rendez-vous");
      navigate("/login");
      return;
    }

    if (!formData.serviceId) {
      toast.warning("Veuillez sélectionner un service");
      return;
    }

    if (!formData.appointmentDate || !formData.appointmentTime) {
      toast.warning("Veuillez sélectionner une date et une heure");
      return;
    }

    setSubmitting(true);

    try {
      // CHANGED: Combine date and time in ISO format
      const appointmentDateTime = `${formData.appointmentDate}T${formData.appointmentTime}`;

      const appointmentData = {
        appointmentDateTime: appointmentDateTime,
        notes: formData.notes || "",
        clientId: user.id,
        salonId: parseInt(salonId),
        serviceId: parseInt(formData.serviceId),
      };

      const result =
        await appointmentService.createAppointment(appointmentData);

      console.log("Appointment created:", result);

      toast.success(
        `Rendez-vous confirmé! Service: ${result.serviceName}, Date: ${new Date(result.appointmentDateTime).toLocaleString("fr-FR")}, Prix: ${result.servicePrice} MAD`,
      );

      // Redirect to user appointments page
      navigate("/mes-rendez-vous");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(`Erreur lors de la réservation: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Salon non trouvé</p>
          <button
            onClick={() => navigate("/salons")}
            className="mt-4 text-primary-600 hover:underline"
          >
            Retour aux salons
          </button>
        </div>
      </div>
    );
  }

  const selectedService = services.find(
    (s) => s.id === parseInt(formData.serviceId),
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Salon Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-6">
            {salon.imagePath && (
              <img
                src={salonService.getImageUrl(salon.imagePath)}
                alt={salon.name}
                className="w-32 h-32 rounded-xl object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {salon.name}
              </h1>
              <p className="text-gray-600 flex items-center mb-1">
                <span className="mr-2">📍</span> {salon.address}, {salon.city}
              </p>
              <p className="text-gray-600 flex items-center mb-1">
                <span className="mr-2">📞</span> {salon.phone}
              </p>
              <p className="text-gray-600 flex items-center">
                <span className="mr-2">🕐</span> {salon.openingTime} -{" "}
                {salon.closingTime}
              </p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Réserver un rendez-vous
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choisir un service <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.serviceId}
                onChange={(e) =>
                  setFormData({ ...formData, serviceId: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionnez un service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.price} MAD (
                    {service.durationMinutes} min)
                  </option>
                ))}
              </select>

              {selectedService && (
                <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {selectedService.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Clock size={16} className="mr-1" />
                      {selectedService.durationMinutes} minutes
                    </span>
                    <span className="flex items-center">
                      <DollarSign size={16} className="mr-1" />
                      {selectedService.price} MAD
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appointmentDate: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="time"
                  value={formData.appointmentTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appointmentTime: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Horaires d'ouverture: {salon.openingTime} - {salon.closingTime}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <div className="relative">
                <MessageSquare
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Précisions, demandes particulières..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>
            </div>

            {/* Summary */}
            {selectedService &&
              formData.appointmentDate &&
              formData.appointmentTime && (
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg border border-primary-200">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Récapitulatif
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Service:</span>{" "}
                      {selectedService.name}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(formData.appointmentDate).toLocaleDateString(
                        "fr-FR",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Heure:</span>{" "}
                      {formData.appointmentTime}
                    </p>
                    <p>
                      <span className="font-medium">Durée:</span>{" "}
                      {selectedService.durationMinutes} minutes
                    </p>
                    <p className="text-lg font-bold text-primary-600 mt-2">
                      Total: {selectedService.price} MAD
                    </p>
                  </div>
                </div>
              )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/salons")}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold hover:opacity-90 transition shadow-lg ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {submitting ? "Réservation..." : "Confirmer la réservation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
