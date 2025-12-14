package com.drpro.backend.controller;

import com.drpro.backend.model.Payment;
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
@RequestMapping("/api/finance")
@CrossOrigin(origins = "*")
public class FinanceController {

    @Autowired
    private PaymentRepository paymentRepo;

    @Autowired
    private CloudinaryService cloudinaryService;

    // 1. Get Dashboard Stats (Real Calculation)
    @GetMapping("/summary")
    public Map<String, Object> getStats() {
        List<Payment> payments = paymentRepo.findAll();
        
        // Calculate Total Revenue from the database
        double totalRevenue = payments.stream()
                .mapToDouble(Payment::getAmount)
                .sum();

        Map<String, Object> response = new HashMap<>();
        response.put("totalRevenue", totalRevenue);
        response.put("transactionCount", payments.size());
        
        return response;
    }

    // 2. Get Payments for a specific Patient
    @GetMapping("/patient/{patientId}")
    public List<Payment> getPatientPayments(@PathVariable Long patientId) {
        return paymentRepo.findByPatientId(patientId);
    }

    // 3. Add a Payment (With Receipt Upload)
    @PostMapping(value = "/payments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Payment addPayment(
            @RequestParam("patientId") Long patientId,
            @RequestParam("amount") Double amount,
            @RequestParam("method") String method, // Cash, Card, UPI
            @RequestParam("description") String description,
            @RequestParam(value = "receipt", required = false) MultipartFile receipt
    ) {
        Payment p = new Payment();
        p.setPatientId(patientId);
        p.setAmount(amount);
        p.setMethod(method);
        p.setDescription(description);
        p.setDate(LocalDate.now());
        p.setStatus("Paid"); 

        // Upload Image if it exists
        if (receipt != null && !receipt.isEmpty()) {
            String url = cloudinaryService.uploadFile(receipt);
            p.setReceiptUrl(url);
        }

        return paymentRepo.save(p);
    }
}