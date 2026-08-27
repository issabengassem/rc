import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  User,
  Search,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { appointmentService, salonService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";

const SalonDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [salon, setSalon] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "OWNER") {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [id, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching dashboard for salon ID:", id);
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("User:", user);

      const [salonData, appointmentsData] = await Promise.all([
        salonService.getSalonById(id),
        appointmentService.getAppointmentsBySalon(id),
      ]);

      console.log("Salon data:", salonData);
      console.log("Appointments data:", appointmentsData);

      // Verify ownership - handle both owner.id and ownerId formats
      const salonOwnerId = salonData.owner?.id || salonData.ownerId;

      if (!salonOwnerId) {
        console.error("Owner ID not found in salon data:", salonData);
        setError(
          "Erreur: Données du propriétaire manquantes. Structure de données invalide.",
        );
        return;
      }

      console.log(
        "Comparing owner ID:",
        salonOwnerId,
        "with user ID:",
        user.id,
      );

      if (salonOwnerId !== user.id) {
        toast.error("Vous n'êtes pas autorisé à accéder à ce salon");
        navigate("/mes-salons");
        return;
      }

      setSalon(salonData);
      setAppointments(appointmentsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);

      // Provide detailed error message
      let errorMessage = "Erreur lors du chargement des données";

      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        errorMessage =
          "❌ Impossible de contacter le serveur. Veuillez réessayer plus tard.";
      } else if (err.message.includes("404")) {
        errorMessage = `❌ Salon #${id} introuvable. Le salon a peut-être été supprimé.`;
      } else if (err.message.includes("401") || err.message.includes("403")) {
        errorMessage =
          "❌ Accès non autorisé. Vous n'avez pas les permissions nécessaires.";
      } else {
        errorMessage = `❌ ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (appointmentId) => {
    try {
      await appointmentService.updateAppointmentStatus(
        appointmentId,
        "CONFIRMED",
      );
      await fetchDashboardData();
    } catch (err) {
      toast.error("Erreur lors de la confirmation");
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) {
      try {
        await appointmentService.cancelAppointment(appointmentId);
        await fetchDashboardData();
      } catch (err) {
        toast.error("Erreur lors de l'annulation");
      }
    }
  };

  const handleComplete = async (appointmentId) => {
    try {
      await appointmentService.updateAppointmentStatus(
        appointmentId,
        "COMPLETED",
      );
      await fetchDashboardData();
    } catch (err) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

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

  const filteredAppointments = appointments.filter((apt) => {
    const matchesFilter = filter === "ALL" || apt.status === filter;
    const matchesSearch =
      searchTerm === "" ||
      apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "PENDING").length,
    confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
    cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
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
          <AlertCircle className="text-red-600 mb-3" size={32} />
          <h2 className="text-lg font-semibold text-red-900 mb-2">Erreur</h2>
          <p className="text-red-700 mb-4 whitespace-pre-line">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={fetchDashboardData}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Réessayer
            </button>
            <button
              onClick={() => navigate("/mes-salons")}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/mes-salons")}
            className="text-primary-600 hover:text-primary-800 font-medium mb-4 flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Retour à mes salons
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord - {salon?.name}
          </h1>
          <p className="text-gray-600">
            Gérez vos rendez-vous et votre emploi du temps
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm font-medium">Total</span>
              <Calendar className="text-primary-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Rendez-vous</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm font-medium">
                En attente
              </span>
              <Clock className="text-yellow-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pending}
            </p>
            <p className="text-xs text-gray-500 mt-1">À confirmer</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm font-medium">
                Confirmés
              </span>
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {stats.confirmed}
            </p>
            <p className="text-xs text-gray-500 mt-1">Confirmés</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm font-medium">Annulés</span>
              <XCircle className="text-red-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
            <p className="text-xs text-gray-500 mt-1">Annulés</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "ALL"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilter("PENDING")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "PENDING"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                En attente
              </button>
              <button
                onClick={() => setFilter("CONFIRMED")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "CONFIRMED"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Confirmés
              </button>
              <button
                onClick={() => setFilter("CANCELLED")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "CANCELLED"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Annulés
              </button>
            </div>

            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="mx-auto mb-4 text-gray-300" size={64} />
              <p className="text-gray-500 text-lg">Aucun rendez-vous trouvé</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm
                  ? "Essayez une autre recherche"
                  : "Les rendez-vous apparaîtront ici"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date & Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-primary-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {apt.clientName}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {apt.clientId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {apt.serviceName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {apt.servicePrice} MAD
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(apt.appointmentDateTime).toLocaleDateString(
                            "fr-FR",
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Clock size={12} />
                          {new Date(apt.appointmentDateTime).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(apt.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {apt.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleConfirm(apt.id)}
                                className="text-green-600 hover:text-green-800 font-medium"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => handleCancel(apt.id)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Annuler
                              </button>
                            </>
                          )}
                          {apt.status === "CONFIRMED" && (
                            <>
                              <button
                                onClick={() => handleComplete(apt.id)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Terminer
                              </button>
                              <button
                                onClick={() => handleCancel(apt.id)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Annuler
                              </button>
                            </>
                          )}
                          {(apt.status === "COMPLETED" ||
                            apt.status === "CANCELLED") && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalonDashboard;
