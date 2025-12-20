package com.drpro.backend.controller;

import com.drpro.backend.model.ProcedureItem;
import com.drpro.backend.repository.ProcedureItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/procedures")
// REMOVED @CrossOrigin to fix the "allowCredentials" conflict
public class ProcedureItemController {

    @Autowired
    private ProcedureItemRepository repository;

    @GetMapping
    public List<ProcedureItem> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ProcedureItem create(@RequestBody ProcedureItem item) {
        return repository.save(item);
    }

    @PutMapping("/{id}")
    public ProcedureItem update(@PathVariable Long id, @RequestBody ProcedureItem updatedItem) {
        return repository.findById(id).map(item -> {
            item.setDescription(updatedItem.getDescription());
            item.setPrice(updatedItem.getPrice());
            return repository.save(item);
        }).orElseThrow(() -> new RuntimeException("Item not found"));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}