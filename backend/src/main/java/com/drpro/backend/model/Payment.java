package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId; 
    
    private Double amount;
    private String description; 
    private String method;      
    private LocalDate date;
    
    private String status; // <--- I ADDED THIS FIELD (Fixed the error)
    
    @Column(length = 1000)
    private String receiptUrl;  
}