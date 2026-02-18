package com.example.backend.repositories;
import com.example.backend.entities.Salon;
import com.example.backend.entities.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {

    List<Service> findBySalon(Salon salon);

    List<Service> findBySalonId(Long salonId);

    List<Service> findByPriceLessThanEqual(Double maxPrice);
}
