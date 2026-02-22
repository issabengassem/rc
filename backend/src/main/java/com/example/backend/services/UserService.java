package com.example.backend.services;

import com.example.backend.dtos.AuthResponseDto;
import com.example.backend.dtos.UserDTO;
import com.example.backend.dtos.UserLoginDTO;
import com.example.backend.dtos.UserRegisterDTO;
import com.example.backend.entities.User;
import com.example.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${app.verification.code-expiry-minutes:10}")
    private int codeExpiryMinutes;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    public UserService(UserRepository userRepository, 
                      PasswordEncoder passwordEncoder,
                      JwtService jwtService,
                      AuthenticationManager authenticationManager,
                      EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToDTO(user);
    }

    public UserDTO createUser(UserRegisterDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email already exists: " + userDTO.getEmail());
        }
        User user = convertToEntity(userDTO);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setEmailVerified(false); // Set email as not verified
        
        // Generate and send verification code
        String verificationCode = generateVerificationCode();
        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(codeExpiryMinutes));
        
        User savedUser = userRepository.save(user);
        
        // Send verification email
        try {
            emailService.sendVerificationEmail(user.getEmail(), verificationCode);
        } catch (Exception e) {
            System.err.println("Failed to send verification email: " + e.getMessage());
            // Don't fail registration if email fails, user can resend
        }
        
        return convertToDTO(savedUser);
    }

    public AuthResponseDto loginLogic(UserLoginDTO userLoginDTO) {
        User user = userRepository.findByEmailIgnoreCase(userLoginDTO.getEmail());
        if (user == null) {
            System.out.println("user not found with email: "+ userLoginDTO.getEmail());
            return null;
        }
        
        // Check if email is verified
        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email first. Check your inbox for the verification code.");
        }
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            userLoginDTO.getEmail(),
                            userLoginDTO.getPassword()
                    )
            );

            return AuthResponseDto.builder()
                    .accessToken(jwtService.generateToken(user.getEmail(), user.getRole()))
                    .user(UserDTO.builder()
                            .id(user.getId())
                            .name(user.getName())
                            .email(user.getEmail())
                            .phone(user.getPhone())
                            .createdAt(user.getCreatedAt().toString())
                            .role(user.getRole())
                            .build())
                    .build();
        } catch (AuthenticationException e) {
            System.out.println("auth failed: "+ e.getMessage());
        }
        return null;
    }


    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setName(userDTO.getName());
        user.setEmail(userDTO.getEmail());
        user.setPhone(userDTO.getPhone());
        user.setRole(userDTO.getRole());

        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    public List<UserDTO> getUsersByRole(User.UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt().format(formatter));
        return dto;
    }

    private User convertToEntity(UserRegisterDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setPhone(dto.getPhone());
        user.setRole(dto.getRole());
        return user;
    }
    
    // ==================== VERIFICATION METHODS ====================
    
    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // Generates 6-digit number
        return String.valueOf(code);
    }
    
    public boolean verifyEmail(String email, String code) {
        User user = userRepository.findByEmailIgnoreCase(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        
        if (user.isEmailVerified()) {
            throw new RuntimeException("Email already verified");
        }
        
        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            throw new RuntimeException("Invalid verification code");
        }
        
        if (user.getVerificationCodeExpiry() == null || LocalDateTime.now().isAfter(user.getVerificationCodeExpiry())) {
            throw new RuntimeException("Verification code has expired. Please request a new one.");
        }
        
        // Verification successful
        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);
        
        return true;
    }
    
    public void resendVerificationCode(String email) {
        User user = userRepository.findByEmailIgnoreCase(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        
        if (user.isEmailVerified()) {
            throw new RuntimeException("Email already verified");
        }
        
        // Generate new code
        String verificationCode = generateVerificationCode();
        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(codeExpiryMinutes));
        userRepository.save(user);
        
        // Send email
        try {
            emailService.sendVerificationEmail(user.getEmail(), verificationCode);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }
    }
}
