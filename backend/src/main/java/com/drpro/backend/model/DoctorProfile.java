package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "doctor_profile")
public class DoctorProfile {
    @Id
    private Long id = 1L; // We enforce ID=1 so there is only ever ONE profile

    private String name;
    private String email;
    private String phone;
    private String clinicName;
    
    @Column(length = 1000)
    private String avatarUrl;
}