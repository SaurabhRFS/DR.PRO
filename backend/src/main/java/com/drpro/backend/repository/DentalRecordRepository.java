package com.drpro.backend.repository;

import com.drpro.backend.model.DentalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DentalRecordRepository extends JpaRepository<DentalRecord, Long> {
    // Magic method: Finds by Patient ID and Sorts by Date (Newest/Descending first)
    List<DentalRecord> findByPatientIdOrderByDateDesc(Long patientId);
    
    // Fallback: If we ever need all records sorted
    List<DentalRecord> findAllByOrderByDateDesc();
}