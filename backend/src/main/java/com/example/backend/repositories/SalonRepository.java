package com.example.backend.repositories;

import com.example.backend.entities.Salon;
import com.example.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SalonRepository extends JpaRepository<Salon, Long> {

    List<Salon> findByCity(String city);

    List<Salon> findByOwner(User owner);

    List<Salon> findByNameContainingIgnoreCase(String name);

    // Find salons that offer a specific service
    @Query("SELECT DISTINCT s FROM Salon s JOIN s.services srv WHERE srv.id = :serviceId")
    List<Salon> findByServiceId(@Param("serviceId") Long serviceId);

    // Find salons by service and city
    @Query("SELECT DISTINCT s FROM Salon s JOIN s.services srv WHERE srv.id = :serviceId AND s.city = :city")
    List<Salon> findByServiceIdAndCity(@Param("serviceId") Long serviceId, @Param("city") String city);
}
