package com.drpro.backend.repository;

import com.drpro.backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    // 1. Find all appointments for a specific patient
    List<Appointment> findByPatientId(Long patientId);

    // 2. Find all appointments sorted by Date and Time (for the main calendar/list)
    List<Appointment> findAllByOrderByDateAscTimeAsc();
}