# 🧪 Salon Filtering System - Testing Guide

## Quick Start Testing

### 1. Start the Application

**Backend:**

```bash
cd backend
mvnw spring-boot:run
```

**Frontend:**

```bash
cd frontend
npm start
```

### 2. Navigate to Salons Page

```
http://localhost:3000/salons
```

---

## Test Cases

### ✅ Test 1: Initial Page Load

**Steps:**

1. Navigate to `/salons`
2. Wait for page to load

**Expected Results:**

- ✅ Loading skeleton appears briefly
- ✅ All salons displayed in grid
- ✅ Filter panel visible on left (desktop)
- ✅ Salons show images, ratings, and details
- ✅ Total count displayed: "X salons trouvés"

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 2: Search by Name

**Steps:**

1. Type "Beauty" in search box
2. Wait 300ms for debounce
3. Observe results

**Expected Results:**

- ✅ "Searching..." indicator appears
- ✅ Only salons with "Beauty" in name shown
- ✅ Result count updates
- ✅ Active filter badge shows: "Nom: Beauty"

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 3: Filter by Service

**Steps:**

1. Clear any existing filters (click Reset)
2. Select "Haircut" from Service dropdown
3. Observe results

**Expected Results:**

- ✅ Only salons offering Haircut service displayed
- ✅ Result count updates
- ✅ Active filter badge shows: "Service: Haircut"
- ✅ Dropdown shows selected value

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 4: Filter by City

**Steps:**

1. Clear any existing filters
2. Select "Casablanca" from City dropdown
3. Observe results

**Expected Results:**

- ✅ Only salons in Casablanca displayed
- ✅ All salon cards show "Casablanca" in location
- ✅ Active filter badge shows: "Ville: Casablanca"

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 5: Filter by Rating

**Steps:**

1. Clear any existing filters
2. Select "4★ and above" radio button
3. Observe results

**Expected Results:**

- ✅ Only salons with 4+ star ratings displayed
- ✅ All displayed salons show rating ≥ 4.0
- ✅ Active filter badge shows: "Note: 4★+"
- ✅ Radio button selected

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 6: Combined Filters

**Steps:**

1. Clear all filters
2. Select Service: "Haircut"
3. Select City: "Casablanca"
4. Select Rating: "4★ and above"
5. Type "Salon" in search

**Expected Results:**

- ✅ Results match ALL criteria:
  - Name contains "Salon"
  - Offers Haircut service
  - Located in Casablanca
  - Rating ≥ 4 stars
- ✅ Four active filter badges visible
- ✅ Result count accurate

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 7: Reset Filters

**Steps:**

1. Apply multiple filters (Test 6)
2. Click "Réinitialiser" button
3. Observe results

**Expected Results:**

- ✅ All filters cleared
- ✅ All filter inputs reset to default
- ✅ Full salon list displayed
- ✅ No active filter badges
- ✅ Reset button disappears

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 8: No Results Found

**Steps:**

1. Type "XYZ123NonExistent" in search
2. Select any service
3. Select any city
4. Wait for results

**Expected Results:**

- ✅ Empty state displayed
- ✅ Alert icon visible
- ✅ Message: "Aucun salon trouvé"
- ✅ "Réinitialiser les filtres" button visible
- ✅ No salon cards displayed

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 9: Search Debouncing

**Steps:**

1. Rapidly type "B-e-a-u-t-y" in search
2. Observe network requests (DevTools)

**Expected Results:**

- ✅ Only ONE API call made (after 300ms)
- ✅ Not 6 calls (one per letter)
- ✅ Results appear after typing stops

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 10: Mobile Responsive

**Steps:**

1. Open page on mobile device or resize to 375px width
2. Observe filter panel
3. Click "Filtrer les salons" button
4. Apply filters
5. Click "Appliquer les filtres"

**Expected Results:**

- ✅ Filter button visible at top
- ✅ Filter panel hidden by default
- ✅ Panel slides in when button clicked
- ✅ All filters functional
- ✅ Panel closes after applying
- ✅ Salon cards stack vertically

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 11: Click Salon Card

**Steps:**

1. Display some salons
2. Click on any salon card
3. Observe navigation

**Expected Results:**

- ✅ Navigate to salon detail page
- ✅ URL: `/salon/{id}`
- ✅ Salon details displayed
- ✅ "Book" button visible

**Pass/Fail:** ****\_\_\_****

---

### ✅ Test 12: Loading States

**Steps:**

1. Open Network tab in DevTools
2. Throttle to "Slow 3G"
3. Apply a filter
4. Observe loading indicators

**Expected Results:**

- ✅ Loading skeleton OR spinner visible
- ✅ "Searching..." text appears
- ✅ Filter inputs disabled during load
- ✅ Previous results stay visible during filter update

**Pass/Fail:** ****\_\_\_****

---

## Performance Tests

### ⚡ Test 13: Large Dataset

**Setup:**

- Ensure database has 100+ salons

**Steps:**

1. Load `/salons` page
2. Measure load time

