package com.drpro.backend.controller;

import com.drpro.backend.model.*;
import com.drpro.backend.repository.*;
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
    private DentalRecordRepository dentalRecordRepo;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private GoogleCalendarService calendarService;

    @Autowired
    private DoctorProfileRepository profileRepo;

    @Autowired
    private ClinicSettingsRepository clinicRepo;

    // ================= PATIENT ENDPOINTS =================

    @GetMapping("/patients")
    public List<Patient> getAllPatients() {
        return patientRepo.findAll();
    }

    @GetMapping("/patients/{id}")
    public Patient getPatient(@PathVariable Long id) {
        return patientRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
    }

    @PostMapping(value = "/patients", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Patient addPatient(
            @RequestParam("name") String name,
            @RequestParam(value = "dob", required = false) String dob,
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

        if (dob != null && !dob.isEmpty()) {
            p.setDob(LocalDate.parse(dob));
        }

        if (avatar != null && !avatar.isEmpty()) {
            p.setAvatarUrl(cloudinaryService.uploadFile(avatar));
        }

        return patientRepo.save(p);
    }

    @PutMapping(value = "/patients/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Patient updatePatient(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam(value = "dob", required = false) String dob,
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
        Patient p = patientRepo.findById(id).orElseThrow();

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
            p.setAvatarUrl(cloudinaryService.uploadFile(avatar));
        }

        return patientRepo.save(p);
    }

    @DeleteMapping("/patients/{id}")
    public void deletePatient(@PathVariable Long id) {
        patientRepo.deleteById(id);
    }

    // ================= APPOINTMENTS =================

    @GetMapping("/appointments")
    public List<Appointment> getAppointments() {
        return appointmentRepo.findAll();
    }

    @PostMapping("/appointments")
    public Appointment createAppointment(@RequestBody Appointment appointment) {
        Appointment saved = appointmentRepo.save(appointment);

        new Thread(() -> calendarService.createCalendarEvent(saved)).start();

        return saved;
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

    // ================= DENTAL RECORDS (MULTIPART) =================

    @GetMapping("/dentalrecords")
    public List<DentalRecord> getDentalRecords(
            @RequestParam(required = false) Long patientId
    ) {
        if (patientId != null) {
            return dentalRecordRepo.findAll().stream()
                    .filter(r -> r.getPatientId().equals(patientId))
                    .toList();
        }
        return dentalRecordRepo.findAll();
    }

    @PostMapping(value = "/dentalrecords", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DentalRecord addDentalRecord(
            @RequestParam("patientId") Long patientId,
            @RequestParam("treatmentName") String treatmentName,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "cost", required = false) Double cost,
            @RequestParam(value = "prescriptionFile", required = false) MultipartFile prescriptionFile,
            @RequestParam(value = "additionalFile", required = false) MultipartFile additionalFile
    ) {
        DentalRecord record = new DentalRecord();
        record.setPatientId(patientId);
        record.setTreatmentName(treatmentName);
        record.setNotes(notes);
        record.setCost(cost);
        record.setDate(date != null && !date.isEmpty() ? LocalDate.parse(date) : LocalDate.now());

        if (prescriptionFile != null && !prescriptionFile.isEmpty()) {
            record.setPrescriptionUrl(cloudinaryService.uploadFile(prescriptionFile));
            record.setPrescriptionFileName(prescriptionFile.getOriginalFilename());
        }

        if (additionalFile != null && !additionalFile.isEmpty()) {
            record.setAdditionalFileUrl(cloudinaryService.uploadFile(additionalFile));
            record.setAdditionalFileName(additionalFile.getOriginalFilename());
        }

        return dentalRecordRepo.save(record);
    }

    @DeleteMapping("/dentalrecords/{id}")
    public void deleteDentalRecord(@PathVariable Long id) {
        dentalRecordRepo.deleteById(id);
    }

    // ================= PROFILE =================

    @GetMapping("/profile")
    public DoctorProfile getProfile() {
        return profileRepo.findById(1L).orElse(new DoctorProfile());
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DoctorProfile updateProfile(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "clinicName", required = false) String clinicName,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar
    ) {
        DoctorProfile profile = profileRepo.findById(1L).orElse(new DoctorProfile());
        profile.setId(1L);

        if (name != null) profile.setName(name);
        if (email != null) profile.setEmail(email);
        if (phone != null) profile.setPhone(phone);
        if (clinicName != null) profile.setClinicName(clinicName);

        if (avatar != null && !avatar.isEmpty()) {
            profile.setAvatarUrl(cloudinaryService.uploadFile(avatar));
        }

        return profileRepo.save(profile);
    }

    // ================= CLINIC SETTINGS =================

    @GetMapping("/clinic-settings")
    public ClinicSettings getClinicSettings() {
        return clinicRepo.findById(1L).orElse(new ClinicSettings());
    }

    @PutMapping(value = "/clinic-settings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ClinicSettings updateClinicSettings(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "openingHours", required = false) String openingHours,
            @RequestParam(value = "contactInfo", required = false) String contactInfo,
            @RequestParam(value = "logo", required = false) MultipartFile logo
    ) {
        ClinicSettings settings = clinicRepo.findById(1L).orElse(new ClinicSettings());
        settings.setId(1L);

        if (name != null) settings.setName(name);
        if (openingHours != null) settings.setOpeningHours(openingHours);
        if (contactInfo != null) settings.setContactInfo(contactInfo);

        if (logo != null && !logo.isEmpty()) {
            settings.setLogoUrl(cloudinaryService.uploadFile(logo));
        }

        return clinicRepo.save(settings);
    }
}