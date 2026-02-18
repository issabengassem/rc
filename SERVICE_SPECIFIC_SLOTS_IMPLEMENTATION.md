# Service-Specific Time Slot Availability Implementation

## Business Rule Implementation ✅

### Core Principle

**A time slot is RESERVED only if there's a reservation for the SAME service that overlaps with that time slot.**

Reservations for different services DO NOT block each other's time slots.

## Example Scenarios

### Scenario 1: Haircut Booking

- Salon has:
  - **Haircut** (30 min)
  - **Coloring** (90 min)
- Haircut booked at 10:00
  - ✅ **Haircut slot 10:00** = RED (Reserved)
  - ✅ **Coloring slot 10:00** = GREEN (Available)

### Scenario 2: Coloring Booking

- Coloring booked at 10:00
  - ✅ **Coloring slot 10:00** = RED (Reserved)
  - ✅ **Haircut slot 10:00** = GREEN (Available)

## Implementation Details

### 1. Backend Changes ✅

#### New Repository Method

**File:** `AppointmentRepository.java`

```java
// Find appointments by service ID and date range
@Query("SELECT a FROM Appointment a WHERE a.service.id = :serviceId " +
       "AND a.appointmentDateTime BETWEEN :startDate AND :endDate")
List<Appointment> findByServiceIdAndDateRange(
    @Param("serviceId") Long serviceId,
    @Param("startDate") LocalDateTime startDate,
    @Param("endDate") LocalDateTime endDate
);
```

#### New Service Methods

**File:** `AppointmentService.java`

```java
// Get appointments by service
public List<AppointmentDTO> getAppointmentsByService(Long serviceId)

// Get appointments by service and specific date
public List<AppointmentDTO> getAppointmentsByServiceAndDate(Long serviceId, String date)
```

#### New Controller Endpoint

**File:** `AppointmentController.java`

```java
GET /api/appointments/service/{serviceId}?date=YYYY-MM-DD
```

### 2. Frontend API Service ✅

**File:** `apiService.js`

```javascript
// Get appointments by service (optionally filtered by date)
getAppointmentsByService: async (serviceId, date = null) => {
  let url = `${API_BASE_URL}/appointments/service/${serviceId}`;
  if (date) {
    url += `?date=${date}`;
  }
  // Returns ONLY appointments for this specific service
  const response = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(response);
};
```

### 3. Time Slot Generation ✅

**File:** `timeSlotUtils.js`

#### Key Function: `generateTimeSlots()`

```javascript
// CRITICAL: Calculate last valid booking time
const lastValidBookingTime =
  serviceDuration > 0
    ? new Date(endTime.getTime() - serviceDuration * 60000)
    : endTime;
```

**Example:**

- Salon closes at: **18:00**
- Service duration: **90 minutes**
- Last available slot: **16:30** (18:00 - 90 min)
- This ensures service completes before closing

### 4. Booking Component Updates ✅

**File:** `BookAppointment.jsx`

#### Service-Specific Reservation Fetching

```javascript
const fetchReservationsForDate = async (date, serviceId) => {
  // Use the new service-specific endpoint
  const serviceReservations = await appointmentService.getAppointmentsByService(
    serviceId,
    date,
  );

  // Returns ONLY reservations for the selected service
  // Other services' reservations are NOT included
};
```

#### Availability Check

```javascript
const checkAvailability = async (dateTime, serviceId) => {
  const date = dateTime.split("T")[0];

  // Fetch appointments for this specific service only
  const appointments = await appointmentService.getAppointmentsByService(
    serviceId,
    date,
  );

  // Check if slot is booked for THIS service
  // Bookings for OTHER services don't matter
};
```

## Data Flow

```
1. User selects salon
   ↓
2. User selects service (e.g., Haircut)
   ↓
3. User selects date (e.g., 2026-02-20)
   ↓
4. Frontend calls: GET /api/appointments/service/123?date=2026-02-20
   ↓
5. Backend returns ONLY Haircut appointments for that date
   ↓
6. Frontend generates time slots:
   - From: salon opening time (09:00)
   - To: closing time - service duration (18:00 - 30min = 17:30)
   ↓
7. Calculate availability:
   - Compare slots ONLY with Haircut reservations
   - Coloring reservations are ignored
   ↓
8. Display slots:
   - Green = Available for Haircut
   - Red = Reserved for Haircut
```

## Time Slot Range Calculation

### Formula

```
Start Time: Salon Opening Time
End Time: Salon Closing Time - Selected Service Duration
```

### Examples

#### Short Service (30 min Haircut)

- Opening: 09:00
- Closing: 18:00
- Service: 30 min
- **Slots generated:** 09:00 to 17:30

#### Long Service (90 min Coloring)

- Opening: 09:00
- Closing: 18:00
- Service: 90 min
- **Slots generated:** 09:00 to 16:30

## Color Legend in UI

| Color    | Status    | Meaning                         |
| -------- | --------- | ------------------------------- |
| 🟢 Green | Available | No reservation for THIS service |
| 🔴 Red   | Reserved  | Booked for THIS service         |
| ⚪ Gray  | Past      | Time has already passed         |
| 🔵 Blue  | Selected  | User's current selection        |

## Edge Cases Handled

1. **Past times** - Automatically disabled for today
2. **Salon closed days** - No slots generated
3. **No available slots** - Clear message displayed
4. **Service longer than opening hours** - Warning message shown
5. **Multiple services at same time** - Each service maintains independent availability

## User Experience Features

✅ **Visual calendar grid** with color-coded slots  
✅ **Real-time availability** based on selected service  
✅ **Tooltip on hover** showing reservation details  
✅ **Modern popup errors** (no browser alerts)  
✅ **Only green slots are clickable**  
✅ **Automatic slot refresh** when service or date changes

## Testing Scenarios

### Test 1: Different Services, Same Time

1. Create Haircut (30 min) and Coloring (90 min) services
2. Book Haircut at 10:00
3. Select Coloring service
4. **Expected:** 10:00 slot shows GREEN for Coloring

### Test 2: Service Duration Affects Last Slot

1. Salon: 09:00 - 18:00
2. Select 90-minute service
3. **Expected:** Last slot is 16:30 (not 18:00)

### Test 3: Same Service, Same Time = Blocked

1. Book Haircut at 10:00
2. Try to book another Haircut at 10:00
3. **Expected:** Slot shows RED and is not clickable

## Files Modified

### Backend

- ✅ `AppointmentRepository.java` - Added service-specific queries
- ✅ `AppointmentService.java` - Added service filtering methods
- ✅ `AppointmentController.java` - Added `/service/{id}` endpoint

### Frontend

- ✅ `apiService.js` - Added `getAppointmentsByService()` method
- ✅ `BookAppointment.jsx` - Updated to use service-specific API
- ✅ `timeSlotUtils.js` - Enhanced documentation for business rules
- ✅ `TimeSlotGrid.jsx` - Already properly configured

## Verification Checklist

- ✅ Backend endpoint filters by serviceId + date
- ✅ Frontend fetches only service-specific reservations
- ✅ Time slots generated from opening to (closing - duration)
- ✅ Slot availability checked only against same-service reservations
- ✅ Different services don't block each other's slots
- ✅ UI shows service-specific legend and info
- ✅ Edge cases handled with user-friendly messages

## Conclusion

The implementation now correctly enforces the business rule:
**"A time slot is reserved ONLY for the specific service booked, not for all services."**

This allows salons to maximize their booking capacity by supporting multiple concurrent services.
