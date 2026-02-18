package com.example.backend.repositories;

import com.example.backend.entities.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /**
     * Find all reviews for a specific salon, sorted by newest first
     */
    List<Review> findBySalonIdOrderByCreatedAtDesc(Long salonId);

    /**
     * Find a review by user and salon (for checking if user already reviewed)
     */
    Optional<Review> findByUserIdAndSalonId(Long userId, Long salonId);

    /**
     * Check if a user has already reviewed a salon
     */
    boolean existsByUserIdAndSalonId(Long userId, Long salonId);

    /**
     * Calculate average rating for a salon
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.salon.id = :salonId")
    Double calculateAverageRatingBySalonId(@Param("salonId") Long salonId);

    /**
     * Count total reviews for a salon
     */
    long countBySalonId(Long salonId);
}
