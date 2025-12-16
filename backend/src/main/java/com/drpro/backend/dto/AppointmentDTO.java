package com.drpro.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class AppointmentDTO {
    private Long id;
    private Long patientId;
    private String patientName;
    private LocalDate date;
    private LocalTime time;
    private String notes;
    private Double cost;
    private String status;
    
    private String prescriptionUrl;
    private String additionalFileUrl;

    // --- Added this field ---
    private List<String> fileUrls;
}