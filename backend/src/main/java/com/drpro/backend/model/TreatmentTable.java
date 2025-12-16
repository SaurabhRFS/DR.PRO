package com.drpro.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonManagedReference; // ✅ Import this
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "treatment_tables")
public class TreatmentTable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;
    private String title;

    @OneToMany(mappedBy = "treatmentTable", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference // ✅ This stops the loop from the Parent side
    private List<TreatmentTableRow> rows = new ArrayList<>();
}