package com.drpro.backend.service;

import com.drpro.backend.model.Appointment;
import com.drpro.backend.model.Patient;
import com.drpro.backend.repository.PatientRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Date;

@Service
public class GoogleCalendarService {

    private static final String APPLICATION_NAME = "DrPro";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    
    // The ID of the calendar to use. "primary" refers to the main calendar of the account 
    // BUT since we are a Service Account, we need the explicit email of the Doctor's calendar 
    // that we shared access with in Step 2.
    // For now, put the DOCTOR'S GMAIL ADDRESS here.
    private static final String CALENDAR_ID = "YOUR_DOCTOR_EMAIL@gmail.com"; 

    @Autowired
    private PatientRepository patientRepo;

    public String createCalendarEvent(Appointment appointment) {
        try {
            // 1. Load Credentials
            InputStream in = GoogleCalendarService.class.getResourceAsStream("/credentials.json");
            if (in == null) {
                throw new RuntimeException("Resource not found: credentials.json");
            }

            GoogleCredential credential = GoogleCredential.fromStream(in)
                    .createScoped(Collections.singleton(CalendarScopes.CALENDAR));

            // 2. Build Calendar Client
            Calendar service = new Calendar.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(), JSON_FACTORY, credential)
                    .setApplicationName(APPLICATION_NAME)
                    .build();

            // 3. Get Patient Name for the Event Title
            String patientName = "Unknown Patient";
            if(appointment.getPatientId() != null) {
                Patient p = patientRepo.findById(appointment.getPatientId()).orElse(null);
                if(p != null) patientName = p.getName();
            }

            // 4. Create the Event
            Event event = new Event()
                    .setSummary("DrPro: " + patientName)
                    .setDescription("Notes: " + appointment.getNotes());

            // 5. Handle Date & Time
            // Combine Date and Time into a LocalDateTime
            LocalDateTime startLdt = LocalDateTime.of(appointment.getDate(), appointment.getTime());
            LocalDateTime endLdt = startLdt.plusMinutes(30); // Default 30 min appointment

            // Convert to Google DateTime (with Timezone)
            DateTime startDateTime = new DateTime(Date.from(startLdt.atZone(ZoneId.systemDefault()).toInstant()));
            DateTime endDateTime = new DateTime(Date.from(endLdt.atZone(ZoneId.systemDefault()).toInstant()));

            event.setStart(new EventDateTime().setDateTime(startDateTime));
            event.setEnd(new EventDateTime().setDateTime(endDateTime));

            // 6. Execute Insert
            Event createdEvent = service.events().insert(CALENDAR_ID, event).execute();
            return createdEvent.getHtmlLink();

        } catch (IOException | GeneralSecurityException e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }
}