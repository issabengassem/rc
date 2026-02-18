package com.example.backend.services;

import com.example.backend.dtos.ServiceDTO;
import com.example.backend.entities.Salon;
import com.example.backend.entities.Service;
import com.example.backend.repositories.SalonRepository;
import com.example.backend.repositories.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class ServiceService {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private SalonRepository salonRepository;

    public List<ServiceDTO> getAllServices() {
        return serviceRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ServiceDTO getServiceById(Long id) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));
        return convertToDTO(service);
    }

    public ServiceDTO createService(ServiceDTO serviceDTO) {
        Salon salon = salonRepository.findById(serviceDTO.getSalonId())
                .orElseThrow(() -> new RuntimeException("Salon not found with id: " + serviceDTO.getSalonId()));

        Service service = convertToEntity(serviceDTO, salon);
        Service savedService = serviceRepository.save(service);
        return convertToDTO(savedService);
    }

    public ServiceDTO updateService(Long id, ServiceDTO serviceDTO) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        service.setName(serviceDTO.getName());
        service.setDescription(serviceDTO.getDescription());
        service.setPrice(serviceDTO.getPrice());
        service.setDurationMinutes(serviceDTO.getDurationMinutes());

        Service updatedService = serviceRepository.save(service);
        return convertToDTO(updatedService);
    }

    public void deleteService(Long id) {
        if (!serviceRepository.existsById(id)) {
            throw new RuntimeException("Service not found with id: " + id);
        }
        serviceRepository.deleteById(id);
    }

    public List<ServiceDTO> getServicesBySalon(Long salonId) {
        return serviceRepository.findBySalonId(salonId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ServiceDTO> getServicesByMaxPrice(Double maxPrice) {
        return serviceRepository.findByPriceLessThanEqual(maxPrice).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private ServiceDTO convertToDTO(Service service) {
        ServiceDTO dto = new ServiceDTO();
        dto.setId(service.getId());
        dto.setName(service.getName());
        dto.setDescription(service.getDescription());
        dto.setPrice(service.getPrice());
        dto.setDurationMinutes(service.getDurationMinutes());
        dto.setSalonId(service.getSalon().getId());
        dto.setSalonName(service.getSalon().getName());
        return dto;
    }

    private Service convertToEntity(ServiceDTO dto, Salon salon) {
        Service service = new Service();
        service.setName(dto.getName());
        service.setDescription(dto.getDescription());
        service.setPrice(dto.getPrice());
        service.setDurationMinutes(dto.getDurationMinutes());
        service.setSalon(salon);
        return service;
    }
}
