package com.drpro.backend.repository;

import com.drpro.backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    // Magic method: Sorts by Date (Ascending) then Time (Ascending)
    List<Appointment> findAllByOrderByDateAscTimeAsc();
}