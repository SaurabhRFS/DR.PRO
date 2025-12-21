package com.drpro.backend.controller;

import com.drpro.backend.dto.AppointmentDTO;
import com.drpro.backend.model.Appointment;
import com.drpro.backend.model.Patient;
import com.drpro.backend.repository.AppointmentRepository;
import com.drpro.backend.repository.PatientRepository;
import com.drpro.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepo;

    @Autowired
    private PatientRepository patientRepo;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping
    public List<AppointmentDTO> getAppointments(@RequestParam(required = false) Long patientId) {
        List<Appointment> appointments;
        if (patientId != null) {
            appointments = appointmentRepo.findByPatientId(patientId);
        } else {
            appointments = appointmentRepo.findAllByOrderByDateAscTimeAsc();
        }
        Map<Long, String> patientMap = patientRepo.findAll().stream().collect(Collectors.toMap(Patient::getId, Patient::getName));
        
        return appointments.stream().map(app -> {
            AppointmentDTO dto = new AppointmentDTO();
            dto.setId(app.getId());
            dto.setPatientId(app.getPatientId());
            dto.setDate(app.getDate());
            dto.setTime(app.getTime());
            dto.setNotes(app.getNotes());
            dto.setCost(app.getCost());
            dto.setStatus(app.getStatus());
            
            // Return BOTH legacy and new file lists
            dto.setPrescriptionUrl(app.getPrescriptionUrl());
            dto.setAdditionalFileUrl(app.getAdditionalFileUrl());
            
            // Ensure we never return null for the list
            
            // Inside AppointmentController.java -> getAppointments method
            // Change this line:
            dto.setFileUrls(app.getFileUrls() != null ? new ArrayList<>(app.getFileUrls()) : new ArrayList<>());
            dto.setPatientName(patientMap.getOrDefault(app.getPatientId(), "Unknown"));
            return dto;
            
        }).collect(Collectors.toList());
    }

    // ==========================================
    // CREATE (POST)
    // ==========================================
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Appointment createAppointment(
            @RequestParam("patientId") Long patientId,
            @RequestParam("date") String date,
            @RequestParam(value = "time", required = false) String time,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "cost", required = false) Double cost,
            @RequestParam(value = "status", defaultValue = "Scheduled") String status,
            @RequestParam(value = "prescriptionFile", required = false) MultipartFile prescriptionFile,
            @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) {
        System.out.println(">>> CREATING APPOINTMENT");
        if(files != null) System.out.println(">>> Files Received: " + files.size());
        
        Appointment app = new Appointment();
        app.setPatientId(patientId);
        app.setDate(LocalDate.parse(date));
        if (time != null && !time.isEmpty()) app.setTime(LocalTime.parse(time));
        app.setNotes(notes);
        app.setCost(cost);
        app.setStatus(status);

        // 1. Prescription
        if (prescriptionFile != null && !prescriptionFile.isEmpty()) {
            String fileName = fileStorageService.storeFile(prescriptionFile);
            app.setPrescriptionUrl(fileName);
        }

        // 2. Multiple X-Rays
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                String fileName = fileStorageService.storeFile(file);
                if (fileName != null) {
                    app.getFileUrls().add(fileName);
                }
            }
        }
        return appointmentRepo.save(app);
    }

    // ==========================================
    // UPDATE (PUT)
    // ==========================================
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Appointment updateAppointment(
            @PathVariable Long id,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "time", required = false) String time,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "cost", required = false) Double cost,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "prescriptionFile", required = false) MultipartFile prescriptionFile,
            @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) {
        System.out.println(">>> UPDATING APPOINTMENT ID: " + id);
        if(files != null) System.out.println(">>> New Files Received: " + files.size());

        Appointment app = appointmentRepo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        
        if (date != null) app.setDate(LocalDate.parse(date));
        if (time != null && !time.isEmpty()) app.setTime(LocalTime.parse(time));
        if (notes != null) app.setNotes(notes);
        if (cost != null) app.setCost(cost);
        if (status != null) app.setStatus(status);

        // 1. Update Prescription (Overwrites old one)
        if (prescriptionFile != null && !prescriptionFile.isEmpty()) {
            String fileName = fileStorageService.storeFile(prescriptionFile);
            app.setPrescriptionUrl(fileName);
        }

        // 2. Append New X-Rays (Adds to existing list)
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                String fileName = fileStorageService.storeFile(file);
                if (fileName != null) {
                    app.getFileUrls().add(fileName);
                }
            }
        }
        return appointmentRepo.save(app);
    }

    @DeleteMapping("/{id}")
    public void deleteAppointment(@PathVariable Long id) {
        appointmentRepo.deleteById(id);
    }
}















// package com.drpro.backend.controller;

// import com.drpro.backend.dto.AppointmentDTO;
// import com.drpro.backend.model.Appointment;
// import com.drpro.backend.model.Patient;
// import com.drpro.backend.repository.AppointmentRepository;
// import com.drpro.backend.repository.PatientRepository;
// import com.drpro.backend.service.FileStorageService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.MediaType;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;

// import java.time.LocalDate;
// import java.time.LocalTime;
// import java.util.List;
// import java.util.Map;
// import java.util.stream.Collectors;

// @RestController
// @RequestMapping("/api/appointments")
// // Allow BOTH localhost ports (React often switches between 3000 and 5173)
// // @CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
// public class AppointmentController {

