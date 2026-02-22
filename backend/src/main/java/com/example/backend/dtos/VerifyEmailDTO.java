package com.example.backend.dtos;

import lombok.Data;

@Data
public class VerifyEmailDTO {
    private String email;
    private String verificationCode;
}
