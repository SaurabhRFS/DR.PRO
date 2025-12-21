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

    // ✅ NEW: Store multiple file URLs (images, reports, etc.)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "appointment_images",
        joinColumns = @JoinColumn(name = "appointment_id")
    )
    @Column(name = "file_name", length = 1000)
    private List<String> fileUrls = new ArrayList<>();

    // ✅ Legacy fields (keep for backward compatibility)
    @Column(length = 1000)
    private String prescriptionUrl;

    @Column(length = 1000)
    private String additionalFileUrl;
}