package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "dental_records")
public class DentalRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId; 

    private LocalDate date;
    private String treatmentName;
    
    @Column(length = 2000)
    private String notes;
    
    private Double cost;
    
    // File URLs from Cloudinary
    @Column(length = 1000)
    private String prescriptionUrl;
    
    @Column(length = 1000)
    private String additionalFileUrl; // New field for X-Rays
    
    // Original File Names for display
    private String prescriptionFileName;
    private String additionalFileName;
}