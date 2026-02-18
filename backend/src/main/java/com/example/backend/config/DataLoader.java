package com.example.backend.config;

import com.example.backend.entities.Salon;
import com.example.backend.entities.User;
import com.example.backend.repositories.SalonRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.services.DataImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.data.import.enabled", havingValue = "true", matchIfMissing = false)
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SalonRepository salonRepository;
    private final DataImportService dataImportService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.data.import.csv-path}")
    private String csvPath;

    @Override
    public void run(String... args) throws Exception {
        // Check if salons already exist
        if (salonRepository.count() > 0) {
            log.info("Salons already exist in database. Skipping import.");
            return;
        }

        log.info("Starting data import from: {}", csvPath);

        // Create a default owner for the imported salons
        User owner = userRepository.findByEmail("admin@reservecut.com")
                .orElseGet(() -> {
                    User newOwner = new User();
                    newOwner.setName("Admin Salon");
                    newOwner.setEmail("admin@reservecut.com");
                    newOwner.setPassword(passwordEncoder.encode("admin123"));
                    newOwner.setPhone("+212 6 00 00 00 00");
                    newOwner.setRole(User.UserRole.OWNER);
                    newOwner.setCreatedAt(LocalDateTime.now());
                    return userRepository.save(newOwner);
                });

        log.info("Using owner: {} (ID: {})", owner.getEmail(), owner.getId());

        // Import salons from CSV
        try {
            dataImportService.importSalonsFromCsv(csvPath, owner.getId());
            log.info("✅ Data import completed successfully!");
        } catch (Exception e) {
            log.error("❌ Failed to import data: {}", e.getMessage(), e);
        }
    }
}
