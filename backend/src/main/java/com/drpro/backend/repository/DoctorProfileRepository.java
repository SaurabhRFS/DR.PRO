package com.drpro.backend.repository;
import com.drpro.backend.model.DoctorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {}