package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "clinic_settings")
public class ClinicSettings {
    @Id
    private Long id = 1L;

    private String name;
    private String contactInfo;
    private String openingHours;
    
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String logoUrl;
}