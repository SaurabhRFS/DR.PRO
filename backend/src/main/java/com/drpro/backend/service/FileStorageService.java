package com.drpro.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.InetAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        try {
            // 1. Determine the user's home directory (Cross-Platform)
            // Windows: C:\Users\YourName\DrPro_Data\ uploads
            // Mac/Linux: /Users/YourName/DrPro_Data/uploads
            String homeDir = System.getProperty("user.home");
            
            // 2. Define the target folder
            this.fileStorageLocation = Paths.get(homeDir, "DrPro_Data", "uploads")
                    .toAbsolutePath().normalize();

            // 3. Create the directory if it doesn't exist
            Files.createDirectories(this.fileStorageLocation);
            
            System.out.println("✅ Local Storage Initialized at: " + this.fileStorageLocation);

        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        try {
            // 1. Generate unique file name
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;

            // 2. Copy file to the target location
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 3. Generate the Download URL
            // This grabs your current IP (e.g. 192.168.1.5) so mobile devices can see it
            String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            return baseUrl + "/uploads/" + fileName;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }
}