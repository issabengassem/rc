package com.example.backend.services;

import com.example.backend.entities.Salon;
import com.example.backend.entities.User;
import com.example.backend.repositories.SalonRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.FileReader;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataImportService {

    private final SalonRepository salonRepository;
    private final UserRepository userRepository;

    @Transactional
    public void importSalonsFromCsv(String csvFilePath, Long ownerId) {
        try (BufferedReader br = new BufferedReader(new FileReader(csvFilePath))) {
            String line;
            boolean isHeader = true;
            int imported = 0;
            int skipped = 0;

            // Get or create owner
            User owner = userRepository.findById(ownerId)
                    .orElseThrow(() -> new RuntimeException("Owner not found with id: " + ownerId));

            while ((line = br.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                String[] values = parseCsvLine(line);
                
                // Skip if phone or image is missing
                String phone = values[1].trim();
                String imageUrl = values[17].trim();
                
                if (phone.isEmpty() || imageUrl.isEmpty()) {
                    log.warn("Skipping salon '{}' - missing phone or image", values[0]);
                    skipped++;
                    continue;
                }

                try {
                    Salon salon = createSalonFromCsvRow(values, owner);
                    salonRepository.save(salon);
                    imported++;
                    log.info("Imported salon: {}", salon.getName());
                } catch (Exception e) {
                    log.error("Error importing salon '{}': {}", values[0], e.getMessage());
                    skipped++;
                }
            }

            log.info("Import completed: {} salons imported, {} skipped", imported, skipped);
        } catch (Exception e) {
            log.error("Error reading CSV file: {}", e.getMessage());
            throw new RuntimeException("Failed to import salons", e);
        }
    }

    private Salon createSalonFromCsvRow(String[] values, User owner) {
        Salon salon = new Salon();
        
        // Basic info
        salon.setName(values[0].trim());
        salon.setPhone(values[1].trim());
        salon.setCity(values[15].trim());
        salon.setAddress(values[16].trim());
        salon.setImagePath(values[17].trim());
        salon.setOwner(owner);
        
        // Set default description
        salon.setDescription("Salon de coiffure professionnel à " + values[15].trim());
        
        // Parse opening hours
        TimeRange timeRange = parseOpeningHours(values);
        salon.setOpeningTime(timeRange.opening);
        salon.setClosingTime(timeRange.closing);
        
        return salon;
    }

    private TimeRange parseOpeningHours(String[] values) {
        LocalTime earliestOpen = LocalTime.of(23, 59);
        LocalTime latestClose = LocalTime.of(0, 0);
        
        // Parse all day/hours pairs (columns 2-14)
        for (int i = 2; i < 14; i += 2) {
            if (i + 1 >= values.length) break;
            
            String hours = values[i + 1].trim();
            
            // Skip closed days or empty values
            if (hours.isEmpty() || hours.equalsIgnoreCase("Fermé")) {
                continue;
            }
            
            // Handle 24/7 salons
            if (hours.contains("24h/24") || hours.contains("Ouvert 24")) {
                return new TimeRange(LocalTime.of(0, 0), LocalTime.of(23, 59));
            }
            
            // Parse time ranges (e.g., "09:00 to 19:00" or "10:00 to 12:45, 14:15 to 22:00")
            Pattern timePattern = Pattern.compile("(\\d{2}:\\d{2})\\s+to\\s+(\\d{2}:\\d{2})");
            Matcher matcher = timePattern.matcher(hours);
            
            while (matcher.find()) {
                try {
                    LocalTime open = LocalTime.parse(matcher.group(1));
                    LocalTime close = LocalTime.parse(matcher.group(2));
                    
                    if (open.isBefore(earliestOpen)) {
                        earliestOpen = open;
                    }
                    if (close.isAfter(latestClose)) {
                        latestClose = close;
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse time: {}", hours);
                }
            }
        }
        
        // Default to 9:00-19:00 if no valid times found
        if (earliestOpen.equals(LocalTime.of(23, 59)) || latestClose.equals(LocalTime.of(0, 0))) {
            return new TimeRange(LocalTime.of(9, 0), LocalTime.of(19, 0));
        }
        
        return new TimeRange(earliestOpen, latestClose);
    }

    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        
        return result.toArray(new String[0]);
    }

    private static class TimeRange {
        LocalTime opening;
        LocalTime closing;
        
        TimeRange(LocalTime opening, LocalTime closing) {
            this.opening = opening;
            this.closing = closing;
        }
    }
}
