package com.drpro.backend.repository;

import com.drpro.backend.model.DentalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DentalRecordRepository extends JpaRepository<DentalRecord, Long> {
    List<DentalRecord> findByPatientId(Long patientId);
}