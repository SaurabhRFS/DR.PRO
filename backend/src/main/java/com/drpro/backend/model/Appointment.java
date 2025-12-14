package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Links to the Patient Table
    private Long patientId; 

    private LocalDate date;
    private LocalTime time;
    
    @Column(length = 1000)
    private String notes;
    
    private Double cost;
    
    // Values: "Scheduled", "Done", "Cancelled", "Missed"
    private String status; 
}