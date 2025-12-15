import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import PatientPageHeader from '@/components/patient/PatientPageHeader';
import PatientDetailTabs from '@/components/patient/PatientDetailTabs';
import axios from 'axios'; // FIX: Imported Axios

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
      method: 'PUT',
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
  getAppointmentsByPatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/appointments?patientId=${patientId}`);
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },
  getDentalRecords: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/dentalrecords?patientId=${patientId}`);
    if (!response.ok) throw new Error('Failed to fetch dental records');
    return response.json();
  },
  // NOTE: addDentalRecord is handled directly in the component to support Files
  updateDentalRecord: async (recordId, recordData) => {
    const response = await fetch(`${API_BASE_URL}/dentalrecords/${recordId}`, {
      method: 'PUT',
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
      const patientData = await api.getPatient(patientId);
      setPatient(patientData);

      const patientAppointments = await api.getAppointmentsByPatient(patientId);
      setAppointments(patientAppointments);

      const dentalRecordsData = await api.getDentalRecords(patientId);
      setDentalRecords(dentalRecordsData);

    } catch (error) {
      console.error("Error fetching patient detail data:", error);
      toast({ title: "Error", description: "Failed to load patient data.", variant: "destructive" });
      navigate('/patients');
    } finally {
      setIsLoading(false);
    }
  }, [patientId, navigate, toast]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);


  const patientAppointmentHistory = useMemo(() => {
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
    patientAppointmentHistory.forEach(record => uniqueRecords.set(record.id, record));
    (dentalRecords || []).forEach(record => {
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
      toast({ title: "Error", description: "Failed to delete patient.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // FIX: Updated to use Axios and FormData for file uploads
  const handleAddDentalRecord = async (recordData) => {
    try {
      const formData = new FormData();
      formData.append('patientId', patientId);
      formData.append('treatmentName', recordData.treatmentName);
      formData.append('date', recordData.date || new Date().toISOString().split('T')[0]);
      formData.append('notes', recordData.notes || "");
      
      // Append files ONLY if they exist (are not null)
      if (recordData.prescriptionFile) {
        formData.append('prescriptionFile', recordData.prescriptionFile);
      }
      if (recordData.additionalFile) {
        formData.append('additionalFile', recordData.additionalFile);
      }

      // Send to Backend
      const response = await axios.post(`${API_BASE_URL}/dentalrecords`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update State
      setDentalRecords(prev => [response.data, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
      toast({ title: "Success", description: "Dental Record Added with Files" });

    } catch (error) {
      console.error("Error adding dental record:", error);
      toast({ title: "Error", description: "Failed to add record. Check console.", variant: "destructive" });
    }
  };

  const handleEditDentalRecord = async (editedRecord) => {
    if (editedRecord.isFromAppointment) {
      toast({ title: "Cannot Edit", description: "Records from appointments cannot be edited here.", variant: "destructive" });
      return;
    }
    try {
      const recordToSend = { ...editedRecord, patientId: patientId };
      const updatedRecord = await api.updateDentalRecord(editedRecord.id, recordToSend);
      setDentalRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r).sort((a, b) => new Date(b.date) - new Date(a.date)));
      toast({ title: "Dental Record Updated" });
    } catch (error) {
      console.error("Error editing dental record:", error);
      toast({ title: "Error", description: "Failed to update dental record.", variant: "destructive" });
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
      toast({ title: "Record Deleted" });
    } catch (error) {
      console.error("Error deleting dental record:", error);
      toast({ title: "Error", description: "Failed to delete dental record.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen-75"> 
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-xl text-muted-foreground">
          Loading patient data...
        </motion.p>
      </div>
    );
  }

  if (!patient) return null;

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