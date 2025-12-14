package com.drpro.backend.repository;

import com.drpro.backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // Finds all payments for a specific patient
    List<Payment> findByPatientId(Long patientId);
}