//     @Autowired
//     private AppointmentRepository appointmentRepo;

//     @Autowired
//     private PatientRepository patientRepo;

//     @Autowired
//     private FileStorageService fileStorageService;

//     @GetMapping
//     public List<AppointmentDTO> getAppointments(@RequestParam(required = false) Long patientId) {
//         List<Appointment> appointments;
//         if (patientId != null) {
//             appointments = appointmentRepo.findByPatientId(patientId);
//         } else {
//             appointments = appointmentRepo.findAllByOrderByDateAscTimeAsc();
//         }
//         Map<Long, String> patientMap = patientRepo.findAll().stream().collect(Collectors.toMap(Patient::getId, Patient::getName));
        
//         return appointments.stream().map(app -> {
//             AppointmentDTO dto = new AppointmentDTO();
//             dto.setId(app.getId());
//             dto.setPatientId(app.getPatientId());
//             dto.setDate(app.getDate());
//             dto.setTime(app.getTime());
//             dto.setNotes(app.getNotes());
//             dto.setCost(app.getCost());
//             dto.setStatus(app.getStatus());
            
//             // Return the filenames so the Frontend can build the full URL
//             dto.setPrescriptionUrl(app.getPrescriptionUrl());
//             dto.setAdditionalFileUrl(app.getAdditionalFileUrl());
//             dto.setFileUrls(app.getFileUrls());
            
//             dto.setPatientName(patientMap.getOrDefault(app.getPatientId(), "Unknown"));
//             return dto;
//         }).collect(Collectors.toList());
//     }

//     // ==========================================
//     // CREATE (POST)
//     // ==========================================
//     @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//     public Appointment createAppointment(
//             @RequestParam("patientId") Long patientId,
//             @RequestParam("date") String date,
//             @RequestParam(value = "time", required = false) String time,
//             @RequestParam(value = "notes", required = false) String notes,
//             @RequestParam(value = "cost", required = false) Double cost,
//             @RequestParam(value = "status", defaultValue = "Scheduled") String status,
//             // 1. CATCH THE PRESCRIPTION FILE
//             @RequestParam(value = "prescriptionFile", required = false) MultipartFile prescriptionFile,
//             // 2. CATCH THE X-RAY FILES
//             @RequestParam(value = "files", required = false) List<MultipartFile> files
//     ) {
//         if (cost != null && cost < 0) throw new RuntimeException("Cost cannot be negative.");

//         Appointment app = new Appointment();
//         app.setPatientId(patientId);
//         app.setDate(LocalDate.parse(date));
//         if (time != null && !time.isEmpty()) app.setTime(LocalTime.parse(time));
//         app.setNotes(notes);
//         app.setCost(cost);
//         app.setStatus(status);

//         // --- SAVE PRESCRIPTION (Single File) ---
//         if (prescriptionFile != null && !prescriptionFile.isEmpty()) {
//             String fileName = fileStorageService.storeFile(prescriptionFile);
//             app.setPrescriptionUrl(fileName); // Saves just the filename (e.g., "scan.jpg")
//         }

//         // --- SAVE X-RAYS (Multiple Files) ---
//         if (files != null && !files.isEmpty()) {
//             for (MultipartFile file : files) {
//                 String fileName = fileStorageService.storeFile(file);
//                 if (fileName != null) {
//                     app.getFileUrls().add(fileName);
//                 }
//             }
//         }
//         return appointmentRepo.save(app);
//     }

//     // ==========================================
//     // UPDATE (PUT)
//     // ==========================================
//     @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//     public Appointment updateAppointment(
//             @PathVariable Long id,
//             @RequestParam(value = "date", required = false) String date,
//             @RequestParam(value = "time", required = false) String time,
//             @RequestParam(value = "notes", required = false) String notes,
//             @RequestParam(value = "cost", required = false) Double cost,
//             @RequestParam(value = "status", required = false) String status,
//             // 1. CATCH THE PRESCRIPTION FILE
//             @RequestParam(value = "prescriptionFile", required = false) MultipartFile prescriptionFile,
//             // 2. CATCH THE X-RAY FILES
//             @RequestParam(value = "files", required = false) List<MultipartFile> files
//     ) {
//         if (cost != null && cost < 0) throw new RuntimeException("Cost cannot be negative.");

//         Appointment app = appointmentRepo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        
//         if (date != null) app.setDate(LocalDate.parse(date));
//         if (time != null && !time.isEmpty()) app.setTime(LocalTime.parse(time));
//         if (notes != null) app.setNotes(notes);
//         if (cost != null) app.setCost(cost);
//         if (status != null) app.setStatus(status);

//         // --- SAVE PRESCRIPTION (Single File) ---
//         if (prescriptionFile != null && !prescriptionFile.isEmpty()) {
//             String fileName = fileStorageService.storeFile(prescriptionFile);
//             app.setPrescriptionUrl(fileName); // Overwrites old prescription
//         }

//         // --- SAVE X-RAYS (Multiple Files) ---
//         if (files != null && !files.isEmpty()) {
//             for (MultipartFile file : files) {
//                 String fileName = fileStorageService.storeFile(file);
//                 if (fileName != null) {
//                     app.getFileUrls().add(fileName);
//                 }
//             }
//         }
//         return appointmentRepo.save(app);
//     }

//     @DeleteMapping("/{id}")
//     public void deleteAppointment(@PathVariable Long id) {
//         appointmentRepo.deleteById(id);
//     }
// }