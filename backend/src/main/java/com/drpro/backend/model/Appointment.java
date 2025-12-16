package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId; 

    private LocalDate date;
    private LocalTime time;
    
    @Column(length = 1000)
    private String notes;
    
    private Double cost;
    
    private String status; 

    // --- NEW: Support for multiple files (Up to 5) ---
    // This creates a separate table to store the list of URLs
    @ElementCollection
    @CollectionTable(name = "appointment_files", joinColumns = @JoinColumn(name = "appointment_id"))
    @Column(name = "file_url", length = 1000)
    private List<String> fileUrls = new ArrayList<>();
    
    // Legacy fields (We keep these so old data doesn't break)
    @Column(length = 1000)
    private String prescriptionUrl;
    
    @Column(length = 1000)
    private String additionalFileUrl;
}