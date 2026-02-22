package com.example.backend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.verification.email-from:ReserveCut <noreply@reservecut.com>}")
    private String emailFrom;

    public void sendVerificationEmail(String toEmail, String verificationCode) {
        try {
            System.out.println("==============================================");
            System.out.println("         SENDING VERIFICATION EMAIL");
            System.out.println("==============================================");
            System.out.println("To: " + toEmail);
            System.out.println("Code: " + verificationCode);
            System.out.println("From: " + emailFrom);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(emailFrom);
            message.setTo(toEmail);
            message.setSubject("Verify Your ReserveCut Account");
            message.setText(buildVerificationEmailBody(verificationCode));

            mailSender.send(message);
            
            System.out.println("✅ EMAIL SENT SUCCESSFULLY!");
            System.out.println("==============================================");
        } catch (Exception e) {
            System.err.println("==============================================");
            System.err.println("         ❌ EMAIL SENDING FAILED!");
            System.err.println("==============================================");
            System.err.println("Error: " + e.getClass().getName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("==============================================");
            // Don't throw exception - allow registration to complete
        }
    }

    private String buildVerificationEmailBody(String code) {
        return String.format(
            "Welcome to ReserveCut!\n\n" +
            "Your verification code is: %s\n\n" +
            "This code will expire in 10 minutes.\n\n" +
            "If you didn't request this verification, please ignore this email.\n\n" +
            "Best regards,\n" +
            "The ReserveCut Team",
            code
        );
    }

    public void sendPasswordResetEmail(String toEmail, String resetCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(emailFrom);
        message.setTo(toEmail);
        message.setSubject("Reset Your ReserveCut Password");
        message.setText(buildPasswordResetEmailBody(resetCode));

        mailSender.send(message);
    }

    private String buildPasswordResetEmailBody(String code) {
        return String.format(
            "Password Reset Request\n\n" +
            "Your password reset code is: %s\n\n" +
            "This code will expire in 10 minutes.\n\n" +
            "If you didn't request a password reset, please ignore this email.\n\n" +
            "Best regards,\n" +
            "The ReserveCut Team",
            code
        );
    }
}
