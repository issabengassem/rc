package com.example.backend.controllers;

import com.example.backend.dtos.SalonDTO;
import com.example.backend.services.SalonService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/salons")
@CrossOrigin(origins = "*")
public class SalonController {

    @Autowired
    private SalonService salonService;

    @GetMapping
    public ResponseEntity<List<SalonDTO>> getAllSalons() {
        return ResponseEntity.ok(salonService.getAllSalons());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalonDTO> getSalonById(@PathVariable Long id) {
        return ResponseEntity.ok(salonService.getSalonById(id));
    }

    @PostMapping
    public ResponseEntity<SalonDTO> createSalon(@Valid @RequestBody SalonDTO salonDTO) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(salonService.createSalon(salonDTO));
    }

    // CHANGED: New endpoint to create salon with image in one request
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<SalonDTO> createSalonWithImage(
            @RequestParam("name") @jakarta.validation.constraints.NotBlank(message = "Name is required") String name,
            @RequestParam("address") @jakarta.validation.constraints.NotBlank(message = "Address is required") String address,
            @RequestParam("city") @jakarta.validation.constraints.NotBlank(message = "City is required") String city,
            @RequestParam("phone") @jakarta.validation.constraints.NotBlank(message = "Phone is required") String phone,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("openingTime") @jakarta.validation.constraints.NotBlank(message = "Opening time is required") String openingTime,
            @RequestParam("closingTime") @jakarta.validation.constraints.NotBlank(message = "Closing time is required") String closingTime,
            @RequestParam("ownerId") @jakarta.validation.constraints.NotNull(message = "Owner ID is required") Long ownerId,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image) {

        // Build DTO from form parameters
        SalonDTO salonDTO = new SalonDTO();
        salonDTO.setName(name);
        salonDTO.setAddress(address);
        salonDTO.setCity(city);
        salonDTO.setPhone(phone);
        salonDTO.setDescription(description);
        salonDTO.setOpeningTime(openingTime);
        salonDTO.setClosingTime(closingTime);
        salonDTO.setOwnerId(ownerId);

        // CHANGED: Create salon with image if provided
        SalonDTO createdSalon = salonService.createSalonWithImage(salonDTO, image);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdSalon);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalonDTO> updateSalon(
            @PathVariable Long id,
            @Valid @RequestBody SalonDTO salonDTO) {
        return ResponseEntity.ok(salonService.updateSalon(id, salonDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalon(@PathVariable Long id) {
        salonService.deleteSalon(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<SalonDTO>> getSalonsByCity(@PathVariable String city) {
        return ResponseEntity.ok(salonService.getSalonsByCity(city));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<SalonDTO>> getSalonsByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(salonService.getSalonsByOwner(ownerId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<SalonDTO>> searchSalonsByName(@RequestParam String name) {
        return ResponseEntity.ok(salonService.searchSalonsByName(name));
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<SalonDTO> uploadSalonImage(
            @PathVariable Long id,
            @RequestParam("image") org.springframework.web.multipart.MultipartFile file) {

        // Validate file
        if (file.isEmpty()) {
            throw new RuntimeException("Please select a file to upload");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        // Validate file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("File size must be less than 5MB");
        }

        return ResponseEntity.ok(salonService.uploadSalonImage(id, file));
    }

    @DeleteMapping("/{id}/image")
    public ResponseEntity<Void> deleteSalonImage(@PathVariable Long id) {
        salonService.deleteSalonImage(id);
        return ResponseEntity.noContent().build();
    }
}