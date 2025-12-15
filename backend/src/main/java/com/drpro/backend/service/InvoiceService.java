package com.drpro.backend.service;

import com.drpro.backend.model.ClinicSettings;
import com.drpro.backend.model.Patient;
import com.drpro.backend.model.Payment;
import com.drpro.backend.repository.ClinicSettingsRepository;
import com.drpro.backend.repository.PatientRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

@Service
public class InvoiceService {

    @Autowired
    private PatientRepository patientRepo;

    @Autowired
    private ClinicSettingsRepository clinicRepo;

    public ByteArrayInputStream generateInvoice(Payment payment) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. Fetch Data
            Patient patient = patientRepo.findById(payment.getPatientId()).orElse(new Patient());
            ClinicSettings clinic = clinicRepo.findById(1L).orElse(new ClinicSettings());
            String clinicName = clinic.getName() != null ? clinic.getName() : "Dr. Pro Clinic";

            // 2. Header (Clinic Name)
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
            Paragraph header = new Paragraph(clinicName, headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);
            document.add(Chunk.NEWLINE);

            // 3. Invoice Details Table
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            
            addRows(table, "Invoice #", "INV-" + payment.getId());
            addRows(table, "Date", payment.getDate().toString());
            addRows(table, "Patient Name", patient.getName());
            addRows(table, "Patient Phone", patient.getPhone());
            addRows(table, "Payment Method", payment.getMethod());
            
            document.add(table);
            document.add(Chunk.NEWLINE);

            // 4. Line Items (The Bill)
            PdfPTable billTable = new PdfPTable(2);
            billTable.setWidthPercentage(100);
            billTable.setWidths(new int[]{3, 1}); // Description is wider

            // Header Row
            PdfPCell descHeader = new PdfPCell(new Phrase("Description"));
            descHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
            descHeader.setPadding(5);
            billTable.addCell(descHeader);

            PdfPCell amountHeader = new PdfPCell(new Phrase("Amount"));
            amountHeader.setBackgroundColor(BaseColor.LIGHT_GRAY);
            amountHeader.setPadding(5);
            billTable.addCell(amountHeader);

            // Data Row
            billTable.addCell(payment.getDescription() != null ? payment.getDescription() : "Medical Services");
            billTable.addCell("Rs. " + payment.getAmount());

            // Total Row
            PdfPCell totalLabel = new PdfPCell(new Phrase("Total Paid"));
            totalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalLabel.setPadding(5);
            billTable.addCell(totalLabel);

            PdfPCell totalValue = new PdfPCell(new Phrase("Rs. " + payment.getAmount(), FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
            totalValue.setPadding(5);
            billTable.addCell(totalValue);

            document.add(billTable);

            // 5. Footer
            document.add(Chunk.NEWLINE);
            Paragraph footer = new Paragraph("Thank you for choosing " + clinicName + "!", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();

        } catch (DocumentException ex) {
            ex.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private void addRows(PdfPTable table, String label, String value) {
        PdfPCell cell1 = new PdfPCell(new Phrase(label));
        cell1.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell1);

        PdfPCell cell2 = new PdfPCell(new Phrase(value != null ? value : "-"));
        cell2.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell2);
    }
}