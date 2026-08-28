package com.example.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@EnableWebSecurity
@EnableMethodSecurity
@Configuration
public class SecurityConfig {
    @Autowired
    private UserDetailsService userDetailsService;
    @Autowired
    private JwtFilter jwtFilter;
    @Autowired
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${allowed.origins}")
    private String allowedOrigins;

    // ========== CORS CONFIGURATION ==========
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfig = new CorsConfiguration();

        // Allow requests from React frontend (read from environment variable)
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        corsConfig.setAllowedOrigins(origins);

        // Allow all HTTP methods your frontend uses
        corsConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Allow Authorization header for JWT tokens
        corsConfig.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));

        // Required for sending credentials/auth headers
        corsConfig.setAllowCredentials(true);

        // Cache preflight requests for 1 hour
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        return source;
    }

    @Bean
    public AuthenticationProvider authProvider() {
        // DAO = accès aux données (User en DB)
        DaoAuthenticationProvider daoProvider = new DaoAuthenticationProvider(userDetailsService);
        daoProvider.setPasswordEncoder(passwordEncoder);
        return daoProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        return http
                // ✅ ENABLE CORS - This fixes the CORS error!
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth ->
                        auth
                                // Public endpoints - no authentication required
                                .requestMatchers(
                                        "/",
                                        "/error",
                                        "/api/health",
                                        "/api/auth/**",
                                        "/api/users/register", 
                                        "/api/users/login",
                                        "/api/users/verify-email",
                                        "/api/users/resend-code",
                                        "/login/oauth2/code/**",
                                        "/oauth2/**"
                                ).permitAll()
                                .requestMatchers(HttpMethod.GET,
                                        "/api/files/**",
                                        "/api/salons",
                                        "/api/salons/**",
                                        "/api/services",
                                        "/api/services/**",
                                        "/api/reviews/salon/**",
                                        "/api/reviews/check/**"
                                ).permitAll()
                                // All other endpoints require authentication
                                .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .oauth2Login(oauth2 -> oauth2
                    .userInfoEndpoint(userInfo -> userInfo
                        .userService(oauth2UserService()))
                    .successHandler(oAuth2LoginSuccessHandler)
                    .failureHandler((request, response, exception) -> {
                        String frontend = "http://localhost:3000";
                        try {
                            String envFront = System.getenv("FRONTEND_URL");
                            if (envFront != null && !envFront.isBlank()) frontend = envFront;
                        } catch (Exception ignored) {}
                        response.sendRedirect(frontend + "/login?error=google_auth_failed&msg=" + java.net.URLEncoder.encode(exception.getMessage(), java.nio.charset.StandardCharsets.UTF_8));
                    })
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    // AuthenticationManager est le chef d'orchestre de l'authentification.
    // Il ne fait pas l'authentification lui-même.
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService() {
        DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
        return userRequest -> {
            OAuth2User user = delegate.loadUser(userRequest);
            // Here you would typically find or create the user in your database
            // For now, return the user with Google attributes
            return user;
        };
    }
}
