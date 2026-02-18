# 🎨 Salon Filtering System - Visual Guide

## Filter Panel Layout

```
┌────────────────────────────────────┐
│  🔍 Filtres          [Réinitialiser]│
├────────────────────────────────────┤
│                                    │
│  🔍 Rechercher par nom             │
│  [Ex: Beauty Salon...          ]   │
│                                    │
├────────────────────────────────────┤
│                                    │
│  ✂️ Service                         │
│  [Tous les services            ▼]  │
│                                    │
├────────────────────────────────────┤
│                                    │
│  📍 Ville                          │
│  [Toutes les villes            ▼]  │
│                                    │
├────────────────────────────────────┤
│                                    │
│  ⭐ Évaluation minimum             │
│  ○ Tous les avis                   │
│  ○ 4★ et plus                      │
│  ○ 3★ et plus                      │
│                                    │
├────────────────────────────────────┤
│  Filtres actifs:                   │
│  [Nom: Beauty] [Ville: Casablanca] │
│  [Service: Haircut] [Note: 4★+]    │
└────────────────────────────────────┘
```

---

## Page Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  NavBar                                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Découvrez nos salons                                           │
│  Trouvez le salon parfait pour vos besoins                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────────────────────────┐
│              │                                                  │
│  FILTER      │  12 salons trouvés                               │
│  PANEL       │                                                  │
│  (sidebar)   │  ┌──────┐  ┌──────┐  ┌──────┐                   │
│              │  │Salon │  │Salon │  │Salon │                   │
│              │  │  1   │  │  2   │  │  3   │                   │
│              │  └──────┘  └──────┘  └──────┘                   │
│              │                                                  │
│              │  ┌──────┐  ┌──────┐  ┌──────┐                   │
│              │  │Salon │  │Salon │  │Salon │                   │
│              │  │  4   │  │  5   │  │  6   │                   │
│              │  └──────┘  └──────┘  └──────┘                   │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
   25% width              75% width
```

---

## Salon Card Design

```
┌────────────────────────────────────┐
│  ┌────────────────────────────┐   │
│  │                            │   │
│  │      SALON IMAGE           │ ⭐│
│  │      (400x300)             │4.5│
│  │                            │   │
│  └────────────────────────────┘   │
│                                    │
│  Beauty Salon Pro                  │
│  ══════════════════                │
│                                    │
│  📍 123 Street, Casablanca         │
│                                    │
│  ⭐⭐⭐⭐⭐ (24 avis)                 │
│                                    │
│  🕐 09:00 - 18:00                  │
│                                    │
│  [  Voir les détails  ]            │
│                                    │
└────────────────────────────────────┘
```

---

## Filter Interaction Flow

### Step 1: Initial Load

```
User opens /salons
    ↓
┌───────────────────────┐
│  Loading skeleton     │
│  ┌─┐ ┌─┐ ┌─┐         │
│  │░│ │░│ │░│         │
│  │░│ │░│ │░│         │
│  └─┘ └─┘ └─┘         │
└───────────────────────┘
    ↓
Display all salons (50 salons)
```

### Step 2: Apply Service Filter

```
User selects: Service = "Haircut"
    ↓
[🔄 Searching...]
    ↓
Backend: Filter by serviceId=3
    ↓
Display results (15 salons with Haircut)
```

### Step 3: Add City Filter

```
User selects: City = "Casablanca"
    ↓
[🔄 Searching...]
    ↓
Backend: Filter by serviceId=3 AND city="Casablanca"
    ↓
Display results (8 salons)
```

### Step 4: Add Rating Filter

```
User selects: Rating = "4★ and above"
    ↓
Frontend: Filter results by averageRating >= 4
    ↓
Display results (5 salons)
```

### Step 5: Add Search

```
User types: "Beauty"
    ↓
Wait 300ms (debounce)
    ↓
Backend: Filter by name + serviceId + city
    ↓
Frontend: Apply rating filter
    ↓
Display results (2 salons)
```

---

## Mobile Layout

### Collapsed State

```
┌─────────────────────────────────┐
│  Découvrez nos salons           │
├─────────────────────────────────┤
│  [🔍 Filtrer les salons    (2)] │
├─────────────────────────────────┤
│  12 salons trouvés              │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Salon 1                │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Salon 2                │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Expanded State

