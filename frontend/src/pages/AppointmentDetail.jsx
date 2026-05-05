import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Scissors,
} from "lucide-react";
import { appointmentService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/ConfirmModal";

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
      navigate("/login");
      return;
    }
    fetchAppointment();
  }, [id, navigate]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointmentById(id);

      const user = JSON.parse(localStorage.getItem("user"));
      // Verify user owns this appointment (using clientId from DTO)
      if (data.clientId !== user.id) {
        // For now, allow viewing - you can add salon owner check later if needed
        console.log(
          "User viewing appointment:",
          user.id,
          "Appointment client:",
          data.clientId,
        );
      }

      setAppointment(data);
    } catch (err) {
      console.error("Error fetching appointment:", err);
      setError("Erreur lors du chargement du rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: <Clock size={20} />,
        text: "En attente",
      },
      CONFIRMED: {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: <CheckCircle size={20} />,
        text: "Confirmé",
      },
      CANCELLED: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: <XCircle size={20} />,
        text: "Annulé",
      },
    };

    const badge = badges[status] || badges.PENDING;

    return (
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${badge.color}`}
      >
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const handleCancelClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await appointmentService.cancelAppointment(id);
      toast.success("Rendez-vous annulé avec succès");
      // Close the modal
      setShowConfirmModal(false);
      // Navigate back to appointments list
      navigate("/mes-rendez-vous");
    } catch (err) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <AlertCircle size={64} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          {error || "Rendez-vous introuvable"}
        </h2>
        <button
          onClick={() => navigate("/mes-rendez-vous")}
          className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retour à mes rendez-vous
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/mes-rendez-vous")}
            className="text-primary-600 hover:text-primary-800 font-medium mb-4 inline-flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Retour
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Détails du rendez-vous
            </h1>
            {getStatusBadge(appointment.status)}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Salon Info */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-6">
            <h2 className="text-2xl font-bold mb-2">{appointment.salonName}</h2>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin size={18} />
              <span>Salon #{appointment.salonId}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 grid md:grid-cols-2 gap-8">
            {/* Service Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Scissors className="text-primary-600" size={20} />
                Informations du service
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-medium text-gray-900">
                    {appointment.serviceName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prix</p>
                  <p className="font-medium text-gray-900">
                    {appointment.servicePrice} MAD
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date et Heure</p>
                  <p className="font-medium text-gray-900">
                    {new Date(appointment.appointmentDateTime).toLocaleString(
                      "fr-FR",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="text-primary-600" size={20} />
                Informations du client
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium text-gray-900">
                    {appointment.clientName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Client</p>
                  <p className="font-medium text-gray-900">
                    #{appointment.clientId}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {appointment.notes && (
            <div className="px-6 pb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                <p className="text-gray-700">{appointment.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {appointment.status !== "CANCELLED" &&
            appointment.status !== "COMPLETED" && (
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
                <button
                  onClick={handleCancelClick}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <XCircle size={18} />
                  Annuler le rendez-vous
                </button>
              </div>
            )}
        </div>

        {/* Timeline or additional info could go here */}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmCancel}
        title="Annuler le rendez-vous"
        message="Êtes-vous sûr de vouloir annuler ce rendez-vous ?"
        details={
          appointment
            ? {
                Salon: appointment.salonName,
                Service: appointment.serviceName,
                Date: new Date(appointment.appointmentDateTime).toLocaleString(
                  "fr-FR",
                ),
              }
            : null
        }
        confirmText="Annuler le rendez-vous"
        cancelText="Retour"
        type="danger"
      />
    </div>
  );
};

export default AppointmentDetail;
