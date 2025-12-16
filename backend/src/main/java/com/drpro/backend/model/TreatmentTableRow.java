package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@Table(name = "treatment_table_rows")
public class TreatmentTableRow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String notes;
    private Double cost;
    private String status;

    // FIX: Map 'date' to 'treatment_date' to avoid SQL reserved keyword conflict
    @Column(name = "treatment_date") 
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "treatment_table_id")
    @JsonBackReference
    private TreatmentTable treatmentTable;
}