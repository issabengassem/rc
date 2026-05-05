import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, XCircle, CheckCircle } from "lucide-react";
import { appointmentService, authService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/ConfirmModal";

const MyAppointments = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, CONFIRMED, CANCELLED
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    appointmentId: null,
    details: null,
  });

  const user = authService.getCurrentUser();

  useEffect(() => {
    // Check if user is logged in
    if (!user || !user.id) {
      toast.warning("Vous devez être connecté pour voir vos rendez-vous");
      navigate("/login");
      return;
    }

    fetchAppointments();
  }, []);

  // Fetch appointments - uses /appointments/my which respects roles
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Use the new endpoint that automatically filters by user role
      const data = await appointmentService.getMyAppointments();

      // Sort by date (newest first)
      const sorted = data.sort(
        (a, b) =>
          new Date(b.appointmentDateTime) - new Date(a.appointmentDateTime),
      );

      setAppointments(sorted);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Erreur lors du chargement des rendez-vous");
      setLoading(false);
    }
  };

  // CHANGED: Cancel appointment
  const handleCancelClick = (appointmentId, appointmentDetails) => {
    setConfirmModal({
      isOpen: true,
      appointmentId,
      details: {
        Salon: appointmentDetails.salonName,
        Service: appointmentDetails.serviceName,
        Date: new Date(appointmentDetails.appointmentDateTime).toLocaleString(
          "fr-FR",
        ),
      },
    });
  };

  const handleConfirmCancel = async () => {
    try {
      await appointmentService.cancelAppointment(confirmModal.appointmentId);
      toast.success("Rendez-vous annulé avec succès");

      // Close the modal
      setConfirmModal({ isOpen: false, appointmentId: null, details: null });

      // Refresh appointments list
      fetchAppointments();
    } catch (error) {
      console.error("Error canceling appointment:", error);
      toast.error("Erreur lors de l'annulation du rendez-vous");
    }
  };

  // CHANGED: Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "ALL") return true;
    return apt.status === filter;
  });

  // CHANGED: Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      PENDING: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: <Clock size={14} />,
        text: "En attente",
      },
      CONFIRMED: {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: <CheckCircle size={14} />,
        text: "Confirmé",
      },
      CANCELLED: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: <XCircle size={14} />,
        text: "Annulé",
      },
    };

    const badge = badges[status] || badges.PENDING;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
      >
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  // CHANGED: Check if appointment is in the past
  const isPastAppointment = (dateTime) => {
    return new Date(dateTime) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos rendez-vous...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mes Rendez-vous
          </h1>
          <p className="text-gray-600">
            Gérez tous vos rendez-vous en un seul endroit
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2 sm:gap-3 overflow-x-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`flex-1 min-w-[90px] py-2 px-3 sm:px-4 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              filter === "ALL"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tous ({appointments.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`flex-1 min-w-[110px] py-2 px-3 sm:px-4 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              filter === "PENDING"
                ? "bg-yellow-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            En attente (
            {appointments.filter((a) => a.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilter("CONFIRMED")}
            className={`flex-1 min-w-[110px] py-2 px-3 sm:px-4 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              filter === "CONFIRMED"
                ? "bg-green-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Confirmés (
            {appointments.filter((a) => a.status === "CONFIRMED").length})
          </button>
          <button
            onClick={() => setFilter("CANCELLED")}
            className={`flex-1 min-w-[100px] py-2 px-3 sm:px-4 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              filter === "CANCELLED"
                ? "bg-red-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Annulés (
            {appointments.filter((a) => a.status === "CANCELLED").length})
          </button>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === "ALL"
                ? "Aucun rendez-vous"
                : `Aucun rendez-vous ${filter.toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-6">
              Explorez nos salons et réservez votre premier rendez-vous
            </p>
            <Link
              to="/salons"
              className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Explorer les salons
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const isPast = isPastAppointment(appointment.appointmentDateTime);
              const canCancel = !isPast && appointment.status !== "CANCELLED";

              return (
                <div
                  key={appointment.id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden ${
                    isPast ? "opacity-75" : ""
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {appointment.salonName}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-gray-600 flex items-center gap-2 mb-1">
                          <MapPin size={16} />
                          Salon
                        </p>
                      </div>

                      {/* Appointment ID */}
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Réservation #{appointment.id}
                        </p>
                        {isPast && (
                          <span className="text-xs text-gray-400 italic">
                            Passé
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Date & Time */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="text-primary-600" size={20} />
                        <div>
                          <p className="text-xs text-gray-500">Date & Heure</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(
                              appointment.appointmentDateTime,
                            ).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(
                              appointment.appointmentDateTime,
                            ).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Service */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                          S
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Service</p>
                          <p className="font-semibold text-gray-900">
                            {appointment.serviceName}
                          </p>
                          <p className="text-sm text-primary-600 font-semibold">
                            {appointment.servicePrice} MAD
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Notes:</p>
                        <p className="text-sm text-gray-700">
                          {appointment.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={() =>
                          navigate(`/rendez-vous/${appointment.id}`)
                        }
                        className="flex-1 text-center py-2 px-4 border-2 border-primary-600 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition"
                      >
                        Voir détails
                      </button>

                      {canCancel && (
                        <button
                          onClick={() =>
                            handleCancelClick(appointment.id, appointment)
                          }
                          className="flex-1 py-2 px-4 bg-red-50 border-2 border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-100 transition"
                        >
                          Annuler
                        </button>
                      )}

                      {!canCancel && appointment.status === "CANCELLED" && (
                        <button
                          onClick={() =>
                            navigate(
                              `/rendez-vous/new?salonId=${appointment.salonId}`,
                            )
                          }
                          className="flex-1 text-center py-2 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-medium hover:opacity-90 transition"
                        >
                          Réserver à nouveau
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, appointmentId: null, details: null })
        }
        onConfirm={handleConfirmCancel}
        title="Annuler le rendez-vous"
        message="Êtes-vous sûr de vouloir annuler ce rendez-vous ?"
        details={confirmModal.details}
        confirmText="Annuler le rendez-vous"
        cancelText="Retour"
        type="danger"
      />
    </div>
  );
};

export default MyAppointments;
