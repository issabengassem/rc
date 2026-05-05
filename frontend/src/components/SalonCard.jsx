import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Phone } from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { salonService } from "../services/apiService";
import {
  handleSalonImageError,
  SALON_IMAGE_FALLBACK,
} from "../utils/imageUtils";

const SalonCard = ({ salon }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const getImageUrl = () => {
    // External image URL (from Apify/Google)
    if (salon.image_url) {
      return salonService.getImageUrl(salon.image_url);
    }

    // Image stored as Binary (Blob) in database
    if (salon.image && salon.image.data) {
      const base64String = btoa(
        String.fromCharCode(...new Uint8Array(salon.image.data)),
      );
      return `data:image/jpeg;base64,${base64String}`;
    }

    // Display image if provided (already processed URL)
    if (salon.displayImage) {
      return salonService.getImageUrl(salon.displayImage);
    }

    // Backend image path - construct URL or return as-is if already a full URL
    if (salon.imagePath) {
      return salonService.getImageUrl(salon.imagePath);
    }

    return SALON_IMAGE_FALLBACK;
  };

  const handleBookNow = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user.id) {
      toast.warning("Veuillez vous connecter pour réserver");
      navigate("/login");
      return;
    }

    // Navigate to booking page with salon ID
    navigate(`/rendez-vous/new?salonId=${salon.id}`);
  };

  const handleViewDetails = () => {
    // Navigate to salon detail page
    navigate(`/salon/${salon.id}`);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const decimal = rating % 1;

    // Star logic per requirements:
    // Full star: for each full number
    // Half star: if decimal >= 0.25 and < 0.75
    // Round up: if decimal >= 0.75
    let displayStars = fullStars;
    let hasHalfStar = false;

    if (decimal >= 0.75) {
      displayStars = fullStars + 1; // Round up to full star
    } else if (decimal >= 0.25) {
      hasHalfStar = true; // Show half star
    }

    for (let i = 1; i <= 5; i++) {
      if (i <= displayStars) {
        // Full star
        stars.push(
          <Star
            key={i}
            size={18}
            className="fill-yellow-400 text-yellow-400 transition-transform hover:scale-110"
          />,
        );
      } else if (i === displayStars + 1 && hasHalfStar) {
        // Half star
        stars.push(
          <div key={i} className="relative inline-block">
            <Star size={18} className="fill-gray-200 text-gray-200" />
            <Star
              size={18}
              className="fill-yellow-400 text-yellow-400 absolute top-0 left-0"
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </div>,
        );
      } else {
        // Empty star
        stars.push(
          <Star key={i} size={18} className="fill-gray-200 text-gray-200" />,
        );
      }
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 w-full">
      {/* Image Section - Optimized for mobile */}
      <div className="relative h-56 sm:h-48 bg-gray-200 overflow-hidden">
        <img
          src={getImageUrl()}
          alt={salon.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleSalonImageError}
        />
      </div>

      {/* Content Section - Mobile-first padding */}
      <div className="p-4 sm:p-5">
        <h3 className="text-xl sm:text-lg font-bold text-gray-900 mb-3 sm:mb-2 line-clamp-2">
          {salon.name}
        </h3>

        <div className="flex items-center text-gray-500 text-base sm:text-sm mb-2.5 sm:mb-2">
          <MapPin size={18} className="mr-2 flex-shrink-0 text-primary-600" />
          <span className="truncate">
            {salon.city || "Ville non spécifiée"}
          </span>
        </div>

        {salon.phone && (
          <div className="flex items-center text-gray-500 text-base sm:text-sm mb-3">
            <Phone size={18} className="mr-2 flex-shrink-0 text-primary-600" />
            <span>{salon.phone}</span>
          </div>
        )}

        <p className="text-gray-600 text-base sm:text-sm mb-4 line-clamp-2">
          {salon.address || salon.description || "Adresse non spécifiée"}
        </p>

        {/* Rating Display */}
        {salon.averageRating !== undefined && salon.averageRating > 0 ? (
          <div
            className="flex items-center mb-4 group"
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
          // Loading state - skeleton placeholder
          <div className="flex items-center mb-4 animate-pulse">
            <div className="flex gap-0.5 mr-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-[18px] h-[18px] bg-gray-200 rounded"
                ></div>
              ))}
            </div>
            <div className="h-4 w-8 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded ml-1.5"></div>
          </div>
        )}

        {/* Action Buttons - Touch-friendly on mobile */}
        <div className="space-y-3 sm:space-y-2">
          <button
            onClick={handleViewDetails}
            className="w-full bg-white border-2 border-primary-600 text-primary-600 py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg font-semibold hover:bg-primary-50 transition-all active:scale-98 min-h-[48px] text-base sm:text-sm"
          >
            Voir les détails
          </button>
          <button
            onClick={handleBookNow}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg active:scale-98 min-h-[48px] text-base sm:text-sm"
          >
            Réserver maintenant
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalonCard;
