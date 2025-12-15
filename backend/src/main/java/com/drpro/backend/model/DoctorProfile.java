package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "doctor_profile")
public class DoctorProfile {
    @Id
    private Long id = 1L; // Enforce Singleton

    private String name;
    private String email;
    private String phone;
    private String clinicName;
    
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String avatarUrl;
}