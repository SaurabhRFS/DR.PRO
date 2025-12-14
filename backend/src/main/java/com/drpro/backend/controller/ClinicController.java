package com.drpro.backend.controller;

import com.drpro.backend.model.Appointment;
import com.drpro.backend.model.DentalRecord;
import com.drpro.backend.model.Patient;
import com.drpro.backend.repository.AppointmentRepository;
import com.drpro.backend.repository.DentalRecordRepository;
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
public class ClinicController {

    @Autowired
    private PatientRepository patientRepo;
    @Autowired
    private AppointmentRepository appointmentRepo;
    
    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private DentalRecordRepository dentalRecordRepo;
    
    @Autowired
    private GoogleCalendarService calendarService;

    @Autowired
    private com.drpro.backend.repository.DoctorProfileRepository profileRepo;

    @Autowired
    private com.drpro.backend.repository.ClinicSettingsRepository clinicRepo;

    // ================= PATIENT ENDPOINTS =================

    @GetMapping("/patients")
    public List<Patient> getAllPatients() {
        return patientRepo.findAll();
    }

    @GetMapping("/patients/{id}")
    public Patient getPatient(@PathVariable Long id) {
        return patientRepo.findById(id).orElseThrow(() -> new RuntimeException("Patient not found"));
    }

    @PostMapping(value = "/patients", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Patient addPatient(
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
        try {
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

            // Safe Date Parsing
            if (dob != null && !dob.isEmpty()) {
                try {
                    p.setDob(LocalDate.parse(dob));
                } catch (Exception e) {
                    System.err.println("Date Parse Error for value: " + dob);
                    // Use today as fallback or leave null, don't crash
                }
            }

            // Safe Image Upload
            if (avatar != null && !avatar.isEmpty()) {
                try {
                    String imageUrl = cloudinaryService.uploadFile(avatar);
                    p.setAvatarUrl(imageUrl);
                } catch (Exception e) {
                    System.err.println("Image Upload Failed: " + e.getMessage());
                }
            }

            return patientRepo.save(p);
            
        } catch (Exception e) {
            e.printStackTrace(); // Print the REAL error to the backend console
            throw new RuntimeException("Error saving patient: " + e.getMessage());
        }
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

    // Matches Frontend: api.getDentalRecords -> GET /api/dentalrecords?patientId=...
    @GetMapping("/dentalrecords")
    public List<DentalRecord> getDentalRecords(@RequestParam(required = false) Long patientId) {
        if (patientId != null) {
            return dentalRecordRepo.findByPatientId(patientId);
        }
        return dentalRecordRepo.findAll();
    }

    // Matches Frontend: api.addDentalRecord -> POST /api/dentalrecords
    @PostMapping("/dentalrecords")
    public DentalRecord addDentalRecord(@RequestBody DentalRecord record) {
        return dentalRecordRepo.save(record);
    }

    @PutMapping("/dentalrecords/{id}")
    public DentalRecord updateDentalRecord(@PathVariable Long id, @RequestBody DentalRecord details) {
        DentalRecord record = dentalRecordRepo.findById(id).orElseThrow();
        record.setTreatmentName(details.getTreatmentName());
        record.setNotes(details.getNotes());
        record.setCost(details.getCost());
        record.setDate(details.getDate());
        return dentalRecordRepo.save(record);
    }

    @DeleteMapping("/dentalrecords/{id}")
    public void deleteDentalRecord(@PathVariable Long id) {
        dentalRecordRepo.deleteById(id);
    }

    // ================= PROFILE SETTINGS =================

    @GetMapping("/profile")
    public com.drpro.backend.model.DoctorProfile getProfile() {
        // Return existing profile or create a default empty one if it's the first run
        return profileRepo.findById(1L).orElse(new com.drpro.backend.model.DoctorProfile());
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public com.drpro.backend.model.DoctorProfile updateProfile(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "clinicName", required = false) String clinicName,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar
    ) {
        com.drpro.backend.model.DoctorProfile profile = profileRepo.findById(1L)
                .orElse(new com.drpro.backend.model.DoctorProfile());
        
        // Always ensure ID is 1
        profile.setId(1L);

        if (name != null) profile.setName(name);
        if (email != null) profile.setEmail(email);
        if (phone != null) profile.setPhone(phone);
        if (clinicName != null) profile.setClinicName(clinicName);

        if (avatar != null && !avatar.isEmpty()) {
            String url = cloudinaryService.uploadFile(avatar);
            profile.setAvatarUrl(url);
        }

        return profileRepo.save(profile);
    }

    // ================= CLINIC SETTINGS =================

    @GetMapping("/clinic-settings")
    public com.drpro.backend.model.ClinicSettings getClinicSettings() {
        return clinicRepo.findById(1L).orElse(new com.drpro.backend.model.ClinicSettings());
    }

    @PutMapping(value = "/clinic-settings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public com.drpro.backend.model.ClinicSettings updateClinicSettings(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "openingHours", required = false) String openingHours,
            @RequestParam(value = "contactInfo", required = false) String contactInfo,
            @RequestParam(value = "logo", required = false) MultipartFile logo
    ) {
        com.drpro.backend.model.ClinicSettings settings = clinicRepo.findById(1L)
                .orElse(new com.drpro.backend.model.ClinicSettings());
        
        settings.setId(1L);

        if (name != null) settings.setName(name);
        if (openingHours != null) settings.setOpeningHours(openingHours);
        if (contactInfo != null) settings.setContactInfo(contactInfo);

        if (logo != null && !logo.isEmpty()) {
            String url = cloudinaryService.uploadFile(logo);
            settings.setLogoUrl(url);
        }

        return clinicRepo.save(settings);
    }

    

}