import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Edit,
  Eye,
  Plus,
  Calendar,
  Trash2,
  Star,
} from "lucide-react";
import { salonService, reviewService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import { handleSalonImageError } from "../utils/imageUtils";

function MySalons() {
  const navigate = useNavigate();
  const toast = useToast();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    salonId: null,
    salonName: null,
  });
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    // Check if user is logged in and is an owner
    if (!user.id) {
      toast.error("Vous devez être connecté pour voir vos salons");
      navigate("/login");
      return;
    }

    if (user.role !== "OWNER") {
      toast.error("Accès réservé aux propriétaires de salons");
      navigate("/");
      return;
    }

    fetchOwnerSalons();

    // Refetch when page becomes visible (e.g., returning from salon dashboard)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchOwnerSalons();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // Refetch whenever component mounts

  const fetchOwnerSalons = async () => {
    setLoading(true);
    try {
      const data = await salonService.getSalonsByOwner(user.id);

      console.log("Fetched salons:", data);

      // Add image URLs and fetch review stats
      const salonsWithImagesAndRatings = await Promise.all(
        data.map(async (salon) => {
          const imageUrl = salonService.getImageUrl(salon.imagePath);

          // Fetch review statistics
          let averageRating = 0;
          let totalReviews = 0;
          try {
            const stats = await reviewService.getSalonRatingStats(salon.id);
            averageRating = stats.averageRating || 0;
            totalReviews = stats.totalReviews || 0;
          } catch (error) {
            console.error(
              `Error fetching review stats for salon ${salon.id}:`,
              error,
            );
          }

          return {
            ...salon,
            displayImage: imageUrl,
            averageRating,
            totalReviews,
          };
        }),
      );

      setSalons(salonsWithImagesAndRatings);
    } catch (error) {
      console.error("Error fetching salons:", error);
      toast.error("Erreur lors du chargement des salons");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (salonId, salonName) => {
    setConfirmModal({ isOpen: true, salonId, salonName });
  };

  const handleConfirmDelete = async () => {
    const { salonId } = confirmModal;
    setDeleting(salonId);
    try {
      await salonService.deleteSalon(salonId);
      toast.success("Salon supprimé avec succès");
      // Close confirmation modal and refresh the list
      setConfirmModal({ isOpen: false, salonId: null, salonName: null });
      fetchOwnerSalons(); // Refresh the list
    } catch (error) {
      console.error("Error deleting salon:", error);
      toast.error("Erreur lors de la suppression du salon");
    } finally {
      setDeleting(null);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const decimal = rating % 1;

    // Star logic: Full star, Half star (0.25-0.75), Round up (>=0.75)
    let displayStars = fullStars;
    let hasHalfStar = false;

    if (decimal >= 0.75) {
      displayStars = fullStars + 1;
    } else if (decimal >= 0.25) {
      hasHalfStar = true;
    }

    for (let i = 1; i <= 5; i++) {
      if (i <= displayStars) {
        stars.push(
          <Star
            key={i}
            size={16}
            className="fill-yellow-400 text-yellow-400"
          />,
        );
      } else if (i === displayStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star size={16} className="fill-gray-200 text-gray-200" />
            <Star
              size={16}
              className="fill-yellow-400 text-yellow-400 absolute top-0 left-0"
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </div>,
        );
      } else {
        stars.push(
          <Star key={i} size={16} className="fill-gray-200 text-gray-200" />,
        );
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mes salons
            </h1>
            <p className="text-gray-600">
              Gérez vos salons et leurs rendez-vous
            </p>
          </div>
          <Link
            to="/proposer-salon"
            className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus size={20} />
            Ajouter un salon
          </Link>
        </div>

        {/* Salons Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Building2 className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun salon trouvé
            </h3>
            <p className="text-gray-500 mb-6">
              Commencez par ajouter votre premier salon
            </p>
            <Link
              to="/proposer-salon"
              className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Ajouter un salon
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {salons.map((salon) => (
              <div
                key={salon.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={salon.displayImage}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={handleSalonImageError}
                  />
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    {salon.name}
                  </h2>
                  <div className="flex items-center text-gray-600 text-sm mb-3">
                    <MapPin size={16} className="mr-1" />
                    <span className="truncate">
                      {salon.city}, {salon.address}
                    </span>
                  </div>

                  {/* Rating Display */}
                  {salon.averageRating !== undefined &&
                  salon.averageRating > 0 ? (
                    <div
                      className="flex items-center mb-4"
                      title={`Note moyenne basée sur ${salon.totalReviews || 0} avis`}
                    >
                      <div className="flex gap-0.5 mr-2">
                        {renderStars(salon.averageRating)}
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        {salon.averageRating.toFixed(1)}
                      </span>
                      {salon.totalReviews !== undefined && (
                        <span className="text-sm text-gray-500 ml-1.5">
                          ({salon.totalReviews} avis)
                        </span>
                      )}
                    </div>
                  ) : salon.averageRating !== undefined ? (
                    <div className="flex items-center text-gray-400 text-sm mb-4">
                      <div className="flex gap-0.5 mr-2">{renderStars(0)}</div>
                      <span className="text-gray-500">Aucun avis</span>
                    </div>
                  ) : (
                    <div className="flex items-center mb-4 animate-pulse">
                      <div className="flex gap-0.5 mr-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="w-[16px] h-[16px] bg-gray-200 rounded"
                          ></div>
                        ))}
                      </div>
                      <div className="h-4 w-8 bg-gray-200 rounded"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded ml-1.5"></div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      to={`/salon-dashboard/${salon.id}`}
                      className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Eye size={18} />
                      Dashboard
                    </Link>
                    <Link
                      to={`/salon-edit/${salon.id}`}
                      className="px-4 py-2.5 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center"
                      title="Modifier"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(salon.id, salon.name)}
                      disabled={deleting === salon.id}
                      className="px-4 py-2.5 border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Supprimer"
                    >
                      {deleting === salon.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, salonId: null, salonName: null })
        }
        onConfirm={handleConfirmDelete}
        title="Supprimer le salon"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmModal.salonName}" ?`}
        details={{
          Attention: "Cette action est irréversible",
          Impact: "Tous les services et rendez-vous associés seront supprimés",
        }}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}

export default MySalons;
