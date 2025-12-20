package com.drpro.backend.controller;

import com.drpro.backend.model.Patient;
import com.drpro.backend.repository.PatientRepository;
import com.drpro.backend.service.FileStorageService; // CHANGED
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
// @CrossOrigin(origins = "http://localhost:3000") // <--- ADD THIS LINE
public class PatientController {

    @Autowired
    private PatientRepository patientRepo;

    @Autowired
    private FileStorageService fileStorageService; // CHANGED

    @GetMapping
    public List<Patient> getAllPatients(@RequestParam(required = false) String query) {
        return patientRepo.findAll();
    }

    @GetMapping("/{id}")
    public Patient getPatient(@PathVariable Long id) {
        return patientRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found with id " + id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Patient createPatient(
            @RequestParam("name") String name,
            @RequestParam("phone") String phone,
            @RequestParam("gender") String gender,
            @RequestParam(value = "dob", required = false) String dob,
            @RequestParam(value = "alternatePhone", required = false) String alternatePhone,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "medicalHistory", required = false) String medicalHistory,
            @RequestParam(value = "allergies", required = false) String allergies,
            @RequestParam(value = "currentMedications", required = false) String currentMedications,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar
    ) {
        Patient p = new Patient();
        p.setName(name);
        p.setPhone(phone);
        p.setGender(gender);
        if (dob != null && !dob.isEmpty()) p.setDob(LocalDate.parse(dob));
        p.setAlternatePhone(alternatePhone);
        p.setEmail(email);
        p.setAddress(address);
        p.setMedicalHistory(medicalHistory);
        p.setAllergies(allergies);
        p.setCurrentMedications(currentMedications);

        // --- CHANGED: Use Local Storage ---
        if (avatar != null && !avatar.isEmpty()) {
            String url = fileStorageService.storeFile(avatar);
            if (url != null) p.setAvatarUrl(url);
        }

        return patientRepo.save(p);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Patient updatePatient(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("phone") String phone,
            @RequestParam("gender") String gender,
            @RequestParam(value = "dob", required = false) String dob,
            @RequestParam(value = "alternatePhone", required = false) String alternatePhone,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "medicalHistory", required = false) String medicalHistory,
            @RequestParam(value = "allergies", required = false) String allergies,
            @RequestParam(value = "currentMedications", required = false) String currentMedications,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar
    ) {
        return patientRepo.findById(id)
                .map(p -> {
                    p.setName(name);
                    p.setPhone(phone);
                    p.setGender(gender);
                    if (dob != null && !dob.isEmpty()) p.setDob(LocalDate.parse(dob));
                    p.setAlternatePhone(alternatePhone);
                    p.setEmail(email);
                    p.setAddress(address);
                    p.setMedicalHistory(medicalHistory);
                    p.setAllergies(allergies);
                    p.setCurrentMedications(currentMedications);

                    // --- CHANGED: Use Local Storage ---
                    if (avatar != null && !avatar.isEmpty()) {
                        String url = fileStorageService.storeFile(avatar);
                        if (url != null) p.setAvatarUrl(url);
                    }

                    return patientRepo.save(p);
                })
                .orElseThrow(() -> new RuntimeException("Patient not found with id " + id));
    }

    @DeleteMapping("/{id}")
    public void deletePatient(@PathVariable Long id) {
        patientRepo.deleteById(id);
    }
}