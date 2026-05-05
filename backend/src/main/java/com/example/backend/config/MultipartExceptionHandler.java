package com.example.backend.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class MultipartExceptionHandler {

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, String>> handleMultipartException(MultipartException e) {
        System.err.println("=== MULTIPART EXCEPTION ===");
        System.err.println("Error: " + e.getMessage());
        e.printStackTrace();
        
        Map<String, String> error = new HashMap<>();
        error.put("message", "Multipart error: " + e.getMessage());
        error.put("details", e.toString());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, String>> handleMissingServletRequestPartException(MissingServletRequestPartException e) {
        System.err.println("=== MISSING REQUEST PART ===");
        System.err.println("Error: " + e.getMessage());
        e.printStackTrace();
        
        Map<String, String> error = new HashMap<>();
        error.put("message", "Missing part: " + e.getRequestPartName());
        error.put("details", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

}
