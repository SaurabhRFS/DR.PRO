package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "clinic_settings")
public class ClinicSettings {
    @Id
    private Long id = 1L; // Enforce ID=1

    private String name;
    
    @Column(length = 1000)
    private String logoUrl;
    
    @Column(length = 2000)
    private String openingHours;
    
    private String contactInfo;
}