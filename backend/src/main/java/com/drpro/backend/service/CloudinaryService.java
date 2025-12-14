package com.drpro.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.Map;
import java.util.HashMap;

@Service
public class CloudinaryService {

    // Inject values from application.properties
    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        try {
            // Log to console to verify keys are loading (Hidden partly for security)
            System.out.println("Initializing Cloudinary for Cloud Name: " + cloudName);
            
            Map<String, String> config = new HashMap<>();
            config.put("cloud_name", cloudName);
            config.put("api_key", apiKey);
            config.put("api_secret", apiSecret);
            
            cloudinary = new Cloudinary(config);
        } catch (Exception e) {
            System.err.println("FATAL: Cloudinary configuration failed: " + e.getMessage());
        }
    }

    public String uploadFile(MultipartFile file) {
        try {
            if (cloudinary == null) {
                System.err.println("Cloudinary is null. Check your keys.");
                return "https://placehold.co/400?text=Config+Error";
            }
            
            // Upload to Cloudinary
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return (String) uploadResult.get("url");

        } catch (IOException e) {
            System.err.println("File Upload IO Error: " + e.getMessage());
            return null;
        } catch (Exception e) {
            System.err.println("General Upload Error: " + e.getMessage());
            return "https://placehold.co/400?text=Upload+Failed";
        }
    }
}