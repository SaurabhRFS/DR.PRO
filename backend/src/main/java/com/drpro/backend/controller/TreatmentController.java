package com.drpro.backend.controller;

import com.drpro.backend.model.TreatmentTable;
import com.drpro.backend.model.TreatmentTableRow;
import com.drpro.backend.repository.TreatmentTableRepository;
import com.drpro.backend.repository.TreatmentTableRowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/treatments")
@CrossOrigin(origins = "*")
public class TreatmentController {

    @Autowired
    private TreatmentTableRepository tableRepo;

    @Autowired
    private TreatmentTableRowRepository rowRepo;

    // Get all tables for a patient
    @GetMapping
    public List<TreatmentTable> getTables(@RequestParam Long patientId) {
        return tableRepo.findByPatientId(patientId);
    }

    // Create a new Table
    @PostMapping
    public TreatmentTable createTable(@RequestBody TreatmentTable table) {
        return tableRepo.save(table);
    }

    // Delete a Table
    @DeleteMapping("/{id}")
    public void deleteTable(@PathVariable Long id) {
        tableRepo.deleteById(id);
    }

    // Add a Row to a Table
    @PostMapping("/{tableId}/rows")
    public TreatmentTableRow addRow(@PathVariable Long tableId, @RequestBody TreatmentTableRow row) {
        TreatmentTable table = tableRepo.findById(tableId).orElseThrow();
        row.setTreatmentTable(table);
        if (row.getDate() == null) row.setDate(LocalDate.now());
        return rowRepo.save(row);
    }

    // Update a Row
    @PutMapping("/rows/{rowId}")
    public TreatmentTableRow updateRow(@PathVariable Long rowId, @RequestBody TreatmentTableRow updated) {
        TreatmentTableRow row = rowRepo.findById(rowId).orElseThrow();
        if(updated.getNotes() != null) row.setNotes(updated.getNotes());
        if(updated.getCost() != null) row.setCost(updated.getCost());
        if(updated.getStatus() != null) row.setStatus(updated.getStatus());
        if(updated.getDate() != null) row.setDate(updated.getDate());
        return rowRepo.save(row);
    }

    // Delete a Row
    @DeleteMapping("/rows/{rowId}")
    public void deleteRow(@PathVariable Long rowId) {
        rowRepo.deleteById(rowId);
    }
}