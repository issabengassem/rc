# Data Import Guide

## Overview

This guide explains how to import salon data from the CSV file into the MySQL database.

## Files Created

1. **DataImportService.java** - Service that handles CSV parsing and database insertion
2. **DataImportController.java** - REST endpoint for manual import (optional)
3. **DataLoader.java** - CommandLineRunner that automatically imports data on startup

## How It Works

### Automatic Import on Startup

When you start the backend application, it will automatically:

1. **Check if salons already exist** - If salons are already in the database, it skips the import
2. **Create default owner** - Creates an owner account with:
   - Email: `admin@reservecut.com`
   - Password: `admin123`
   - Role: OWNER
3. **Import salons** - Reads the CSV file and creates salon records

### Data Validation

The import process automatically:

- ✅ **Skips rows without phone numbers**
- ✅ **Skips rows without images**
- ✅ **Fills missing descriptions** - Generates default description: "Salon de coiffure professionnel à [City]"
- ✅ **Parses complex opening hours** - Handles:
  - Multiple time ranges per day (e.g., "10:00 to 12:45, 14:15 to 22:00")
  - 24/7 salons ("Ouvert 24h/24")
  - Closed days ("Fermé")
  - Different hours per day
- ✅ **Calculates general opening hours** - Finds earliest opening and latest closing across all days

## Configuration

### application.properties

```properties
# Enable/disable automatic import
app.data.import.enabled=true

# CSV file path (update if needed)
app.data.import.csv-path=C:\\Users\\ASUS\\Downloads\\ReserveCut-main\\data\\ready2_for_mysql.csv
```

## Running the Import

### Method 1: Automatic (Recommended)

1. Make sure the CSV file path in `application.properties` is correct
2. Start the backend:
   ```bash
   cd backend
   mvnw spring-boot:run
   ```
3. Check the logs for import status:
   ```
   Starting data import from: C:\Users\ASUS\Downloads\...
   Imported salon: Salon Lili-Roz
   Imported salon: Salon JOURI hair
   ...
   ✅ Data import completed successfully!
   ```

### Method 2: Disable Auto-Import

If you want to start the app without importing:

1. Set `app.data.import.enabled=false` in `application.properties`
2. Start the backend normally

## Expected Results

Based on the CSV file, the import will:

- **Process**: 17 salon records
- **Import**: Salons with both phone and image
- **Skip**: Salons missing phone or image
- **Create**: 1 owner account (admin@reservecut.com)

## Verifying the Import

### Check Database

```sql
-- Count imported salons
SELECT COUNT(*) FROM salons;

-- View salon details
SELECT id, name, city, phone, opening_time, closing_time
FROM salons
ORDER BY city, name;

-- Check owner
SELECT * FROM users WHERE email = 'admin@reservecut.com';
```

### Check Frontend

1. Start the frontend: `cd frontend && npm start`
2. Visit http://localhost:3000/salons
3. You should see the imported salons with:
   - Salon name
   - City
   - Address
   - Phone
   - Image
   - Opening hours

## Troubleshooting

### Import Not Running

- Check if `app.data.import.enabled=true` in application.properties
- Verify the CSV file path exists
- Check logs for error messages

### Salons Already Exist

- The import skips if salons already exist in the database
- To re-import, either:
  - Delete existing salons: `DELETE FROM salons;`
  - Or disable the check in DataLoader.java

### CSV Parsing Errors

- Ensure the CSV file is properly formatted
- Check for special characters in salon names/addresses
- Verify comma-separated values are correct

### Phone/Image Missing

- Rows without phone or image are automatically skipped
- Check logs: `Skipping salon 'Salon Name' - missing phone or image`

## Login Credentials

After import, you can login with:

- **Email**: admin@reservecut.com
- **Password**: admin123
- **Role**: OWNER

This account owns all imported salons.

## Next Steps

After successful import:

1. ✅ Verify salons appear in the frontend
2. ✅ Test filtering by city
3. ✅ Add services to salons via Salon Dashboard
4. ✅ Set up appointments
5. ✅ Test the complete booking flow
