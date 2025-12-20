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
            String homeDir = System.getProperty("user.home");
            this.fileStorageLocation = Paths.get(homeDir, "DrPro_Data", "uploads")
                    .toAbsolutePath().normalize();

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

            // 2. Copy file to target
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 3. Generate URL using LAN IP Address (Fix for Mobile)
            String hostIp = "localhost";
            try {
                // Tries to get the actual IP address (e.g., 192.168.1.5)
                hostIp = InetAddress.getLocalHost().getHostAddress();
            } catch (Exception e) {
                System.err.println("⚠️ Could not resolve Local Host IP, falling back to localhost");
            }

            // FORCE IP ADDRESS instead of localhost
            // This ensures mobile devices can find the laptop on the network
            String fileUrl = "http://" + hostIp + ":8080/uploads/" + fileName;
            
            return fileUrl;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }
}