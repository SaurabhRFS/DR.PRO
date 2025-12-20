package com.drpro.backend.controller;

import com.drpro.backend.model.ClinicSettings;
import com.drpro.backend.model.DoctorProfile;
import com.drpro.backend.repository.ClinicSettingsRepository;
import com.drpro.backend.repository.DoctorProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

@RestController
@RequestMapping("/api")
// @CrossOrigin(origins = "http://localhost:5173") // Allow React
public class ProfileController {

    @Autowired
    private DoctorProfileRepository profileRepo;

    @Autowired
    private ClinicSettingsRepository clinicRepo;

    // --- DOCTOR PROFILE ---
    @GetMapping("/profile")
    public DoctorProfile getProfile() {
        return profileRepo.findById(1L).orElseGet(() -> {
            DoctorProfile p = new DoctorProfile();
            p.setId(1L);
            p.setName("Dr. User");
            p.setEmail("doctor@example.com");
            return profileRepo.save(p);
        });
    }

    @PutMapping("/profile")
    public DoctorProfile updateProfile(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("clinicName") String clinicName,
            @RequestParam(value = "avatar", required = false) MultipartFile avatarFile
    ) throws IOException {
        
        DoctorProfile profile = profileRepo.findById(1L).orElse(new DoctorProfile());
        profile.setId(1L);
        profile.setName(name);
        profile.setEmail(email);
        profile.setPhone(phone);
        profile.setClinicName(clinicName);

        if (avatarFile != null && !avatarFile.isEmpty()) {
            String base64 = "data:image/jpeg;base64," + 
                Base64.getEncoder().encodeToString(avatarFile.getBytes());
            profile.setAvatarUrl(base64);
        }

        return profileRepo.save(profile);
    }

    // --- CLINIC SETTINGS ---
    @GetMapping("/clinic-settings")
    public ClinicSettings getClinicSettings() {
        return clinicRepo.findById(1L).orElseGet(() -> {
            ClinicSettings s = new ClinicSettings();
            s.setId(1L);
            s.setName("My Clinic");
            return clinicRepo.save(s);
        });
    }

    @PutMapping("/clinic-settings")
    public ClinicSettings updateClinicSettings(
            @RequestParam("name") String name,
            @RequestParam("contactInfo") String contactInfo,
            @RequestParam("openingHours") String openingHours,
            @RequestParam(value = "logo", required = false) MultipartFile logoFile
    ) throws IOException {

        ClinicSettings settings = clinicRepo.findById(1L).orElse(new ClinicSettings());
        settings.setId(1L);
        settings.setName(name);
        settings.setContactInfo(contactInfo);
        settings.setOpeningHours(openingHours);

        if (logoFile != null && !logoFile.isEmpty()) {
            String base64 = "data:image/jpeg;base64," + 
                Base64.getEncoder().encodeToString(logoFile.getBytes());
            settings.setLogoUrl(base64);
        }

        return clinicRepo.save(settings);
    }
}