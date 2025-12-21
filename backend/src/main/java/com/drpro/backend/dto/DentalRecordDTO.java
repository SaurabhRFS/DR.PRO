package com.drpro.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class DentalRecordDTO {
    private Long id;
    private Long patientId;
    private LocalDate date;
    private String procedureName;
    private String notes;
    private Double cost;
    private String status;

    // Legacy field (single file)
    private String attachmentUrl;

    // ✅ CRITICAL: The list for multiple images
    private List<String> fileUrls = new ArrayList<>();
}