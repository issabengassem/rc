/**
 * Time Slot Utility Functions
 * Handles all logic for generating and validating time slots for salon reservations
 */

/**
 * Generate time slots for a given date based on salon working hours
 *
 * BUSINESS RULE:
 * Slots are generated from salon opening time to (closing time - service duration)
 * This ensures the service can be completed before the salon closes.
 *
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} openTime - Opening time in HH:mm format (e.g., "09:00")
 * @param {string} closeTime - Closing time in HH:mm format (e.g., "18:00")
 * @param {number} intervalMinutes - Interval between slots in minutes (default: 15)
 * @param {number} serviceDuration - Service duration in minutes (used to calculate last valid slot)
 * @returns {Array} Array of time slot objects with time and datetime
 */
export const generateTimeSlots = (
  date,
  openTime = "09:00",
  closeTime = "18:00",
  intervalMinutes = 15,
  serviceDuration = 0,
) => {
  const slots = [];
  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);

  // Create start and end datetime objects
  const startTime = new Date(`${date}T${openTime}:00`);
  const endTime = new Date(`${date}T${closeTime}:00`);

  // Calculate the last valid booking time
  // CRITICAL: Last slot = closingTime - serviceDuration
  // This ensures service can complete before salon closes
  // Example: If salon closes at 18:00 and service is 90 min, last slot is 16:30
  const lastValidBookingTime =
    serviceDuration > 0
      ? new Date(endTime.getTime() - serviceDuration * 60000)
      : endTime;

  let currentTime = new Date(startTime);

  // Generate slots until last valid booking time
  while (currentTime <= lastValidBookingTime) {
    const timeStr = currentTime.toTimeString().substring(0, 5); // "HH:mm"
    const datetimeStr = `${date}T${timeStr}:00`; // ISO format

    slots.push({
      time: timeStr,
      datetime: datetimeStr,
      displayTime: formatDisplayTime(timeStr),
    });

    // Move to next slot
    currentTime = new Date(currentTime.getTime() + intervalMinutes * 60000);
  }

  return slots;
};

/**
 * Format time for display (e.g., "09:00" → "9:00 AM")
 * @param {string} time - Time in HH:mm format
 * @returns {string} Formatted time
 */
export const formatDisplayTime = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
};

/**
 * Check if a time slot overlaps with a reservation
 * @param {string} slotDatetime - Slot datetime in ISO format
 * @param {string} reservationStart - Reservation start datetime
 * @param {number} serviceDuration - Service duration in minutes
 * @param {number} slotDuration - Duration of each slot in minutes
 * @returns {boolean} True if slot is blocked by this reservation
 */
export const isSlotBlocked = (
  slotDatetime,
  reservationStart,
  serviceDuration,
  slotDuration = 15,
) => {
  const slotTime = new Date(slotDatetime);
  const resStart = new Date(reservationStart);
  const resEnd = new Date(resStart.getTime() + serviceDuration * 60000);

  // A slot is blocked if it falls within the reservation period
  // We need to consider the slot's duration as well
  const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);

  // Check for overlap:
  // Slot overlaps if: slotStart < resEnd AND slotEnd > resStart
  return slotTime < resEnd && slotEnd > resStart;
};

/**
 * Calculate availability for all time slots
 *
 * BUSINESS RULE:
 * A slot is marked as RESERVED only if there's a reservation for the SAME service
 * that overlaps with this time slot. Reservations for OTHER services do NOT block slots.
 *
 * @param {Array} slots - Array of time slot objects
 * @param {Array} reservations - Array of reservation objects (ALREADY FILTERED by service)
 * @param {number} slotDuration - Duration of each slot in minutes
 * @returns {Array} Slots with availability status
 */
export const calculateSlotAvailability = (
  slots,
  reservations,
  slotDuration = 15,
) => {
  return slots.map((slot) => {
    // Check if this slot is blocked by any reservation
    // NOTE: reservations array should already be filtered for the selected service
    const isBlocked = reservations.some((reservation) => {
      // Handle different possible field names from backend
      const resStart = reservation.appointmentDateTime || reservation.startTime;
      const duration =
        reservation.serviceDuration ||
        reservation.durationMinutes ||
        reservation.service?.durationMinutes ||
        60; // default 60 min

      return isSlotBlocked(slot.datetime, resStart, duration, slotDuration);
    });

    return {
      ...slot,
      isAvailable: !isBlocked,
      status: isBlocked ? "reserved" : "available",
    };
  });
};

/**
 * Filter out past time slots for today
 * @param {Array} slots - Array of time slots
 * @param {string} selectedDate - Selected date in YYYY-MM-DD format
 * @returns {Array} Filtered slots
 */
export const filterPastSlots = (slots, selectedDate) => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // If selected date is not today, return all slots
  if (selectedDate !== today) {
    return slots;
  }

  // Filter out past slots for today
  return slots.map((slot) => {
    const slotTime = new Date(slot.datetime);
    const isPast = slotTime <= now;

    return {
      ...slot,
      isPast,
      isAvailable: slot.isAvailable && !isPast,
      status: isPast ? "past" : slot.status,
    };
  });
};

/**
 * Get reservation details for a blocked slot (for tooltips)
 * @param {string} slotDatetime - Slot datetime in ISO format
 * @param {Array} reservations - Array of reservations
 * @param {number} slotDuration - Duration of each slot in minutes
 * @returns {Object|null} Reservation object or null
 */
export const getReservationForSlot = (
  slotDatetime,
  reservations,
  slotDuration = 15,
) => {
  return reservations.find((reservation) => {
    const resStart = reservation.appointmentDateTime || reservation.startTime;
    const duration =
      reservation.serviceDuration ||
      reservation.durationMinutes ||
      reservation.service?.durationMinutes ||
      60;

    return isSlotBlocked(slotDatetime, resStart, duration, slotDuration);
  });
};

/**
 * Group slots by hour for better UI organization
 * @param {Array} slots - Array of time slots
 * @returns {Object} Slots grouped by hour
 */
export const groupSlotsByHour = (slots) => {
  return slots.reduce((groups, slot) => {
    const hour = slot.time.split(":")[0];
    if (!groups[hour]) {
      groups[hour] = [];
    }
    groups[hour].push(slot);
    return groups;
  }, {});
};

/**
 * Validate if a date is valid for booking
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Validation result with isValid and message
 */
export const validateBookingDate = (date) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return {
      isValid: false,
      message: "Cannot book appointments in the past",
    };
  }

  // Optional: Add maximum future date validation (e.g., 3 months ahead)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  if (selectedDate > maxDate) {
    return {
      isValid: false,
      message: "Cannot book more than 3 months in advance",
    };
  }

  return { isValid: true, message: "" };
};
