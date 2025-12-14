package com.drpro.backend.controller;

import com.drpro.backend.model.Appointment;
import com.drpro.backend.model.Patient;
import com.drpro.backend.repository.AppointmentRepository;
import com.drpro.backend.repository.PatientRepository;
import com.drpro.backend.service.CloudinaryService;
import com.drpro.backend.service.GoogleCalendarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allows React to connect
public class ClinicController {

    @Autowired
    private PatientRepository patientRepo;
    @Autowired
    private AppointmentRepository appointmentRepo;
    
    @Autowired
    private CloudinaryService cloudinaryService;
    
    @Autowired
    private GoogleCalendarService calendarService;

    // ================= PATIENT ENDPOINTS =================

    @GetMapping("/patients")
    public List<Patient> getAllPatients() {
        return patientRepo.findAll();
    }

    @GetMapping("/patients/{id}")
    public Patient getPatient(@PathVariable Long id) {
        return patientRepo.findById(id).orElseThrow(() -> new RuntimeException("Patient not found"));
    }

    // --- THE FIXED SAVE METHOD ---
    @PostMapping(value = "/patients", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Patient addPatient(
            @RequestParam("name") String name,
            @RequestParam("dob") String dob, // Comes as String "1990-01-01"
            @RequestParam("phone") String phone,
            @RequestParam(value = "alternatePhone", required = false) String alternatePhone,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "medicalHistory", required = false) String medicalHistory,
            @RequestParam(value = "allergies", required = false) String allergies,
            @RequestParam(value = "currentMedications", required = false) String currentMedications,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar
    ) {
        // Debug Log
        System.out.println("Saving Patient: " + name); 

        Patient p = new Patient();
        p.setName(name);
        p.setPhone(phone);
        p.setAlternatePhone(alternatePhone);
        p.setEmail(email);
        p.setAddress(address);
        p.setGender(gender);
        p.setMedicalHistory(medicalHistory);
        p.setAllergies(allergies);
        p.setCurrentMedications(currentMedications);

        // Fix: Handle Date Parsing safely
        if (dob != null && !dob.isEmpty()) {
            p.setDob(LocalDate.parse(dob));
        }

        // Fix: Handle Image Upload
        if (avatar != null && !avatar.isEmpty()) {
            String imageUrl = cloudinaryService.uploadFile(avatar);
            p.setAvatarUrl(imageUrl);
        }

        return patientRepo.save(p);
    }

    @PutMapping(value = "/patients/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Patient updatePatient(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("dob") String dob,
            @RequestParam("phone") String phone,
            @RequestParam(value = "alternatePhone", required = false) String alternatePhone,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "medicalHistory", required = false) String medicalHistory,
            @RequestParam(value = "allergies", required = false) String allergies,
            @RequestParam(value = "currentMedications", required = false) String currentMedications,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar
    ) {
        Patient p = patientRepo.findById(id).orElseThrow(() -> new RuntimeException("Patient not found"));
        
        p.setName(name);
        p.setPhone(phone);
        p.setAlternatePhone(alternatePhone);
        p.setEmail(email);
        p.setAddress(address);
        p.setGender(gender);
        p.setMedicalHistory(medicalHistory);
        p.setAllergies(allergies);
        p.setCurrentMedications(currentMedications);

        if (dob != null && !dob.isEmpty()) {
            p.setDob(LocalDate.parse(dob));
        }
        
        if (avatar != null && !avatar.isEmpty()) {
            String imageUrl = cloudinaryService.uploadFile(avatar);
            p.setAvatarUrl(imageUrl);
        }

        return patientRepo.save(p);
    }
    
    @DeleteMapping("/patients/{id}")
    public void deletePatient(@PathVariable Long id) {
        patientRepo.deleteById(id);
    }

    // ================= APPOINTMENT ENDPOINTS =================

    @GetMapping("/appointments")
    public List<Appointment> getAllAppointments() {
        return appointmentRepo.findAll();
    }

    @PostMapping("/appointments")
    public Appointment createAppointment(@RequestBody Appointment appointment) {
        Appointment savedApp = appointmentRepo.save(appointment);
        
        // Google Calendar Integration (Runs in background)
        new Thread(() -> {
            calendarService.createCalendarEvent(savedApp);
        }).start();

        return savedApp;
    }

    @PutMapping("/appointments/{id}")
    public Appointment updateAppointment(@PathVariable Long id, @RequestBody Appointment details) {
        Appointment app = appointmentRepo.findById(id).orElseThrow();
        app.setDate(details.getDate());
        app.setTime(details.getTime());
        app.setNotes(details.getNotes());
        app.setCost(details.getCost());
        app.setStatus(details.getStatus());
        return appointmentRepo.save(app);
    }
}