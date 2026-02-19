package com.example.backend.services;

import com.example.backend.dtos.SalonDTO;
import com.example.backend.entities.Salon;
import com.example.backend.entities.User;
import com.example.backend.repositories.SalonRepository;
import com.example.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SalonService {

    @Autowired
    private SalonRepository salonRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public List<SalonDTO> getAllSalons() {
        return salonRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SalonDTO getSalonById(Long id) {
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salon not found with id: " + id));
        return convertToDTO(salon);
    }

    public SalonDTO createSalon(SalonDTO salonDTO) {
        User owner = userRepository.findById(salonDTO.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Owner not found with id: " + salonDTO.getOwnerId()));

        if (owner.getRole() != User.UserRole.OWNER) {
            throw new RuntimeException("User is not an owner");
        }

        Salon salon = convertToEntity(salonDTO, owner);
        Salon savedSalon = salonRepository.save(salon);
        return convertToDTO(savedSalon);
    }

    // CHANGED: New method to create salon with optional image in one operation
    public SalonDTO createSalonWithImage(SalonDTO salonDTO, org.springframework.web.multipart.MultipartFile image) {
        User owner = userRepository.findById(salonDTO.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Owner not found with id: " + salonDTO.getOwnerId()));

        if (owner.getRole() != User.UserRole.OWNER) {
            throw new RuntimeException("User is not an owner");
        }

        Salon salon = convertToEntity(salonDTO, owner);

        // CHANGED: Store image file if provided during creation
        if (image != null && !image.isEmpty()) {
            // Validate file type
            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Only image files are allowed");
            }

            // Validate file size (max 5MB)
            if (image.getSize() > 5 * 1024 * 1024) {
                throw new RuntimeException("File size must be less than 5MB");
            }

            String fileName = fileStorageService.storeFile(image);
            salon.setImagePath(fileName);
        }

        Salon savedSalon = salonRepository.save(salon);
        return convertToDTO(savedSalon);
    }

    public SalonDTO updateSalon(Long id, SalonDTO salonDTO) {
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salon not found with id: " + id));

        salon.setName(salonDTO.getName());
        salon.setAddress(salonDTO.getAddress());
        salon.setCity(salonDTO.getCity());
        salon.setPhone(salonDTO.getPhone());
        salon.setDescription(salonDTO.getDescription());
        salon.setOpeningTime(LocalTime.parse(salonDTO.getOpeningTime()));
        salon.setClosingTime(LocalTime.parse(salonDTO.getClosingTime()));
        salon.setLatitude(salonDTO.getLatitude());
        salon.setLongitude(salonDTO.getLongitude());

        Salon updatedSalon = salonRepository.save(salon);
        return convertToDTO(updatedSalon);
    }

    public void deleteSalon(Long id) {
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salon not found with id: " + id));

        // Delete the image file if exists
        if (salon.getImagePath() != null && !salon.getImagePath().isEmpty()) {
            try {
                fileStorageService.deleteFile(salon.getImagePath());
            } catch (Exception e) {
                System.err.println("Could not delete salon image: " + e.getMessage());
            }
        }

        salonRepository.deleteById(id);
    }

    public List<SalonDTO> getSalonsByCity(String city) {
        return salonRepository.findByCity(city).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SalonDTO> getSalonsByOwner(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found with id: " + ownerId));

        return salonRepository.findByOwner(owner).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SalonDTO> searchSalonsByName(String name) {
        return salonRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SalonDTO> filterSalons(String name, Long serviceId, String city) {
        List<Salon> salons;

        // Apply filters based on what's provided
        if (serviceId != null && city != null && !city.isEmpty()) {
            // Filter by both service and city
            salons = salonRepository.findByServiceIdAndCity(serviceId, city);
        } else if (serviceId != null) {
            // Filter by service only
            salons = salonRepository.findByServiceId(serviceId);
        } else if (city != null && !city.isEmpty()) {
            // Filter by city only
            salons = salonRepository.findByCity(city);
        } else {
            // No service or city filter, get all
            salons = salonRepository.findAll();
        }

        // Apply name filter if provided
        if (name != null && !name.isEmpty()) {
            String lowerName = name.toLowerCase();
            salons = salons.stream()
                    .filter(s -> s.getName().toLowerCase().contains(lowerName))
                    .collect(Collectors.toList());
        }

        return salons.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SalonDTO uploadSalonImage(Long salonId, org.springframework.web.multipart.MultipartFile file) {
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new RuntimeException("Salon not found with id: " + salonId));

        // Delete old image if exists and is a local file (not a URL)
        if (salon.getImagePath() != null && !salon.getImagePath().isEmpty()) {
            if (!salon.getImagePath().startsWith("http://") && !salon.getImagePath().startsWith("https://")) {
                try {
                    fileStorageService.deleteFile(salon.getImagePath());
                } catch (Exception e) {
                    // Log but don't fail if old image deletion fails
                    System.err.println("Could not delete old image: " + e.getMessage());
                }
            }
        }

        // Store new image
        String fileName = fileStorageService.storeFile(file);
        salon.setImagePath(fileName);

        Salon updatedSalon = salonRepository.save(salon);
        return convertToDTO(updatedSalon);
    }

    public void deleteSalonImage(Long salonId) {
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new RuntimeException("Salon not found with id: " + salonId));

        if (salon.getImagePath() != null && !salon.getImagePath().isEmpty()) {
            // Only delete file if it's a local file (not a URL)
            if (!salon.getImagePath().startsWith("http://") && !salon.getImagePath().startsWith("https://")) {
                try {
                    fileStorageService.deleteFile(salon.getImagePath());
                } catch (Exception e) {
                    System.err.println("Could not delete file: " + e.getMessage());
                }
            }
            salon.setImagePath(null);
            salonRepository.save(salon);
        }
    }

    public SalonDTO updateSalonImageUrl(Long salonId, String imageUrl) {
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new RuntimeException("Salon not found with id: " + salonId));

        // Delete old image file if it exists and is not a URL
        if (salon.getImagePath() != null && !salon.getImagePath().isEmpty()) {
            if (!salon.getImagePath().startsWith("http://") && !salon.getImagePath().startsWith("https://")) {
                try {
                    fileStorageService.deleteFile(salon.getImagePath());
                } catch (Exception e) {
                    System.err.println("Could not delete old image: " + e.getMessage());
                }
            }
        }

        // Save the URL directly
        salon.setImagePath(imageUrl);
        Salon updatedSalon = salonRepository.save(salon);
        return convertToDTO(updatedSalon);
    }

    private SalonDTO convertToDTO(Salon salon) {
        SalonDTO dto = new SalonDTO();
        dto.setId(salon.getId());
        dto.setName(salon.getName());
        dto.setAddress(salon.getAddress());
        dto.setCity(salon.getCity());
        dto.setPhone(salon.getPhone());
        dto.setDescription(salon.getDescription());
        dto.setOpeningTime(salon.getOpeningTime().toString());
        dto.setClosingTime(salon.getClosingTime().toString());
        dto.setOwnerId(salon.getOwner().getId());
        dto.setOwnerName(salon.getOwner().getName());
        dto.setImagePath(salon.getImagePath());
        dto.setLatitude(salon.getLatitude());
        dto.setLongitude(salon.getLongitude());
        return dto;
    }

    private Salon convertToEntity(SalonDTO dto, User owner) {
        Salon salon = new Salon();
        salon.setName(dto.getName());
        salon.setAddress(dto.getAddress());
        salon.setCity(dto.getCity());
        salon.setPhone(dto.getPhone());
        salon.setDescription(dto.getDescription());
        salon.setOpeningTime(LocalTime.parse(dto.getOpeningTime()));
        salon.setClosingTime(LocalTime.parse(dto.getClosingTime()));
        salon.setOwner(owner);
        salon.setImagePath(dto.getImagePath());
        salon.setLatitude(dto.getLatitude());
        salon.setLongitude(dto.getLongitude());
        return salon;
    }
}