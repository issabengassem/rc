package com.example.backend.controllers;

import com.example.backend.services.DataImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DataImportController {

    private final DataImportService dataImportService;

    @PostMapping("/import-salons")
    public ResponseEntity<?> importSalons(
            @RequestParam String csvFilePath,
            @RequestParam Long ownerId) {
        try {
            dataImportService.importSalonsFromCsv(csvFilePath, ownerId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Salons imported successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Import failed: " + e.getMessage()
            ));
        }
    }
}
