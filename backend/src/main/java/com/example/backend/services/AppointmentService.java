package com.example.backend.services;

import com.example.backend.dtos.AppointmentDTO;
import com.example.backend.entities.Appointment;
import com.example.backend.entities.Salon;
import com.example.backend.entities.Service;
import com.example.backend.entities.User;
import com.example.backend.repositories.AppointmentRepository;
import com.example.backend.repositories.SalonRepository;
import com.example.backend.repositories.ServiceRepository;
import com.example.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SalonRepository salonRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    public List<AppointmentDTO> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AppointmentDTO getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + id));
        return convertToDTO(appointment);
    }

    public AppointmentDTO createAppointment(AppointmentDTO appointmentDTO) {
        User client = userRepository.findById(appointmentDTO.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found with id: " + appointmentDTO.getClientId()));

        if (client.getRole() != User.UserRole.CLIENT && client.getRole() != User.UserRole.OWNER) {
            throw new RuntimeException("User cannot create appointments");
        }

        Salon salon = salonRepository.findById(appointmentDTO.getSalonId())
                .orElseThrow(() -> new RuntimeException("Salon not found with id: " + appointmentDTO.getSalonId()));

        Service service = serviceRepository.findById(appointmentDTO.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + appointmentDTO.getServiceId()));

        if (!service.getSalon().getId().equals(salon.getId())) {
            throw new RuntimeException("Service does not belong to the selected salon");
        }

        Appointment appointment = convertToEntity(appointmentDTO, client, salon, service);
        Appointment savedAppointment = appointmentRepository.save(appointment);
        return convertToDTO(savedAppointment);
    }

    public AppointmentDTO updateAppointmentStatus(Long id, Appointment.AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + id));

        appointment.setStatus(status);
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return convertToDTO(updatedAppointment);
    }

    public void cancelAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + id));

        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new RuntimeException("Appointment not found with id: " + id);
        }
        appointmentRepository.deleteById(id);
    }

    public List<AppointmentDTO> getAppointmentsByClient(Long clientId) {
        return appointmentRepository.findByClientId(clientId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getAppointmentsBySalon(Long salonId) {
        return appointmentRepository.findBySalonId(salonId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getAppointmentsByStatus(Appointment.AppointmentStatus status) {
        return appointmentRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getAppointmentsByService(Long serviceId) {
        return appointmentRepository.findByServiceId(serviceId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getAppointmentsByServiceAndDate(Long serviceId, String date) {
        // Parse date string (YYYY-MM-DD) and convert to LocalDateTime for start and end of day
        LocalDate localDate = LocalDate.parse(date);
        LocalDateTime startOfDay = localDate.atStartOfDay();
        LocalDateTime endOfDay = localDate.atTime(23, 59, 59);
        
        return appointmentRepository.findByServiceIdAndDateRange(serviceId, startOfDay, endOfDay).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private AppointmentDTO convertToDTO(Appointment appointment) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setId(appointment.getId());
        dto.setAppointmentDateTime(appointment.getAppointmentDateTime().format(formatter));
        dto.setStatus(appointment.getStatus());
        dto.setNotes(appointment.getNotes());
        dto.setClientId(appointment.getClient().getId());
        dto.setClientName(appointment.getClient().getName());
        dto.setSalonId(appointment.getSalon().getId());
        dto.setSalonName(appointment.getSalon().getName());
        dto.setServiceId(appointment.getService().getId());
        dto.setServiceName(appointment.getService().getName());
        dto.setServicePrice(appointment.getService().getPrice());
        return dto;
    }

    private Appointment convertToEntity(AppointmentDTO dto, User client, Salon salon, Service service) {
        Appointment appointment = new Appointment();
        appointment.setAppointmentDateTime(LocalDateTime.parse(dto.getAppointmentDateTime(), formatter));
        appointment.setNotes(dto.getNotes());
        appointment.setClient(client);
        appointment.setSalon(salon);
        appointment.setService(service);
        return appointment;
    }
}
