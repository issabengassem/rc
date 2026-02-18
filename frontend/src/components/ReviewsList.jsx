import React, { useState, useEffect } from "react";
import { reviewService, authService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";

const ReviewsList = ({ salonId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    loadReviews();
    loadStats();
    checkIfUserReviewed();
  }, [salonId]);

  const loadReviews = async () => {
    try {
      console.log(`[ReviewsList] Loading reviews for salon ${salonId}...`);
      const data = await reviewService.getSalonReviews(salonId);
      console.log(`[ReviewsList] Loaded ${data.length} reviews:`, data);
      setReviews(data);
    } catch (error) {
      console.error("[ReviewsList] Error loading reviews:", error);
      console.error("[ReviewsList] Error details:", error.message);
      // Don't fail silently - set empty array so UI can still render
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log(`[ReviewsList] Loading stats for salon ${salonId}...`);
      const data = await reviewService.getSalonRatingStats(salonId);
      console.log(`[ReviewsList] Loaded stats:`, data);
      setStats(data);
    } catch (error) {
      console.error("[ReviewsList] Error loading stats:", error);
      console.error("[ReviewsList] Error details:", error.message);
      // Set default stats if API fails
      setStats({ averageRating: 0, totalReviews: 0 });
    }
  };

  const checkIfUserReviewed = async () => {
    if (!isAuthenticated) {
      setHasReviewed(false);
      return;
    }

    try {
      const data = await reviewService.checkIfReviewed(salonId);
      setHasReviewed(data.hasReviewed);
    } catch (error) {
      setHasReviewed(false);
    }
  };

  const handleReviewSubmitted = async () => {
    console.log("[ReviewsList] Review submitted! Refreshing data...");

    // Wait a bit to ensure backend has processed the review
    await new Promise((resolve) => setTimeout(resolve, 500));

    await loadReviews();
    await loadStats();
    setHasReviewed(true);
    setShowForm(false);

    console.log("[ReviewsList] Data refreshed after review submission");
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) {
      return;
    }

    try {
      await reviewService.deleteReview(reviewId);
      showToast("Avis supprimé avec succès", "success");

      // Wait a bit to ensure backend has processed the deletion
      await new Promise((resolve) => setTimeout(resolve, 500));

      await loadReviews();
      await loadStats();
      setHasReviewed(false);
    } catch (error) {
      showToast(error.message || "Erreur lors de la suppression", "error");
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-6 h-6 ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des avis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Avis des clients
            </h3>
            <div className="flex items-center gap-3">
              {renderStars(stats.averageRating)}
              <span className="text-2xl font-bold text-gray-800">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-gray-600">
                ({stats.totalReviews} {stats.totalReviews > 1 ? "avis" : "avis"}
                )
              </span>
            </div>
          </div>

          {/* Add Review Button */}
          {isAuthenticated && !hasReviewed && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {showForm ? "Annuler" : "Laisser un avis"}
            </button>
          )}

          {isAuthenticated && hasReviewed && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
              ✓ Vous avez déjà laissé un avis
            </div>
          )}

          {!isAuthenticated && (
            <div className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg">
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Connectez-vous
              </a>{" "}
              pour laisser un avis
            </div>
          )}
        </div>
      </div>

      {/* Review Form */}
      {showForm && isAuthenticated && !hasReviewed && (
        <ReviewForm
          salonId={salonId}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-xl font-bold text-gray-800">
            Tous les avis ({reviews.length})
          </h4>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={handleDeleteReview}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-gray-600 text-lg">
            Aucun avis pour le moment. Soyez le premier à laisser un avis !
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
