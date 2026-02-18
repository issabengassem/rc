package com.example.backend.controllers;

import com.example.backend.dtos.ServiceDTO;
import com.example.backend.services.ServiceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "*")
public class ServiceController {

    @Autowired
    private ServiceService serviceService;

    @GetMapping
    public ResponseEntity<List<ServiceDTO>> getAllServices() {
        return ResponseEntity.ok(serviceService.getAllServices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceDTO> getServiceById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceService.getServiceById(id));
    }

    @PostMapping
    public ResponseEntity<ServiceDTO> createService(@Valid @RequestBody ServiceDTO serviceDTO) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceService.createService(serviceDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceDTO> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceDTO serviceDTO) {
        return ResponseEntity.ok(serviceService.updateService(id, serviceDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        serviceService.deleteService(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<List<ServiceDTO>> getServicesBySalon(@PathVariable Long salonId) {
        return ResponseEntity.ok(serviceService.getServicesBySalon(salonId));
    }

    @GetMapping("/price")
    public ResponseEntity<List<ServiceDTO>> getServicesByMaxPrice(@RequestParam Double maxPrice) {
        return ResponseEntity.ok(serviceService.getServicesByMaxPrice(maxPrice));
    }
}
