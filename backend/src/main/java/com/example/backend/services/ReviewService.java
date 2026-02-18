package com.example.backend.services;

import com.example.backend.dtos.CreateReviewDTO;
import com.example.backend.dtos.ReviewResponseDTO;
import com.example.backend.entities.Review;
import com.example.backend.entities.Salon;
import com.example.backend.entities.User;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.repositories.ReviewRepository;
import com.example.backend.repositories.SalonRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final SalonRepository salonRepository;

    /**
     * Create a new review
     */
    @Transactional
    public ReviewResponseDTO createReview(CreateReviewDTO dto, Long userId) {
        // Check if user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if salon exists
        Salon salon = salonRepository.findById(dto.getSalonId())
                .orElseThrow(() -> new ResourceNotFoundException("Salon not found"));

        // Check if user already reviewed this salon
        if (reviewRepository.existsByUserIdAndSalonId(userId, dto.getSalonId())) {
            throw new IllegalStateException("You have already reviewed this salon");
        }

        // Create review
        Review review = new Review();
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setUser(user);
        review.setSalon(salon);

        Review savedReview = reviewRepository.save(review);

        return mapToDTO(savedReview);
    }

    /**
     * Get all reviews for a salon
     */
    @Transactional(readOnly = true)
    public List<ReviewResponseDTO> getSalonReviews(Long salonId) {
        // Check if salon exists
        if (!salonRepository.existsById(salonId)) {
            throw new ResourceNotFoundException("Salon not found");
        }

        List<Review> reviews = reviewRepository.findBySalonIdOrderByCreatedAtDesc(salonId);
        return reviews.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get salon rating statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSalonRatingStats(Long salonId) {
        // Check if salon exists
        if (!salonRepository.existsById(salonId)) {
            throw new ResourceNotFoundException("Salon not found");
        }

        Double averageRating = reviewRepository.calculateAverageRatingBySalonId(salonId);
        long totalReviews = reviewRepository.countBySalonId(salonId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("averageRating", averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0);
        stats.put("totalReviews", totalReviews);

        return stats;
    }

    /**
     * Delete a review (only by owner or admin)
     */
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        // Check if user owns this review
        if (!review.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You can only delete your own reviews");
        }

        reviewRepository.delete(review);
    }

    /**
     * Check if user has already reviewed a salon
     */
    @Transactional(readOnly = true)
    public boolean hasUserReviewedSalon(Long userId, Long salonId) {
        return reviewRepository.existsByUserIdAndSalonId(userId, salonId);
    }

    /**
     * Map Review entity to DTO
     */
    private ReviewResponseDTO mapToDTO(Review review) {
        ReviewResponseDTO dto = new ReviewResponseDTO();
        dto.setId(review.getId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUserName(review.getUser().getName());
        dto.setUserId(review.getUser().getId());
        dto.setSalonId(review.getSalon().getId());
        return dto;
    }
}
