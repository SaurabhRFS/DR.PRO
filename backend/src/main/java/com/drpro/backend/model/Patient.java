package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Personal Info
    private String name;
    private LocalDate dob;
    private String phone;
    private String alternatePhone;
    private String email;
    private String gender;

    @Column(length = 1000)
    private String address;

    // Medical Info (Longer text)
    @Column(length = 2000)
    private String medicalHistory;
    
    @Column(length = 2000)
    private String allergies;
    
    @Column(length = 2000)
    private String currentMedications;

    // Image URL (We will store the Cloudinary link here later)
    @Column(length = 1000)
    private String avatarUrl; 
}