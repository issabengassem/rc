package com.example.backend.controllers;

import com.example.backend.dtos.*;
import com.example.backend.entities.User;
import com.example.backend.services.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserRegisterDTO userRegisterDTO) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.createUser(userRegisterDTO));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDTO userLoginDTO) {
        try {
            AuthResponseDto responseDto = userService.loginLogic(userLoginDTO);

            if (responseDto != null) {
                return ResponseEntity.ok(responseDto);
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(
                            ErrorResponseDto.builder()
                                    .status(401)
                                    .error("UNAUTHORIZED")
                                    .message("email ou password incorrect")
                                    .build()
                    );
        } catch (RuntimeException e) {
            // Handle email not verified error
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(
                            ErrorResponseDto.builder()
                                    .status(403)
                                    .error("EMAIL_NOT_VERIFIED")
                                    .message(e.getMessage())
                                    .build()
                    );
        }
    }

    // Email Verification Endpoints
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody VerifyEmailDTO verifyEmailDTO) {
        try {
            boolean verified = userService.verifyEmail(verifyEmailDTO.getEmail(), verifyEmailDTO.getVerificationCode());
            return ResponseEntity.ok(new MessageResponse("Email verified successfully! You can now login."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(
                            ErrorResponseDto.builder()
                                    .status(400)
                                    .error("VERIFICATION_FAILED")
                                    .message(e.getMessage())
                                    .build()
                    );
        }
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendVerificationCode(@RequestBody ResendCodeDTO resendCodeDTO) {
        try {
            userService.resendVerificationCode(resendCodeDTO.getEmail());
            return ResponseEntity.ok(new MessageResponse("Verification code sent successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(
                            ErrorResponseDto.builder()
                                    .status(400)
                                    .error("RESEND_FAILED")
                                    .message(e.getMessage())
                                    .build()
                    );
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(userService.updateUser(id, userDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable User.UserRole role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }
}
