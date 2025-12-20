package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "procedure_items")
public class ProcedureItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description; // e.g., "X-Ray", "Extraction"
    private Double price;       // e.g., 500.0
}