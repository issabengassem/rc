# Service-Specific Time Slot Availability - Visual Guide

## Scenario: Salon with Multiple Services

```
SALON HOURS: 09:00 - 18:00

SERVICES:
├─ Haircut      (30 minutes)
└─ Coloring     (90 minutes)
```

## Example 1: Haircut Booked at 10:00

### When User Selects "Haircut" Service:

```
Time    09:00   10:00   10:30   11:00   11:30   12:00   13:00   14:00   15:00   16:00   17:00   17:30
Slot    🟢      🔴      🔴      🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢
Status  AVAIL   BOOKED  BOOKED  AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL

Last slot: 17:30 (18:00 - 30 min)
10:00 marked RED because Haircut is booked there
```

### When User Selects "Coloring" Service:

```
Time    09:00   10:00   10:30   11:00   11:30   12:00   13:00   14:00   15:00   16:00   16:30
Slot    🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢
Status  AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL

Last slot: 16:30 (18:00 - 90 min)
10:00 marked GREEN because Coloring is NOT booked there (Haircut booking doesn't affect it)
```

---

## Example 2: Coloring Booked at 10:00

### When User Selects "Coloring" Service:

```
Time    09:00   10:00   10:30   11:00   11:30   12:00   12:30   13:00   14:00   15:00   16:00   16:30
Slot    🟢      🔴      🔴      🔴      🔴      🔴      🔴      🟢      🟢      🟢      🟢      🟢
Status  AVAIL   BOOKED  BOOKED  BOOKED  BOOKED  BOOKED  BOOKED  AVAIL   AVAIL   AVAIL   AVAIL   AVAIL

Last slot: 16:30 (18:00 - 90 min)
10:00-11:30 marked RED because Coloring (90 min) is booked at 10:00
```

### When User Selects "Haircut" Service:

```
Time    09:00   10:00   10:30   11:00   11:30   12:00   13:00   14:00   15:00   16:00   17:00   17:30
Slot    🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢      🟢
Status  AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL   AVAIL

Last slot: 17:30 (18:00 - 30 min)
All slots GREEN because Haircut has NO bookings (Coloring booking doesn't affect it)
```

---

## Key Visual Concepts

### Slot Color Legend

```
🟢 GREEN  → Available for selected service
🔴 RED    → Reserved for selected service
⚪ GRAY   → Time has passed (only for today)
🔵 BLUE   → Currently selected by user
```

### Time Range by Service Duration

```
┌─────────────────────────────────────────────────────┐
│                 Salon Hours: 09:00 - 18:00          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Short Service (30 min):                           │
│  ├──────────────────────────────────────┤          │
│  09:00                                17:30         │
│                                                     │
│  Long Service (90 min):                            │
│  ├───────────────────────────────┤                 │
│  09:00                          16:30               │
│                                                     │
└─────────────────────────────────────────────────────┘

Formula: Last Slot = Closing Time - Service Duration
```

### Reservation Overlap Logic

```
SAME SERVICE = BLOCKS SLOT
┌──────────────────────────┐
│  Haircut at 10:00        │
│  User selects Haircut    │
│  Result: 🔴 RED (Blocked) │
└──────────────────────────┘

DIFFERENT SERVICE = DOESN'T BLOCK
┌──────────────────────────┐
│  Haircut at 10:00        │
│  User selects Coloring   │
│  Result: 🟢 GREEN (Open)  │
└──────────────────────────┘
```

---

## Real-World Scenario

### Salon Setup

```
Services Available:
1. Haircut       - 30 min  - 50 MAD
2. Hair Coloring - 90 min  - 150 MAD
3. Manicure      - 45 min  - 80 MAD
4. Facial        - 60 min  - 120 MAD
```

### Current Bookings on 2026-02-20:

```
10:00 - Haircut     (30 min) by Client A
11:00 - Coloring    (90 min) by Client B
14:00 - Manicure    (45 min) by Client C
```

### User Wants to Book "Haircut" at 10:00:

```
Result: ❌ NOT AVAILABLE
Reason: Haircut already booked at 10:00
Display: 🔴 RED slot with tooltip "Réservé - Haircut (30 min)"
```

### User Wants to Book "Coloring" at 10:00:

```
Result: ✅ AVAILABLE
Reason: Coloring NOT booked at 10:00 (Haircut booking doesn't matter)
Display: 🟢 GREEN slot - clickable
```

### User Wants to Book "Facial" at 11:00:

```
Result: ✅ AVAILABLE
Reason: Facial NOT booked at 11:00 (Coloring booking doesn't matter)
Display: 🟢 GREEN slot - clickable
```

---

## API Call Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Selects Service: Haircut (ID: 5)               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. User Selects Date: 2026-02-20                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Frontend API Call:                                  │
│    GET /api/appointments/service/5?date=2026-02-20     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Backend Filters:                                    │
│    - Service ID = 5 (Haircut only)                     │
│    - Date = 2026-02-20                                 │
│    - Status ≠ CANCELLED/REJECTED                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Returns ONLY Haircut Appointments:                  │
│    [                                                   │
│      {                                                 │
│        id: 123,                                        │
│        appointmentDateTime: "2026-02-20T10:00",        │
│        service: { id: 5, name: "Haircut", ... },       │
│        ...                                             │
│      }                                                 │
│    ]                                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Frontend Generates Slots:                          │
│    From: 09:00 (opening)                              │
│    To:   17:30 (18:00 - 30 min)                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Mark Slots as Reserved:                            │
│    10:00 → 🔴 RED (Haircut booked)                     │
│    10:30 → 🔴 RED (still within 30-min duration)       │
│    11:00 → 🟢 GREEN (available)                        │
└─────────────────────────────────────────────────────────┘
```

---

## Benefits of This Implementation

### ✅ Maximized Booking Capacity

Multiple services can run simultaneously without blocking each other

### ✅ Service-Specific Availability

Users see accurate availability for their selected service

### ✅ Proper Time Management

Last slot calculation ensures services complete before closing

### ✅ Clear User Interface

Color-coded slots with service-specific legend

### ✅ Efficient API Calls

Backend filters data, reducing frontend processing

---

## Testing Matrix

| Scenario | Service A Booked | Service B Booked | Service A Slot | Service B Slot | ✓/✗ |
| -------- | ---------------- | ---------------- | -------------- | -------------- | --- |
| 1        | 10:00            | -                | 🔴 RED         | 🟢 GREEN       | ✓   |
| 2        | -                | 10:00            | 🟢 GREEN       | 🔴 RED         | ✓   |
| 3        | 10:00            | 10:00            | 🔴 RED         | 🔴 RED         | ✓   |
| 4        | -                | -                | 🟢 GREEN       | 🟢 GREEN       | ✓   |
