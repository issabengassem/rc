package com.example.backend.repositories;
import com.example.backend.entities.Appointment;
import com.example.backend.entities.Salon;
import com.example.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByClient(User client);

    List<Appointment> findBySalon(Salon salon);

    List<Appointment> findByStatus(Appointment.AppointmentStatus status);

    List<Appointment> findByClientId(Long clientId);

    List<Appointment> findBySalonId(Long salonId);

    @Query("SELECT a FROM Appointment a WHERE a.salon.id = :salonId " +
            "AND a.appointmentDateTime BETWEEN :startDate AND :endDate")
    List<Appointment> findBySalonIdAndDateRange(
            @Param("salonId") Long salonId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT a FROM Appointment a WHERE a.client.id = :clientId " +
            "AND a.status = :status")
    List<Appointment> findByClientIdAndStatus(
            @Param("clientId") Long clientId,
            @Param("status") Appointment.AppointmentStatus status
    );

    // Find appointments by service ID
    List<Appointment> findByServiceId(Long serviceId);

    // Find appointments by service ID and date range
    @Query("SELECT a FROM Appointment a WHERE a.service.id = :serviceId " +
            "AND a.appointmentDateTime BETWEEN :startDate AND :endDate")
    List<Appointment> findByServiceIdAndDateRange(
            @Param("serviceId") Long serviceId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
