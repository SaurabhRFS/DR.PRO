package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "expenses")
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // e.g., "Rent", "Salary", "Equipment"
    private Double amount;
    
    @Column(length = 1000)
    private String notes;
    
    private LocalDate date;
}