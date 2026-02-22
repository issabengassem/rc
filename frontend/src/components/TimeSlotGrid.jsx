import React, { useState, useMemo } from "react";
import { Clock, Info, Loader2 } from "lucide-react";
import {
  generateTimeSlots,
  calculateSlotAvailability,
  filterPastSlots,
  getReservationForSlot,
} from "../utils/timeSlotUtils";

/**
 * TimeSlotGrid Component
 * Displays a visual calendar grid of available and reserved time slots
 */
const TimeSlotGrid = ({
  selectedDate,
  salonOpenTime = "09:00",
  salonCloseTime = "18:00",
  reservations = [],
  onSlotSelect,
  selectedSlot = null,
  slotInterval = 15,
  loading = false,
  selectedService = null,
}) => {
  const [hoveredSlot, setHoveredSlot] = useState(null);

  // Generate and calculate slot availability
  const slots = useMemo(() => {
    if (!selectedDate) return [];

    // Get service duration to calculate last valid slot
    const serviceDuration = selectedService?.durationMinutes || 0;

    // Generate base slots
    // Last slot = closingTime - serviceDuration (ensures service completes before closing)
    const baseSlots = generateTimeSlots(
      selectedDate,
      salonOpenTime,
      salonCloseTime,
      slotInterval,
      serviceDuration,
    );

    // Calculate availability based on reservations
    const slotsWithAvailability = calculateSlotAvailability(
      baseSlots,
      reservations,
      slotInterval,
    );

    // Filter out past slots if today
    return filterPastSlots(slotsWithAvailability, selectedDate);
  }, [
    selectedDate,
    salonOpenTime,
    salonCloseTime,
    reservations,
    slotInterval,
    selectedService,
  ]);

  // Handle slot click
  const handleSlotClick = (slot) => {
    if (slot.isAvailable && !slot.isPast) {
      onSlotSelect(slot);
    }
  };

  // Get reservation info for tooltip
  const getReservationInfo = (slot) => {
    const reservation = getReservationForSlot(
      slot.datetime,
      reservations,
      slotInterval,
    );
    if (reservation) {
      return {
        serviceName: reservation.service?.name || "Service",
        duration:
          reservation.service?.durationMinutes ||
          reservation.serviceDuration ||
          60,
        clientName: reservation.client?.firstName
          ? `${reservation.client.firstName} ${reservation.client.lastName}`
          : "Client",
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Chargement des créneaux...</span>
        </div>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>
            Veuillez sélectionner une date pour voir les créneaux disponibles
          </p>
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12 text-gray-500">
          <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun créneau disponible pour cette date</p>
          {selectedService && selectedService.durationMinutes > 0 && (
            <p className="text-sm mt-2 text-gray-600">
              Le service ({selectedService.durationMinutes} min) ne peut pas
              être complété pendant les heures d'ouverture ({salonOpenTime} -{" "}
              {salonCloseTime})
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      {/* Header with legend - Mobile Optimized */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
          <span className="text-sm sm:text-base">
            Créneaux - {selectedDate}
          </span>
        </h3>

        {/* Color Legend - Stack on mobile */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded mr-1.5 sm:mr-2"></div>
            <span className="text-gray-700">Disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded mr-1.5 sm:mr-2"></div>
            <span className="text-gray-700">Réservé</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded mr-1.5 sm:mr-2"></div>
            <span className="text-gray-700">Passé</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-indigo-600 rounded mr-1.5 sm:mr-2"></div>
            <span className="text-gray-700">Sélectionné</span>
          </div>
        </div>

        {selectedService && (
          <div className="mt-3 space-y-2">
            <div className="text-xs sm:text-sm text-gray-600">
              <span className="font-medium">Service:</span>{" "}
              {selectedService.name}{" "}
              <span className="text-gray-500">
                ({selectedService.durationMinutes} min)
              </span>
            </div>
            {slots.length > 0 && (
              <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded px-3 py-2 space-y-1">
                <div>
                  <Info className="w-3 h-3 inline mr-1" />
                  Créneaux affichés jusqu'à {slots[slots.length - 1]?.time} (le
                  service se termine avant la fermeture à {salonCloseTime})
                </div>
                <div className="text-gray-600">
                  💡 Les créneaux affichés concernent uniquement le service "
                  {selectedService.name}"
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Time Slot Grid - Mobile: 3 cols, Tablet: 4, Desktop: 6-8 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 max-h-96 overflow-y-auto">
        {slots.map((slot) => {
          const isSelected =
            selectedSlot && selectedSlot.datetime === slot.datetime;
          const isHovered = hoveredSlot === slot.datetime;
          const reservationInfo =
            slot.status === "reserved" ? getReservationInfo(slot) : null;

          let slotClasses =
            "relative p-3 sm:p-3.5 rounded-lg text-center text-sm sm:text-base font-medium transition-all duration-200 min-h-[52px] sm:min-h-[60px] flex flex-col items-center justify-center active:scale-95 ";

          // Determine slot style based on status
          if (slot.isPast || slot.status === "past") {
            slotClasses +=
              "bg-gray-200 text-gray-500 cursor-not-allowed opacity-60";
          } else if (slot.status === "reserved") {
            slotClasses += "bg-red-500 text-white cursor-not-allowed shadow-sm";
          } else if (isSelected) {
            slotClasses +=
              "bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300 transform scale-105";
          } else if (slot.isAvailable) {
            slotClasses +=
              "bg-green-500 text-white cursor-pointer hover:bg-green-600 hover:shadow-md hover:transform hover:scale-105";
          } else {
            slotClasses += "bg-gray-300 text-gray-600 cursor-not-allowed";
          }

          return (
            <div
              key={slot.datetime}
              className={slotClasses}
              onClick={() => handleSlotClick(slot)}
              onMouseEnter={() => setHoveredSlot(slot.datetime)}
              onMouseLeave={() => setHoveredSlot(null)}
              title={
                reservationInfo
                  ? `Réservé - ${reservationInfo.serviceName} (${reservationInfo.duration} min)`
                  : slot.isAvailable
                    ? "Cliquez pour sélectionner"
                    : "Non disponible"
              }
            >
              {/* Time Display */}
              <div className="font-bold">{slot.time}</div>

              {/* Status Indicator */}
              {slot.status === "reserved" && (
                <div className="text-xs mt-1 opacity-90">Réservé</div>
              )}
              {slot.isPast && (
                <div className="text-xs mt-1 opacity-75">Passé</div>
              )}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
              )}

              {/* Hover Tooltip for Reserved Slots */}
              {isHovered && reservationInfo && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
                  <div className="font-semibold mb-1">
                    {reservationInfo.serviceName}
                  </div>
                  <div className="text-gray-300">
                    Durée: {reservationInfo.duration} min
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No available slots message */}
      {slots.every((slot) => !slot.isAvailable) && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm text-center">
            <Info className="w-4 h-4 inline mr-2" />
            Aucun créneau disponible pour cette date. Veuillez choisir une autre
            date.
          </p>
        </div>
      )}

      {/* Selected Slot Info */}
      {selectedSlot && (
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-indigo-800 text-sm font-medium">
            ✓ Créneau sélectionné: {selectedSlot.displayTime}
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeSlotGrid;
