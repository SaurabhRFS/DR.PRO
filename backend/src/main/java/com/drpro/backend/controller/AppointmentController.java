package com.drpro.backend.controller;

import com.drpro.backend.dto.AppointmentDTO;
import com.drpro.backend.model.Appointment;
import com.drpro.backend.model.Patient;
import com.drpro.backend.repository.AppointmentRepository;
import com.drpro.backend.repository.PatientRepository;
import com.drpro.backend.service.CloudinaryService;
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
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepo;

    @Autowired
    private PatientRepository patientRepo; // Added for DTO conversion

    @Autowired
    private CloudinaryService cloudinaryService;

    // 1. Get Appointments (Handles BOTH "All" and "By Patient")
    // This fixes the 404 error on PatientsListPage
    @GetMapping
    public List<AppointmentDTO> getAppointments(@RequestParam(required = false) Long patientId) {
        List<Appointment> appointments;

        if (patientId != null) {
            appointments = appointmentRepo.findByPatientId(patientId);
        } else {
            // Fetch all if no patientId provided
            appointments = appointmentRepo.findAllByOrderByDateAscTimeAsc();
        }

        // Convert to DTOs to include Patient Name
        Map<Long, String> patientMap = patientRepo.findAll()
                .stream()
                .collect(Collectors.toMap(Patient::getId, Patient::getName));

        return appointments.stream().map(app -> {
            AppointmentDTO dto = new AppointmentDTO();
            dto.setId(app.getId());
            dto.setPatientId(app.getPatientId());
            dto.setDate(app.getDate());
            dto.setTime(app.getTime());
            dto.setNotes(app.getNotes());
            dto.setCost(app.getCost());
            dto.setStatus(app.getStatus());
            
            // Map Files (Legacy + New List)
            dto.setPrescriptionUrl(app.getPrescriptionUrl());
            dto.setAdditionalFileUrl(app.getAdditionalFileUrl());
            // Note: If you added a 'fileUrls' field to AppointmentDTO, map it here too.
            
            dto.setPatientName(patientMap.getOrDefault(app.getPatientId(), "Unknown"));
            return dto;
        }).collect(Collectors.toList());
    }

    // 2. Create Appointment (Supports up to 5 files)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Appointment createAppointment(
            @RequestParam("patientId") Long patientId,
            @RequestParam("date") String date,
            @RequestParam(value = "time", required = false) String time,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "cost", required = false) Double cost,
            @RequestParam(value = "status", defaultValue = "Scheduled") String status,
            @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) {
        Appointment app = new Appointment();
        app.setPatientId(patientId);
        app.setDate(LocalDate.parse(date));
        if (time != null && !time.isEmpty()) app.setTime(LocalTime.parse(time));
        app.setNotes(notes);
        app.setCost(cost);
        app.setStatus(status);

        // Upload Multiple Files
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                String url = cloudinaryService.uploadFile(file);
                if (url != null) {
                    app.getFileUrls().add(url);
                }
            }
        }

        return appointmentRepo.save(app);
    }

    // 3. Update Appointment
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Appointment updateAppointment(
            @PathVariable Long id,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "time", required = false) String time,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "cost", required = false) Double cost,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) {
        Appointment app = appointmentRepo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));

        if (date != null) app.setDate(LocalDate.parse(date));
        if (time != null && !time.isEmpty()) app.setTime(LocalTime.parse(time));
        if (notes != null) app.setNotes(notes);
        if (cost != null) app.setCost(cost);
        if (status != null) app.setStatus(status);

        // Append new files
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                String url = cloudinaryService.uploadFile(file);
                if (url != null) {
                    app.getFileUrls().add(url);
                }
            }
        }

        return appointmentRepo.save(app);
    }

    // 4. Delete Appointment
    @DeleteMapping("/{id}")
    public void deleteAppointment(@PathVariable Long id) {
        appointmentRepo.deleteById(id);
    }
}