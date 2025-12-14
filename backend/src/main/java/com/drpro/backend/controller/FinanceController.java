package com.drpro.backend.controller;

import com.drpro.backend.model.Expense;
import com.drpro.backend.model.Payment;
import com.drpro.backend.repository.ExpenseRepository;
import com.drpro.backend.repository.PaymentRepository;
import com.drpro.backend.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FinanceController {

    @Autowired
    private PaymentRepository paymentRepo;

    @Autowired
    private ExpenseRepository expenseRepo;

    @Autowired
    private CloudinaryService cloudinaryService;

    // ================= REVENUE (PAYMENTS) =================

    // Matches Frontend: api.getRevenueEntries() -> GET /api/revenue
    @GetMapping("/revenue")
    public List<Payment> getAllPayments() {
        return paymentRepo.findAll();
    }

    // Matches Frontend: api.addRevenueEntry() -> POST /api/revenue (JSON Body)
    @PostMapping(value = "/revenue", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Payment addRevenueJSON(@RequestBody Map<String, Object> payload) {
        Payment p = new Payment();
        
        // Manual mapping from Frontend JSON to Backend Model
        if (payload.get("patientId") != null && !payload.get("patientId").toString().isEmpty()) {
            p.setPatientId(Long.valueOf(payload.get("patientId").toString()));
        }
        p.setAmount(Double.valueOf(payload.get("amount").toString()));
        p.setDescription((String) payload.get("notes")); // Frontend 'notes' -> Backend 'description'
        p.setMethod("Cash"); // Default
        p.setStatus("Paid");
        
        if (payload.get("date") != null) {
            p.setDate(LocalDate.parse(payload.get("date").toString()));
        } else {
            p.setDate(LocalDate.now());
        }

        return paymentRepo.save(p);
    }

    // Legacy/Multipart support (Optional, if you add file upload later)
    @PostMapping(value = "/revenue/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Payment addRevenueMultipart(
            @RequestParam("patientId") Long patientId,
            @RequestParam("amount") Double amount,
            @RequestParam("description") String description,
            @RequestParam(value = "receipt", required = false) MultipartFile receipt
    ) {
        Payment p = new Payment();
        p.setPatientId(patientId);
        p.setAmount(amount);
        p.setDescription(description);
        p.setDate(LocalDate.now());
        p.setStatus("Paid");

        if (receipt != null && !receipt.isEmpty()) {
            String url = cloudinaryService.uploadFile(receipt);
            p.setReceiptUrl(url);
        }
        return paymentRepo.save(p);
    }

    // ================= EXPENSES =================

    // Matches Frontend: api.getExpenseEntries() -> GET /api/expenses
    @GetMapping("/expenses")
    public List<Expense> getAllExpenses() {
        return expenseRepo.findAll();
    }

    // Matches Frontend: api.addExpenseEntry() -> POST /api/expenses (JSON Body)
    @PostMapping("/expenses")
    public Expense addExpense(@RequestBody Expense expense) {
        return expenseRepo.save(expense);
    }

    // ================= DASHBOARD SUMMARY =================

    @GetMapping("/finance/summary")
    public Map<String, Object> getStats() {
        double totalRevenue = paymentRepo.findAll().stream().mapToDouble(Payment::getAmount).sum();
        double totalExpenses = expenseRepo.findAll().stream().mapToDouble(Expense::getAmount).sum();

        Map<String, Object> response = new HashMap<>();
        response.put("totalRevenue", totalRevenue);
        response.put("totalExpenses", totalExpenses);
        response.put("netProfit", totalRevenue - totalExpenses);
        
        return response;
    }
}