package com.example.backend.controllers;

import com.example.backend.dtos.CreateReviewDTO;
import com.example.backend.dtos.ReviewResponseDTO;
import com.example.backend.entities.User;
import com.example.backend.repositories.UserRepository;
import com.example.backend.services.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    /**
     * Create a new review (AUTH REQUIRED)
     */
    @PostMapping
    public ResponseEntity<?> createReview(@Valid @RequestBody CreateReviewDTO dto) {
        try {
            Long userId = getAuthenticatedUserId();
            ReviewResponseDTO review = reviewService.createReview(dto, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(review);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all reviews for a salon (PUBLIC)
     */
    @GetMapping("/salon/{salonId}")
    public ResponseEntity<List<ReviewResponseDTO>> getSalonReviews(@PathVariable Long salonId) {
        List<ReviewResponseDTO> reviews = reviewService.getSalonReviews(salonId);
        return ResponseEntity.ok(reviews);
    }

    /**
     * Get salon rating statistics (PUBLIC)
     */
    @GetMapping("/salon/{salonId}/stats")
    public ResponseEntity<Map<String, Object>> getSalonRatingStats(@PathVariable Long salonId) {
        Map<String, Object> stats = reviewService.getSalonRatingStats(salonId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Delete a review (AUTH REQUIRED - only owner)
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {
        try {
            Long userId = getAuthenticatedUserId();
            reviewService.deleteReview(reviewId, userId);
            return ResponseEntity.ok().body(Map.of("message", "Review deleted successfully"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Check if user has already reviewed a salon (AUTH REQUIRED)
     */
    @GetMapping("/check/{salonId}")
    public ResponseEntity<Map<String, Boolean>> checkIfReviewed(@PathVariable Long salonId) {
        try {
            Long userId = getAuthenticatedUserId();
            boolean hasReviewed = reviewService.hasUserReviewedSalon(userId, salonId);
            return ResponseEntity.ok(Map.of("hasReviewed", hasReviewed));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("hasReviewed", false));
        }
    }

    /**
     * Helper method to get authenticated user ID from JWT token
     */
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return user.getId();
    }
}
