package com.example.backend.config;

import com.example.backend.dtos.AuthResponseDto;
import com.example.backend.entities.User;
import com.example.backend.services.JwtService;
import com.example.backend.services.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtService jwtService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public OAuth2LoginSuccessHandler(@Lazy UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        // Fallback for different providers
        if (email == null) {
            email = oAuth2User.getAttribute("emailAddress");
        }
        if (name == null) {
            name = oAuth2User.getAttribute("given_name");
            String family = oAuth2User.getAttribute("family_name");
            if (name != null && family != null) {
                name = name + " " + family;
            }
        }
        String googleId = oAuth2User.getAttribute("sub");

        if (email == null) {
            // Cannot proceed without email - redirect to frontend with error
            String errorUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/login")
                    .queryParam("error", "google_email_missing")
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
            return;
        }

        User user = userService.processOAuthUser(email, name, googleId);
        AuthResponseDto authResponse = userService.createOAuthResponse(user);

        // Build redirect URL with token and user info for frontend to store
        String userJson = String.format("{\"id\":%d,\"name\":\"%s\",\"email\":\"%s\",\"role\":\"%s\"}",
                authResponse.getUser().getId(),
                escapeJson(authResponse.getUser().getName()),
                escapeJson(authResponse.getUser().getEmail()),
                authResponse.getUser().getRole().name());

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/callback")
                .queryParam("token", authResponse.getAccessToken())
                .queryParam("user", URLEncoder.encode(userJson, StandardCharsets.UTF_8))
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\"", "\\\"");
    }
}
