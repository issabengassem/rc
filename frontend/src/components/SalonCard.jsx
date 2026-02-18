import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Phone, Clock } from "lucide-react";
import { useToast } from "../contexts/ToastContext";

const SalonCard = ({ salon }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const getImageUrl = () => {
    // External image URL (from Apify/Google)
    if (salon.image_url) {
      return salon.image_url;
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
      return salon.displayImage;
    }

    // Backend image path - construct URL
    if (salon.imagePath) {
      const imageUrl = `http://localhost:8080/api/files/salons/${salon.imagePath}`;
      console.log("Image URL for salon", salon.name, ":", imageUrl);
      return imageUrl;
    }

    // Default placeholder
    return "https://placehold.co/400x300?text=No+Image";
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
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={getImageUrl()}
          alt={salon.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(e) => {
            console.error(
              "Failed to load image for salon:",
              salon.name,
              "URL:",
              e.target.src,
            );
            e.target.onerror = null; // Prevent infinite loop
            e.target.src = "https://placehold.co/400x300?text=Salon";
          }}
        />
      </div>

      {/* Content Section */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{salon.name}</h3>

        <div className="flex items-center text-gray-500 text-sm mb-2">
          <MapPin size={16} className="mr-1 flex-shrink-0" />
          <span className="truncate">
            {salon.city || "Ville non spécifiée"}
          </span>
        </div>

        {salon.phone && (
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <Phone size={16} className="mr-1 flex-shrink-0" />
            <span>{salon.phone}</span>
          </div>
        )}

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
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

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleViewDetails}
            className="w-full bg-white border-2 border-blue-600 text-blue-600 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Voir les détails
          </button>
          <button
            onClick={handleBookNow}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Réserver maintenant
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalonCard;