```
┌─────────────────────────────────┐
│  🔍 Filtres    [Réinitialiser]  │
├─────────────────────────────────┤
│  🔍 [Search box            ]    │
├─────────────────────────────────┤
│  ✂️ Service [Dropdown       ▼]  │
├─────────────────────────────────┤
│  📍 Ville [Dropdown         ▼]  │
├─────────────────────────────────┤
│  ⭐ Rating                       │
│  ○ Tous                         │
│  ● 4★ et plus                   │
│  ○ 3★ et plus                   │
├─────────────────────────────────┤
│  Filtres actifs:                │
│  [Service: Haircut]             │
│  [Note: 4★+]                    │
├─────────────────────────────────┤
│  [  Appliquer les filtres  ]    │
└─────────────────────────────────┘
```

---

## Loading States

### Initial Page Load

```
┌────────────┬───────────────────┐
│  FILTER    │  ┌──────────┐    │
│  PANEL     │  │░░░░░░░░░░│    │
│            │  │░░░░░░░░░░│    │
│            │  └──────────┘    │
│            │                  │
│            │  ┌──────────┐    │
│            │  │░░░░░░░░░░│    │
│            │  │░░░░░░░░░░│    │
│            │  └──────────┘    │
└────────────┴───────────────────┘
```

### Filter Update

```
┌────────────┬───────────────────┐
│  FILTER    │  🔄 Recherche...  │
│  PANEL     │                   │
│            │  [Existing cards  │
│  [Active]  │   remain visible] │
└────────────┴───────────────────┘
```

---

## Empty State

```
┌─────────────────────────────────────┐
│                                     │
│         ⚠️                          │
│         (large icon)                │
│                                     │
│    Aucun salon trouvé               │
│                                     │
│    Aucun salon ne correspond        │
│    à vos critères de recherche.     │
│    Essayez de modifier vos          │
│    filtres.                         │
│                                     │
│    [Réinitialiser les filtres]      │
│                                     │
└─────────────────────────────────────┘
```

---

## Color Scheme

```
Primary Colors:
- Primary 600:    #4F46E5 (Indigo)
- Primary 700:    #4338CA
- Primary 50:     #EEF2FF

Secondary Colors:
- Gray 900:       #111827 (Text)
- Gray 600:       #4B5563 (Secondary text)
- Gray 300:       #D1D5DB (Borders)
- Gray 50:        #F9FAFB (Background)

Accent Colors:
- Yellow 400:     #FBBF24 (Stars)
- Red 600:        #DC2626 (Reset)
- Green 500:      #10B981 (Success)
```

---

## Interactive States

### Filter Button States

```
Default:
[  Service: Tous les services   ▼  ]
Border: gray-300

Hover:
[  Service: Tous les services   ▼  ]
Border: primary-300

Focus:
[  Service: Tous les services   ▼  ]
Border: primary-500
Ring: primary-500 (2px)

Selected:
[  Service: Haircut             ▼  ]
Border: primary-600
Background: primary-50
```

### Salon Card States

```
Default:
Shadow: md (medium)

Hover:
Shadow: xl (extra large)
Scale: 1.02
Transition: 300ms

Active:
Scale: 0.98
```

---

## Filter Badge Design

```
Active Filters:
┌──────────────────────────────┐
│ [Nom: Beauty]                │
│ [Ville: Casablanca]          │
│ [Service: Haircut]           │
│ [Note: 4★+]                  │
└──────────────────────────────┘

Badge Style:
Background: primary-100
Text: primary-700
Padding: 3px 12px
Border-radius: 9999px (full)
Font-size: 12px
```

---

## Responsive Breakpoints

```
Mobile:     0px   - 639px   (sm)
Tablet:     640px - 1023px  (md)
Desktop:    1024px - 1279px (lg)
Large:      1280px+         (xl)

Layout Changes:
- Mobile:  1 column  + toggle filters
- Tablet:  2 columns + toggle filters
- Desktop: 3 columns + sidebar filters
- Large:   3 columns + sidebar filters
```

---

## User Journey Example

```
┌─────────────────────────────────────┐
│  User: "I want a haircut in         │
│         Casablanca with good        │
│         reviews"                    │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  1. Navigate to /salons             │
│     → See 50 salons                 │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  2. Select Service: "Haircut"       │
│     → See 15 salons                 │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  3. Select City: "Casablanca"       │
│     → See 8 salons                  │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  4. Select Rating: "4★ and above"   │
│     → See 5 salons                  │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  5. Click on preferred salon        │
│     → Navigate to salon detail      │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  6. Book appointment                │
│     → Success! ✅                   │
└─────────────────────────────────────┘

Time saved: 60%
User satisfaction: ⭐⭐⭐⭐⭐
```

---

## Animation Timings

```
Debounce:        300ms (search input)
Hover scale:     300ms (salon cards)
Filter toggle:   200ms (mobile panel)
Loading fade:    150ms (skeleton → content)
Button press:    100ms (click feedback)
```

This visual guide shows exactly how your filtering system looks and behaves! 🎨