**Expected Results:**

- ✅ Page loads in < 2 seconds
- ✅ Filter panel renders immediately
- ✅ Salons load progressively

**Pass/Fail:** ****\_\_\_****

---

### ⚡ Test 14: Filter Speed

**Steps:**

1. Apply service filter
2. Measure response time

**Expected Results:**

- ✅ Results appear in < 500ms
- ✅ No lag or freezing
- ✅ Smooth transition

**Pass/Fail:** ****\_\_\_****

---

## Browser Compatibility Tests

### 🌐 Test 15: Chrome

**Expected:** All features work ✅

**Pass/Fail:** ****\_\_\_****

---

### 🌐 Test 16: Firefox

**Expected:** All features work ✅

**Pass/Fail:** ****\_\_\_****

---

### 🌐 Test 17: Safari

**Expected:** All features work ✅

**Pass/Fail:** ****\_\_\_****

---

### 🌐 Test 18: Edge

**Expected:** All features work ✅

**Pass/Fail:** ****\_\_\_****

---

## Edge Case Tests

### 🔍 Test 19: Special Characters

**Steps:**

1. Type "Salon's & Spa!" in search
2. Observe results

**Expected Results:**

- ✅ No errors
- ✅ Search works correctly
- ✅ Special characters handled

**Pass/Fail:** ****\_\_\_****

---

### 🔍 Test 20: Very Long Name

**Steps:**

1. Type 100+ character string in search
2. Observe behavior

**Expected Results:**

- ✅ Input handles long text
- ✅ No UI breaking
- ✅ Search executes or shows validation

**Pass/Fail:** ****\_\_\_****

---

### 🔍 Test 21: Rapid Filter Changes

**Steps:**

1. Rapidly change filters (service → city → rating → search)
2. Within 1 second

**Expected Results:**

- ✅ No errors in console
- ✅ Only final filter state applied
- ✅ Results match final selection

**Pass/Fail:** ****\_\_\_****

---

## API Tests (Postman/cURL)

### 📡 Test 22: Filter Endpoint - Name Only

```bash
curl "http://localhost:8080/api/salons/filter?name=Beauty"
```

**Expected:** 200 OK + filtered results

**Pass/Fail:** ****\_\_\_****

---

### 📡 Test 23: Filter Endpoint - Service Only

```bash
curl "http://localhost:8080/api/salons/filter?serviceId=3"
```

**Expected:** 200 OK + salons with service ID 3

**Pass/Fail:** ****\_\_\_****

---

### 📡 Test 24: Filter Endpoint - City Only

```bash
curl "http://localhost:8080/api/salons/filter?city=Casablanca"
```

**Expected:** 200 OK + salons in Casablanca

**Pass/Fail:** ****\_\_\_****

---

### 📡 Test 25: Filter Endpoint - Combined

```bash
curl "http://localhost:8080/api/salons/filter?name=Salon&serviceId=3&city=Casablanca"
```

**Expected:** 200 OK + results matching all criteria

**Pass/Fail:** ****\_\_\_****

---

### 📡 Test 26: Filter Endpoint - No Params

```bash
curl "http://localhost:8080/api/salons/filter"
```

**Expected:** 200 OK + all salons

**Pass/Fail:** ****\_\_\_****

---

## Accessibility Tests

### ♿ Test 27: Keyboard Navigation

**Steps:**

1. Use TAB key to navigate filters
2. Use ENTER to select options
3. Use SPACE for radio buttons

**Expected Results:**

- ✅ All filters reachable via keyboard
- ✅ Focus indicators visible
- ✅ Can apply filters without mouse

**Pass/Fail:** ****\_\_\_****

---

### ♿ Test 28: Screen Reader

**Steps:**

1. Enable screen reader (NVDA/JAWS)
2. Navigate filter panel
3. Listen to announcements

**Expected Results:**

- ✅ Labels read correctly
- ✅ Filter states announced
- ✅ Results count announced

**Pass/Fail:** ****\_\_\_****

---

## Summary

**Total Tests:** 28  
**Passed:** **\_\_**  
**Failed:** **\_\_**  
**Success Rate:** **\_\_**%

---

## Bug Report Template

**Test Number:** **\_\_\_**  
**Test Name:** **\_\_\_**  
**Steps to Reproduce:**

1.
2.
3.

**Expected Result:**

**Actual Result:**

**Screenshots:** (attach)

**Browser/Device:**

**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low

---

## Testing Checklist Summary

- [ ] Initial load works
- [ ] All individual filters work
- [ ] Combined filters work
- [ ] Reset filters works
- [ ] Empty state displays correctly
- [ ] Loading states visible
- [ ] Mobile responsive
- [ ] Debouncing prevents excessive calls
- [ ] Performance acceptable
- [ ] Cross-browser compatible
- [ ] API endpoints functional
- [ ] Accessibility standards met

---

**Tested By:** ******\_\_\_******  
**Date:** ******\_\_\_******  
**Version:** ******\_\_\_******

✅ **All tests passed = Production Ready!**
