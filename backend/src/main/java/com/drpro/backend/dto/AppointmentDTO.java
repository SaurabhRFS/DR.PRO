package com.drpro.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class AppointmentDTO {

    private Long id;
    private Long patientId;
    private String patientName; // Derived field
    private LocalDate date;
    private LocalTime time;
    private String notes;
    private Double cost;
    private String status;

    // Legacy fields
    private String prescriptionUrl;
    private String additionalFileUrl;

    // ✅ ADD THIS: The missing list!
    private List<String> fileUrls = new ArrayList<>();
}