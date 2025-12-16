package com.drpro.backend.repository;

import com.drpro.backend.model.TreatmentTable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TreatmentTableRepository extends JpaRepository<TreatmentTable, Long> {
    List<TreatmentTable> findByPatientId(Long patientId);
}