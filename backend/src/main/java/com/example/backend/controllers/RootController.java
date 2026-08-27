package com.example.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> info = new HashMap<>();
        info.put("service", "ReserveCut Backend");
        info.put("status", "UP");
        info.put("message", "Backend is running. Use /api/health for health check, /api/salons for salons.");
        info.put("frontend", "http://localhost:3000");
        return ResponseEntity.ok(info);
    }
}
