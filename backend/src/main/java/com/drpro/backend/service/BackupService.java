package com.drpro.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Date;

@Service
@EnableScheduling
public class BackupService {

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    // e.g. jdbc:mysql://localhost:3306/drpro_db
    @Value("${spring.datasource.url}")
    private String dbUrl; 

    // Added ':unknown' to provide a default value and prevent startup crash
    @Value("${backup.mysqldump-path:unknown}")
    private String dumpPath;

    private Path backupFolder;

    @PostConstruct
    public void init() {
        // 1. Create Backup Folder in your Home Directory
        // On Mac: /Users/Saurabh/DrPro_Data/backups
        String homeDir = System.getProperty("user.home");
        this.backupFolder = Paths.get(homeDir, "DrPro_Data", "backups");
        try {
            Files.createDirectories(this.backupFolder);
            System.out.println("✅ Backup System Initialized at: " + this.backupFolder);
        } catch (Exception e) {
            System.err.println("❌ Could not create backup folder: " + e.getMessage());
        }
    }

    // This runs automatically at 11 PM every night
    @Scheduled(cron = "${backup.schedule}")
    public void performBackup() {
        System.out.println("⏳ Starting Database Backup...");
        
        try {
            // 1. Extract DB Name from URL
            String dbName = dbUrl.substring(dbUrl.lastIndexOf("/") + 1);
            if (dbName.contains("?")) {
                dbName = dbName.substring(0, dbName.indexOf("?"));
            }

            // 2. Generate Filename (e.g. backup_2024-05-20_23-00-00.sql)
            String timeStamp = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date());
            File backupFile = this.backupFolder.resolve("backup_" + timeStamp + ".sql").toFile();

            // 3. Prepare the Command
            // mysqldump -u [user] -p[password] --databases [dbName] -r [filePath]
            ProcessBuilder pb = new ProcessBuilder(
                dumpPath,
                "-u", dbUsername,
                "-p" + dbPassword, // Note: No space between -p and password
                "--databases", dbName,
                "-r", backupFile.getAbsolutePath()
            );

            // 4. Execute
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                System.out.println("✅ Backup SUCCESS! Saved to: " + backupFile.getName());
            } else {
                System.err.println("❌ Backup FAILED. Exit Code: " + exitCode);
            }

        } catch (Exception e) {
            System.err.println("❌ Backup Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // --- TEST METHOD: Runs immediately when server starts (Delete later) ---
    @PostConstruct
    public void runTest() {
        // performBackup(); // <--- UNCOMMENT THIS LINE TO TEST RIGHT NOW
    }
}