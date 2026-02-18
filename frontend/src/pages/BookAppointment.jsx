import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Users,
} from "lucide-react";
import {
  salonService,
  serviceService,
  appointmentService,
  userService,
  authService,
} from "../services/apiService";
import { useToast } from "../contexts/ToastContext";
import TimeSlotGrid from "../components/TimeSlotGrid";

const BookAppointment = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const salonId = searchParams.get("salonId");

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  const [formData, setFormData] = useState({
    serviceId: "",
    appointmentDate: "",
    appointmentTime: "",
    notes: "",
  });

  const user = authService.getCurrentUser();
  const isOwner = user?.role === "OWNER";
  const isClient = user?.role === "CLIENT";

  useEffect(() => {
    // Check if user is logged in
    if (!user || !user.id) {
      toast.warning("Veuillez vous connecter pour réserver");
      navigate("/login");
      return;
    }

    if (!salonId) {
      toast.error("Salon non spécifié");
      navigate("/salons");
      return;
    }

    fetchSalonAndServices();
  }, [salonId]);

  const fetchSalonAndServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salonData, servicesData] = await Promise.all([
        salonService.getSalonById(salonId),
        serviceService.getServicesBySalon(salonId),
      ]);

      setSalon(salonData);
      setServices(servicesData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // When date changes, fetch reservations for that date and service
    if (name === "appointmentDate" && value && formData.serviceId) {
      fetchReservationsForDate(value, formData.serviceId);
      setSelectedTimeSlot(null); // Reset selected slot
    }

    // When service changes, fetch reservations if date is selected
    if (name === "serviceId" && value && formData.appointmentDate) {
      fetchReservationsForDate(formData.appointmentDate, value);
      setSelectedTimeSlot(null); // Reset selected slot
    }
  };

  // Fetch reservations for a specific date AND service
  const fetchReservationsForDate = async (date, serviceId) => {
    if (!date || !serviceId) return;

    setLoadingSlots(true);
    try {
      // Use the new service-specific endpoint
      // This returns ONLY reservations for the selected service on the selected date
      const serviceReservations =
        await appointmentService.getAppointmentsByService(serviceId, date);

      // Filter out cancelled/rejected appointments
      const activeReservations = serviceReservations.filter(
        (apt) => apt.status !== "CANCELLED" && apt.status !== "REJECTED",
      );

      // Transform to include service duration
      const reservationsWithDuration = activeReservations.map((apt) => ({
        ...apt,
        serviceDuration: apt.service?.durationMinutes || 60,
      }));

      setReservations(reservationsWithDuration);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      toast.error("Erreur lors du chargement des créneaux");
      setReservations([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle time slot selection from grid
  const handleSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    setFormData((prev) => ({
      ...prev,
      appointmentTime: slot.time,
    }));
  };

  // Check if the selected date/time slot is already booked for this service
  const checkAvailability = async (dateTime, serviceId) => {
    try {
      // Extract date from datetime
      const date = dateTime.split("T")[0];

      // Fetch appointments for this specific service on this date
      const appointments = await appointmentService.getAppointmentsByService(
        serviceId,
        date,
      );

      // Check if any appointment has the same date/time for this service
      const isBooked = appointments.some((apt) => {
        const aptDateTime = apt.appointmentDateTime.substring(0, 16); // "2026-02-20T14:30"
        const selectedDateTime = dateTime.substring(0, 16);

        return (
          aptDateTime === selectedDateTime &&
          apt.status !== "CANCELLED" &&
          apt.status !== "REJECTED"
        );
      });

      return !isBooked; // Return true if available, false if booked
    } catch (err) {
      console.error("Error checking availability:", err);
      // If check fails, allow booking (fail open) but log the error
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.serviceId ||
      !formData.appointmentDate ||
      !formData.appointmentTime
    ) {
      toast.warning("Veuillez remplir tous les champs");
      return;
    }

    setChecking(true);
    setSubmitting(true);
    try {
      // Combine date and time into ISO format: "2026-02-20T14:30"
      const appointmentDateTime = `${formData.appointmentDate}T${formData.appointmentTime}`;

      // Check if the slot is available for this specific service
      const isAvailable = await checkAvailability(
        appointmentDateTime,
        formData.serviceId,
      );
      setChecking(false);

      if (!isAvailable) {
        toast.warning(
          "Cette date et heure sont déjà réservées pour ce service. Veuillez choisir un autre créneau horaire.",
        );
        setSubmitting(false);
        return; // Stop submission
      }

      // Both CLIENT and OWNER book for themselves
      const appointmentData = {
        salonId: parseInt(salonId),
        serviceId: parseInt(formData.serviceId),
        appointmentDateTime: appointmentDateTime,
        notes: formData.notes || "",
        // clientId auto-assigned by backend from JWT
      };

      console.log("Booking appointment:", appointmentData);
      const newAppointment =
        await appointmentService.createAppointment(appointmentData);

      toast.success("Rendez-vous réservé avec succès!");

      // Redirect to appointments page
      navigate("/mes-rendez-vous");
    } catch (err) {
      console.error("Error creating appointment:", err);
      toast.error(
        "Erreur lors de la réservation: " + (err.message || "Erreur inconnue"),
      );
    } finally {
      setSubmitting(false);
      setChecking(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="text-red-600 mb-2" size={32} />
          <h2 className="text-lg font-semibold text-red-900 mb-2">Erreur</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => navigate("/salons")}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retour aux salons
          </button>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Salon introuvable</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <button
          onClick={() => navigate("/salons")}
          className="text-primary-600 hover:text-primary-800 font-medium mb-6 flex items-center gap-2"
        >
          <ChevronLeft size={20} />
          Retour aux salons
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Salon Info Header */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">{salon.name}</h1>
            <p className="text-primary-100">
              {salon.address}, {salon.city}
            </p>
            {salon.phone && (
              <p className="text-primary-100 mt-1">📞 {salon.phone}</p>
            )}
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Choisir un service *
              </label>
              {services.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Aucun service disponible pour ce salon
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.serviceId === service.id.toString()
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="serviceId"
                          value={service.id}
                          checked={formData.serviceId === service.id.toString()}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-primary-600"
                        />
                        <div className="ml-3">
                          <p className="font-semibold text-gray-900">
                            {service.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {service.durationMinutes || service.duration} min
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-primary-600">
                        {service.price} MAD
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Date du rendez-vous *
              </label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleInputChange}
                min={getMinDate()}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Time Slot Grid - Shows when date and service are selected */}
            {formData.appointmentDate && formData.serviceId && (
              <div>
                <TimeSlotGrid
                  selectedDate={formData.appointmentDate}
                  salonOpenTime={salon.openingTime || "09:00"}
                  salonCloseTime={salon.closingTime || "18:00"}
                  reservations={reservations}
                  onSlotSelect={handleSlotSelect}
                  selectedSlot={selectedTimeSlot}
                  slotInterval={15}
                  loading={loadingSlots}
                  selectedService={
                    services.find(
                      (s) => s.id === parseInt(formData.serviceId),
                    ) || null
                  }
                />
              </div>
            )}

            {/* Prompt to select service if date is selected but no service */}
            {formData.appointmentDate && !formData.serviceId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm flex items-center">
                  <Clock size={16} className="mr-2" />
                  Veuillez d'abord sélectionner un service pour voir les
                  créneaux horaires disponibles
                </p>
              </div>
            )}

            {/* Client Info Display */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                Vos informations
              </h3>
              <p className="text-sm text-gray-600">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              {user.phone && (
                <p className="text-sm text-gray-600">{user.phone}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || services.length === 0}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checking ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Vérification de la disponibilité...
                </>
              ) : submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Réservation en cours...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Confirmer la réservation
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ Informations importantes
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Votre rendez-vous sera en attente de confirmation par le salon
            </li>
            <li>• Vous recevrez une notification une fois confirmé</li>
            <li>• Vous pouvez annuler jusqu'à 24h avant le rendez-vous</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
