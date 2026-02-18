package com.example.backend.controllers;

import com.example.backend.dtos.AppointmentDTO;
import com.example.backend.entities.Appointment;
import com.example.backend.services.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<List<AppointmentDTO>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDTO> getAppointmentById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    @PostMapping
    public ResponseEntity<AppointmentDTO> createAppointment(
            @Valid @RequestBody AppointmentDTO appointmentDTO) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createAppointment(appointmentDTO));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentDTO> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestParam Appointment.AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, status));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelAppointment(@PathVariable Long id) {
        appointmentService.cancelAppointment(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<AppointmentDTO>> getAppointmentsByClient(
            @PathVariable Long clientId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByClient(clientId));
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<List<AppointmentDTO>> getAppointmentsBySalon(
            @PathVariable Long salonId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsBySalon(salonId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<AppointmentDTO>> getAppointmentsByStatus(
            @PathVariable Appointment.AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByStatus(status));
    }

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<AppointmentDTO>> getAppointmentsByService(
            @PathVariable Long serviceId,
            @RequestParam(required = false) String date) {
        
        // If date is provided, filter by both service and date
        if (date != null && !date.isEmpty()) {
            return ResponseEntity.ok(appointmentService.getAppointmentsByServiceAndDate(serviceId, date));
        }
        
        // Otherwise, return all appointments for the service
        return ResponseEntity.ok(appointmentService.getAppointmentsByService(serviceId));
    }
}
