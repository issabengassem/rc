package com.example.backend.dtos;

import com.example.backend.entities.Appointment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDTO {

    private Long id;

    @NotBlank(message = "Appointment date and time is required")
    private String appointmentDateTime;

    private Appointment.AppointmentStatus status;

    private String notes;

    @NotNull(message = "Client ID is required")
    private Long clientId;

    private String clientName;

    @NotNull(message = "Salon ID is required")
    private Long salonId;

    private String salonName;

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    private String serviceName;

    private Double servicePrice;
}
