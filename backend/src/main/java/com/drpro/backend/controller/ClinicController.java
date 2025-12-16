package com.drpro.backend.controller;

import com.drpro.backend.dto.AppointmentDTO;
import com.drpro.backend.model.*;
import com.drpro.backend.repository.*;
import com.drpro.backend.service.CloudinaryService;
import com.drpro.backend.service.GoogleCalendarService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ClinicController {

    @Autowired private PatientRepository patientRepo;
    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired private DentalRecordRepository dentalRecordRepo;
    @Autowired private CloudinaryService cloudinaryService;
    @Autowired private GoogleCalendarService calendarService;

    // ================= PATIENTS =================

    @GetMapping("/patients")
    public List<Patient> getAllPatients() {
        return patientRepo.findAll();
    }

    @GetMapping("/patients/{id}")
    public Patient getPatient(@PathVariable Long id) {
        return patientRepo.findById(id).orElseThrow();
    }

    @PostMapping(value = "/patients", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Patient addPatient(
            @RequestParam("name") String name,
            @RequestParam("phone") String phone,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar
    ) {
        Patient p = new Patient();
        p.setName(name);
        p.setPhone(phone);

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

    /**
     * Fetch all appointments sorted by Date ASC, Time ASC
     * Includes prescription & additional file URLs
     */
    @GetMapping("/appointments")
    public List<AppointmentDTO> getAppointments() {

        List<Appointment> appointments =
                appointmentRepo.findAllByOrderByDateAscTimeAsc();

        Map<Long, String> patientMap = patientRepo.findAll()
                .stream()
                .collect(Collectors.toMap(Patient::getId, Patient::getName));

        return appointments.stream().map(app -> {
            AppointmentDTO dto = new AppointmentDTO();
            dto.setId(app.getId());
            dto.setPatientId(app.getPatientId());
            dto.setDate(app.getDate());
            dto.setTime(app.getTime());
            dto.setCost(app.getCost());
            dto.setStatus(app.getStatus());
            dto.setNotes(app.getNotes());

            // ✅ NEW
            dto.setPrescriptionUrl(app.getPrescriptionUrl());
            dto.setAdditionalFileUrl(app.getAdditionalFileUrl());

            dto.setPatientName(
                    patientMap.getOrDefault(app.getPatientId(), "Unknown")
            );
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * CREATE Appointment (Multipart)
     */
    @PostMapping(value = "/appointments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Appointment createAppointment(
            @RequestParam("patientId") Long patientId,
            @RequestParam("date") String date,
            @RequestParam(value = "time", required = false) String time,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "cost", required = false) Double cost,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "prescriptionFile", required = false) MultipartFile prescriptionFile,
            @RequestParam(value = "additionalFile", required = false) MultipartFile additionalFile
    ) {
        Appointment app = new Appointment();
        app.setPatientId(patientId);
        app.setDate(LocalDate.parse(date));

        if (time != null && !time.isEmpty()) {
            app.setTime(LocalTime.parse(time));
        }

        app.setNotes(notes);
        app.setCost(cost);
        app.setStatus(status != null ? status : "Scheduled");

        if (prescriptionFile != null && !prescriptionFile.isEmpty()) {
            app.setPrescriptionUrl(cloudinaryService.uploadFile(prescriptionFile));
        }

        if (additionalFile != null && !additionalFile.isEmpty()) {
            app.setAdditionalFileUrl(cloudinaryService.uploadFile(additionalFile));
        }

        Appointment saved = appointmentRepo.save(app);

        // Async Google Calendar Sync
        new Thread(() -> calendarService.createCalendarEvent(saved)).start();

        return saved;
    }

    /**
     * UPDATE Appointment (Multipart)
     */
    @PutMapping(value = "/appointments/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Appointment updateAppointment(
            @PathVariable Long id,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "time", required = false) String time,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "cost", required = false) Double cost,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "prescriptionFile", required = false) MultipartFile prescriptionFile,
            @RequestParam(value = "additionalFile", required = false) MultipartFile additionalFile
    ) {
        Appointment app = appointmentRepo.findById(id).orElseThrow();

        if (date != null) app.setDate(LocalDate.parse(date));
        if (time != null && !time.isEmpty()) app.setTime(LocalTime.parse(time));
        if (notes != null) app.setNotes(notes);
        if (cost != null) app.setCost(cost);
        if (status != null) app.setStatus(status);

        if (prescriptionFile != null && !prescriptionFile.isEmpty()) {
            app.setPrescriptionUrl(cloudinaryService.uploadFile(prescriptionFile));
        }

        if (additionalFile != null && !additionalFile.isEmpty()) {
            app.setAdditionalFileUrl(cloudinaryService.uploadFile(additionalFile));
        }

        return appointmentRepo.save(app);
    }

    @DeleteMapping("/appointments/{id}")
    public void deleteAppointment(@PathVariable Long id) {
        appointmentRepo.deleteById(id);
    }

    // ================= DENTAL RECORDS (LEGACY / SUPPLEMENTAL) =================

    @GetMapping("/dentalrecords")
    public List<DentalRecord> getDentalRecords(
            @RequestParam(required = false) Long patientId
    ) {
        if (patientId != null) {
            return dentalRecordRepo.findByPatientIdOrderByDateDesc(patientId);
        }
        return dentalRecordRepo.findAllByOrderByDateDesc();
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

        if (date != null && !date.isEmpty()) {
            record.setDate(LocalDate.parse(date));
        }

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

    @PutMapping(value = "/dentalrecords/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DentalRecord updateDentalRecord(
            @PathVariable Long id,
            @RequestParam("treatmentName") String treatmentName,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "cost", required = false) Double cost,
            @RequestParam(value = "prescriptionFile", required = false) MultipartFile prescriptionFile,
            @RequestParam(value = "additionalFile", required = false) MultipartFile additionalFile
    ) {
        DentalRecord record = dentalRecordRepo.findById(id).orElseThrow();

        record.setTreatmentName(treatmentName);
        if (notes != null) record.setNotes(notes);
        if (cost != null) record.setCost(cost);
        if (date != null && !date.isEmpty()) record.setDate(LocalDate.parse(date));

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
}