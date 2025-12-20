package com.drpro.backend.repository;

import com.drpro.backend.model.ProcedureItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcedureItemRepository extends JpaRepository<ProcedureItem, Long> {
}