package com.example.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "cloudinary.enabled", havingValue = "true")
public class CloudinaryService {

    @Autowired(required = false)
    private Cloudinary cloudinary;

    public String uploadFile(MultipartFile file, String folder) {
        try {
            String publicId = UUID.randomUUID().toString();

            // Upload to Cloudinary
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "public_id", publicId,
                            "resource_type", "auto",
                            "folder", folder
                    ));

            // Return the secure URL
            return (String) uploadResult.get("secure_url");
        } catch (IOException ex) {
            throw new RuntimeException("Could not upload file to Cloudinary: " + ex.getMessage(), ex);
        }
    }

    public void deleteFile(String imageUrl) {
        try {
            if (imageUrl != null && imageUrl.contains("cloudinary.com")) {
                // Extract public_id from URL
                String publicId = extractPublicId(imageUrl);
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
        } catch (IOException ex) {
            throw new RuntimeException("Could not delete file from Cloudinary: " + ex.getMessage(), ex);
        }
    }

    private String extractPublicId(String imageUrl) {
        // Extract public_id from Cloudinary URL
        // Example: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg
        String[] parts = imageUrl.split("/upload/");
        if (parts.length > 1) {
            String pathAfterUpload = parts[1];
            // Remove version number if present (v1234567890/)
            pathAfterUpload = pathAfterUpload.replaceFirst("v\\d+/", "");
            // Remove file extension
            int lastDot = pathAfterUpload.lastIndexOf(".");
            if (lastDot > 0) {
                return pathAfterUpload.substring(0, lastDot);
            }
            return pathAfterUpload;
        }
        return imageUrl;
    }
}
