package com.drpro.backend.controller;

import com.drpro.backend.model.DentalRecord;
import com.drpro.backend.repository.DentalRecordRepository;
import com.drpro.backend.service.CloudinaryService;
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
    private DentalRecordRepository dentalRecordRepo;

    @Autowired
    private CloudinaryService cloudinaryService;

    // ==================================================================
    // NOTE: Patient & Appointment endpoints have been moved to:
    // 1. PatientController.java
    // 2. AppointmentController.java
    // This prevents "Ambiguous mapping" errors.
    // ==================================================================

    // ================= DENTAL RECORDS =================

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