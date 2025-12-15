package com.drpro.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentDTO {
    private Long id;
    private Long patientId;
    private String patientName; // The field we were missing!
    private LocalDate date;
    private LocalTime time;
    private String notes;
    private Double cost;
    private String status;
}