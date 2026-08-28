package com.example.backend.controllers;

import com.example.backend.dtos.AuthResponseDto;
import com.example.backend.entities.User;
import com.example.backend.services.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    @Value("${spring.security.oauth2.client.registration.google.client-id:553267498033-e0j2h01ouk14hp43mbg7bt248i162ns3.apps.googleusercontent.com}")
    private String googleClientId;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/google")
    public ResponseEntity<?> googleAuthInfo() {
        // Inform frontend where to redirect for OAuth2 code flow
        return ResponseEntity.ok(Map.of(
                "authorizationUrl", "/oauth2/authorization/google",
                "message", "Redirect to /oauth2/authorization/google for Google OAuth2 code flow",
                "alternative", "POST /api/auth/google with {\"idToken\": \"...\"} for ID token flow"
        ));
    }

    /**
     * Google ID Token flow (for frontend Google Identity Services)
     * Frontend obtains ID token from Google Sign-In and sends it here.
     * Backend verifies token with Google and returns app JWT.
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleIdTokenLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isBlank()) {
            idToken = body.get("credential");
        }
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "idToken or credential is required"));
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            ResponseEntity<Map> googleResponse = restTemplate.getForEntity(url, Map.class);

            if (!googleResponse.getStatusCode().is2xxSuccessful() || googleResponse.getBody() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Google token"));
            }

            Map<String, Object> payload = googleResponse.getBody();
            String aud = (String) payload.get("aud");
            String email = (String) payload.get("email");
            String name = (String) payload.get("name");
            String sub = (String) payload.get("sub");
            Object emailVerifiedObj = payload.get("email_verified");

            // Verify audience matches our client ID
            if (aud == null || !aud.equals(googleClientId)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token audience mismatch"));
            }

            if (email == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Google token has no email"));
            }

            // Optional: check email_verified
            if (emailVerifiedObj != null && "false".equalsIgnoreCase(emailVerifiedObj.toString())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Google email not verified"));
            }

            User user = userService.processOAuthUser(email, name != null ? name : email, sub);
            AuthResponseDto authResponse = userService.createOAuthResponse(user);
            return ResponseEntity.ok(authResponse);

        } catch (Exception e) {
            // Token invalid or Google unreachable
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Google token verification failed",
                    "message", e.getMessage()
            ));
        }
    }
}
