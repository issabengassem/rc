package com.example.backend.controllers;

import com.example.backend.services.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.time.Duration;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @GetMapping("/salons/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Path filePath = fileStorageService.loadFile(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Try to determine file's content type
                String contentType = null;
                try {
                    contentType = java.nio.file.Files.probeContentType(filePath);
                } catch (IOException ex) {
                    contentType = "application/octet-stream";
                }

                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("File not found: " + fileName);
            }
        } catch (Exception ex) {
            throw new RuntimeException("Error loading file: " + fileName, ex);
        }
    }

    @GetMapping("/external-image")
    public ResponseEntity<byte[]> proxyExternalImage(@RequestParam String url) {
        try {
            URI uri = URI.create(url);
            validateExternalImageUri(uri);

            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(12))
                    .header("User-Agent", "ReserveCut/1.0 (+https://reservecut.com)")
                    .header("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            int statusCode = response.statusCode();
            if (statusCode < 200 || statusCode >= 300) {
                throw new RuntimeException("External image returned status " + statusCode);
            }

            String contentType = response.headers()
                    .firstValue("content-type")
                    .orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE);

            if (!contentType.toLowerCase().startsWith("image/")) {
                throw new RuntimeException("External URL is not an image");
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .cacheControl(org.springframework.http.CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                    .body(response.body());
        } catch (Exception ex) {
            throw new RuntimeException("Error loading external image", ex);
        }
    }

    private void validateExternalImageUri(URI uri) {
        String scheme = uri.getScheme();
        String host = uri.getHost();

        if (scheme == null || host == null || !scheme.equalsIgnoreCase("https")) {
            throw new RuntimeException("Only HTTPS image URLs are allowed");
        }

        String normalizedHost = host.toLowerCase();
        boolean isGoogleusercontent = normalizedHost.equals("lh3.googleusercontent.com")
                || normalizedHost.endsWith(".googleusercontent.com");

        if (!isGoogleusercontent) {
            throw new RuntimeException("External image host is not allowed");
        }
    }
}
