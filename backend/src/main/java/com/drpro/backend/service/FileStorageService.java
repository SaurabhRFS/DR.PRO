package com.drpro.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Enumeration;
import java.util.UUID;

@Service
public class FileStorageService {

    private Path fileStorageLocation;
    private String cachedIpAddress;

    @PostConstruct
    public void init() {
        try {
            // 1. Setup Storage Folder
            String homeDir = System.getProperty("user.home");
            this.fileStorageLocation = Paths.get(homeDir, "DrPro_Data", "uploads")
                    .toAbsolutePath().normalize();

            Files.createDirectories(this.fileStorageLocation);
            
            // 2. Find the Real LAN IP Address (Once on startup)
            this.cachedIpAddress = getLanIp();
            
            System.out.println("============================================");
            System.out.println("✅ STORAGE READY: " + this.fileStorageLocation);
            System.out.println("🌍 SERVER IP DETECTED: " + this.cachedIpAddress);
            System.out.println("============================================");

        } catch (Exception ex) {
            throw new RuntimeException("Could not create storage directory.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        try {
            // 1. Unique Name
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;

            // 2. Save File
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 3. Generate URL using the Real IP (Not localhost)
            String fileUrl = "http://" + this.cachedIpAddress + ":8080/uploads/" + fileName;
            
            return fileUrl;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file.", ex);
        }
    }

    // --- HELPER: FINDS THE REAL WI-FI / ETHERNET IP ---
    private String getLanIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                // Skip Loopback (127.0.0.1) and inactive interfaces
                if (iface.isLoopback() || !iface.isUp()) continue;

                Enumeration<InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    // We only want IPv4 (e.g., 192.168.1.5)
                    if (addr.isSiteLocalAddress() && !addr.getHostAddress().contains(":")) {
                        return addr.getHostAddress();
                    }
                }
            }
            // Fallback if no Wi-Fi IP found
            return InetAddress.getLocalHost().getHostAddress();
        } catch (Exception e) {
            return "localhost"; // Last resort
        }
    }
}