import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react'; // Added Loader2 for loading
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import PatientPageHeader from '@/components/patient/PatientPageHeader';
import PatientDetailTabs from '@/components/patient/PatientDetailTabs';

// --- API Utility ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = {
  getPatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`);
    if (!response.ok) throw new Error('Failed to fetch patient');
    return response.json();
  },
  updatePatient: async (patientId, patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'PUT', // or PATCH depending on your API
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) throw new Error('Failed to update patient');
    return response.json();
  },
  deletePatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete patient');
    return response.status === 204 ? null : response.json();
  },
  // Modified: Assumes your API can filter appointments by patientId
  getAppointmentsByPatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/appointments?patientId=${patientId}`);
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },
  getDentalRecords: async (patientId) => {
    // Assuming dental records are nested under patient or have a patientId filter
    const response = await fetch(`${API_BASE_URL}/dentalrecords?patientId=${patientId}`);
    if (!response.ok) throw new Error('Failed to fetch dental records');
    return response.json();
  },
  addDentalRecord: async (recordData) => {
    const response = await fetch(`${API_BASE_URL}/dentalrecords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData),
    });
    if (!response.ok) throw new Error('Failed to add dental record');
    return response.json();
  },
  updateDentalRecord: async (recordId, recordData) => {
    const response = await fetch(`${API_BASE_URL}/dentalrecords/${recordId}`, {
      method: 'PUT', // or PATCH
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData),
    });
    if (!response.ok) throw new Error('Failed to update dental record');
    return response.json();
  },
  deleteDentalRecord: async (recordId) => {
    const response = await fetch(`${API_BASE_URL}/dentalrecords/${recordId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete dental record');
    return response.status === 204 ? null : response.json();
  },
};
// --- End API Utility ---

const PatientDetailPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [dentalRecords, setDentalRecords] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Fetching from API ---
  const fetchPatientData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch individual patient
      const patientData = await api.getPatient(patientId);
      setPatient(patientData);

      // Changed: Fetch appointments specifically for this patient
      const patientAppointments = await api.getAppointmentsByPatient(patientId);
      setAppointments(patientAppointments);

      // Fetch dental records specifically for this patient
      const dentalRecordsData = await api.getDentalRecords(patientId);
      setDentalRecords(dentalRecordsData);

    } catch (error) {
      console.error("Error fetching patient detail data:", error);
      toast({ title: "Error", description: "Failed to load patient data. Please try again.", variant: "destructive" });
      navigate('/patients'); // Navigate back if patient not found or API error
    } finally {
      setIsLoading(false);
    }
  }, [patientId, navigate, toast]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);


  const patientAppointmentHistory = useMemo(() => {
    // No longer needs filtering by patientId as getAppointmentsByPatient handles it
    return appointments
      .filter(app => ['Done'].includes(app.status))
      .map(app => ({
        id: `app-${app.id}`,
        date: app.date,
        treatmentName: app.notes || 'Treatment from Appointment',
        notes: app.treatmentNotes || `Completed on ${new Date(app.date).toLocaleDateString()}`,
        cost: parseFloat(app.cost) || 0,
        prescriptionFile: app.prescriptionFile,
        prescriptionFileName: app.prescriptionFileName,
        isFromAppointment: true,
      }));
  }, [appointments]);

  const combinedDentalRecords = useMemo(() => {
    const uniqueRecords = new Map();

    // Add records from appointments
    patientAppointmentHistory.forEach(record => uniqueRecords.set(record.id, record));

    // Add manually added dental records, avoiding duplication if an app record has the same ID (unlikely if IDs are distinct prefixes)
    (dentalRecords || []).forEach(record => {
      // Use the actual record ID, not app-${record.id} for manual records
      if (!uniqueRecords.has(record.id)) {
        uniqueRecords.set(record.id, record);
      }
    });
    return Array.from(uniqueRecords.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [dentalRecords, patientAppointmentHistory]);


  const handleDeletePatientConfirm = async () => {
    try {
      await api.deletePatient(patientId);
      toast({
        title: "Patient Deleted",
        description: `${patient?.name}'s record has been permanently removed.`,
        variant: "destructive",
      });
      navigate('/patients');
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({ title: "Error", description: "Failed to delete patient. Please try again.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleAddDentalRecord = async (newRecordData) => {
    try {
      // Ensure patientId is included in the new record data sent to API
      const recordToSend = {
        ...newRecordData,
        patientId: patientId, // Crucial for backend association
        date: newRecordData.date || new Date().toISOString().split('T')[0]
      };
      const addedRecord = await api.addDentalRecord(recordToSend);
      // Update local state with the record returned from the API (which will have the backend-assigned ID)
      setDentalRecords(prev => [addedRecord, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));

      // Update patient's last visit if this record is newer
      if (patient && (!patient.lastVisit || new Date(addedRecord.date) > new Date(patient.lastVisit))) {
        const updatedPatient = { ...patient, lastVisit: addedRecord.date };
        await api.updatePatient(patientId, { lastVisit: updatedPatient.lastVisit }); // Only send what changed
        setPatient(updatedPatient); // Update local patient state
      }
      toast({ title: "Dental Record Added", description: "New treatment record saved." });
    } catch (error) {
      console.error("Error adding dental record:", error);
      toast({ title: "Error", description: "Failed to add dental record. Please try again.", variant: "destructive" });
    }
  };

  const handleEditDentalRecord = async (editedRecord) => {
    if (editedRecord.isFromAppointment) {
      toast({ title: "Cannot Edit", description: "Records from appointments cannot be edited here. Please edit the appointment itself if needed.", variant: "destructive" });
      return;
    }
    try {
      // Ensure patientId is on the record if your update API needs it
      const recordToSend = { ...editedRecord, patientId: patientId };
      const updatedRecord = await api.updateDentalRecord(editedRecord.id, recordToSend);
      setDentalRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r).sort((a, b) => new Date(b.date) - new Date(a.date)));
      toast({ title: "Dental Record Updated", description: "Treatment record updated." });
    } catch (error) {
      console.error("Error editing dental record:", error);
      toast({ title: "Error", description: "Failed to update dental record. Please try again.", variant: "destructive" });
    }
  };

  const handleDeleteDentalRecord = async (recordId) => {
    const recordToDelete = combinedDentalRecords.find(r => r.id === recordId);
    if (recordToDelete && recordToDelete.isFromAppointment) {
      toast({ title: "Cannot Delete", description: "Records from appointments cannot be deleted from here.", variant: "destructive" });
      return;
    }
    try {
      await api.deleteDentalRecord(recordId);
      setDentalRecords(prev => prev.filter(r => r.id !== recordId));
      toast({ title: "Record Deleted", description: "Dental record removed.", variant: "destructive" });
    } catch (error) {
      console.error("Error deleting dental record:", error);
      toast({ title: "Error", description: "Failed to delete dental record. Please try again.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen-75"> {/* Using h-screen-75 for better centering */}
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-muted-foreground"
        >
          Loading patient data...
        </motion.p>
      </div>
    );
  }

  // If patient is null after loading and not found, this handles the case
  if (!patient) {
    return null; // The navigate('/patients') in fetchData handles the redirect
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-8"
    >
      <div className="flex items-center justify-start mb-2">
        <Button variant="outline" onClick={() => navigate(-1)} className="group dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>
      </div>

      <Card className="shadow-xl border-t-4 border-primary overflow-hidden glassmorphic dark:bg-slate-800/70 dark:border-primary">
        <PatientPageHeader
          patient={patient}
          isDeleteDialogOpen={isDeleteDialogOpen}
          onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
          onCloseDeleteDialog={() => setIsDeleteDialogOpen(false)}
          onDeleteConfirm={handleDeletePatientConfirm}
        />

        <PatientDetailTabs
          patient={patient}
          patientId={patientId}
          dentalRecords={combinedDentalRecords}
          onAddDentalRecord={handleAddDentalRecord}
          onEditDentalRecord={handleEditDentalRecord}
          onDeleteDentalRecord={handleDeleteDentalRecord}
        />
      </Card>
    </motion.div>
  );
};

export default PatientDetailPage;