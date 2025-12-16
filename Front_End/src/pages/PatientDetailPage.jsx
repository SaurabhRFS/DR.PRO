import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import PatientPageHeader from '@/components/patient/PatientPageHeader';
import PatientDetailTabs from '@/components/patient/PatientDetailTabs';
import axios from 'axios'; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const parseUniversalDate = (dateInput) => {
  if (!dateInput) return new Date(0);
  if (Array.isArray(dateInput)) {
    const [year, month, day] = dateInput;
    return new Date(year, month - 1, day);
  }
  return new Date(dateInput);
};

const api = {
  getPatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`);
    if (!response.ok) throw new Error('Failed to fetch patient');
    return response.json();
  },
  deletePatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete patient');
    const text = await response.text();
    return text ? JSON.parse(text) : null;
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
  deleteDentalRecord: async (recordId) => {
    const response = await fetch(`${API_BASE_URL}/dentalrecords/${recordId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete dental record');
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },
  deleteAppointment: async (appointmentId) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete appointment');
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
};

const PatientDetailPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [dentalRecords, setDentalRecords] = useState([]);
  
  const [isPatientDeleteDialogOpen, setIsPatientDeleteDialogOpen] = useState(false);
  const [isRecordDeleteDialogOpen, setIsRecordDeleteDialogOpen] = useState(false);
  const [recordIdToDelete, setRecordIdToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      .map(app => ({
        id: `app-${app.id}`, 
        date: app.date,
        treatmentName: app.notes || 'General Appointment',
        notes: app.notes,
        cost: parseFloat(app.cost) || 0,
        status: app.status, 
        time: app.time,     
        patientId: app.patientId,
        patientName: patient?.name || "Current Patient",
        prescriptionUrl: app.prescriptionUrl,
        additionalFileUrl: app.additionalFileUrl,
        isFromAppointment: true,
      }));
  }, [appointments, patient]);

  const combinedDentalRecords = useMemo(() => {
    const uniqueRecords = new Map();
    patientAppointmentHistory.forEach(record => uniqueRecords.set(record.id, record));
    (dentalRecords || []).forEach(record => uniqueRecords.set(record.id, record));
    return Array.from(uniqueRecords.values()).sort((a, b) => {
        const dateA = parseUniversalDate(a.date).getTime();
        const dateB = parseUniversalDate(b.date).getTime();
        return dateB - dateA; 
    });
  }, [dentalRecords, patientAppointmentHistory]);

  const handleDeletePatientConfirm = async () => {
    try {
      await api.deletePatient(patientId);
      toast({ title: "Patient Deleted", description: "Record removed.", variant: "destructive" });
      navigate('/patients');
    } catch (error) {
      console.error("Error deleting patient:", error);
    } finally {
      setIsPatientDeleteDialogOpen(false);
    }
  };

  const handleAddDentalRecord = async (recordData) => { 
     try {
        const formData = new FormData();
        formData.append('patientId', patientId);
        // Fallback for treatmentName if using appointment form
        formData.append('treatmentName', recordData.treatmentName || recordData.notes || "Dental Visit");
        formData.append('date', recordData.date);
        formData.append('notes', recordData.notes || "");
        formData.append('cost', recordData.cost || 0);
        if (recordData.prescriptionFile) formData.append('prescriptionFile', recordData.prescriptionFile);
        if (recordData.additionalFile) formData.append('additionalFile', recordData.additionalFile);
        
        const response = await axios.post(`${API_BASE_URL}/dentalrecords`, formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
        setDentalRecords(prev => [response.data, ...prev]);
        toast({ title: "Record Added" });
     } catch(e) { console.error(e); }
  };

  const handleEditDentalRecord = async (editedRecord) => {
    try {
      const recordIdStr = String(editedRecord.id);
      
      if (recordIdStr.startsWith('app-')) {
         const realId = recordIdStr.replace('app-', '');
         
         const formData = new FormData();
         formData.append('patientId', patientId);
         formData.append('date', editedRecord.date);
         if(editedRecord.time) formData.append('time', editedRecord.time);
         formData.append('status', editedRecord.status || "Done");
         formData.append('notes', editedRecord.notes || editedRecord.treatmentName);
         formData.append('cost', editedRecord.cost || 0);
         if (editedRecord.prescriptionFile) formData.append('prescriptionFile', editedRecord.prescriptionFile);
         if (editedRecord.additionalFile) formData.append('additionalFile', editedRecord.additionalFile);

         const response = await axios.put(`${API_BASE_URL}/appointments/${realId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
         });
         setAppointments(prev => prev.map(app => app.id == realId ? response.data : app));
         toast({ title: "Appointment Updated" });
      } else {
         const formData = new FormData();
         formData.append('patientId', patientId);
         // FIX: Fallback to notes if treatmentName is undefined
         formData.append('treatmentName', editedRecord.treatmentName || editedRecord.notes || "Dental Visit");
         formData.append('date', editedRecord.date);
         formData.append('notes', editedRecord.notes || "");
         formData.append('cost', editedRecord.cost || 0);
         
         if (editedRecord.prescriptionFile) formData.append('prescriptionFile', editedRecord.prescriptionFile);
         if (editedRecord.additionalFile) formData.append('additionalFile', editedRecord.additionalFile);

         // FIX: Added headers here
         const response = await axios.put(`${API_BASE_URL}/dentalrecords/${editedRecord.id}`, formData, {
             headers: { 'Content-Type': 'multipart/form-data' }
         });
         
         setDentalRecords(prev => prev.map(r => r.id === response.data.id ? response.data : r));
         toast({ title: "Record Updated" });
      }
    } catch (error) {
      console.error("Error editing dental record:", error);
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const handleDeleteRecordClick = (recordId) => {
    setRecordIdToDelete(recordId);
    setIsRecordDeleteDialogOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (!recordIdToDelete) return;
    try {
      const idStr = String(recordIdToDelete);
      if (idStr.startsWith('app-')) {
        const realId = idStr.replace('app-', '');
        await api.deleteAppointment(realId);
        setAppointments(prev => prev.filter(a => String(a.id) !== realId));
        toast({ title: "Appointment Deleted" });
      } else {
        await api.deleteDentalRecord(recordIdToDelete);
        setDentalRecords(prev => prev.filter(r => r.id !== recordIdToDelete));
        toast({ title: "Record Deleted" });
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast({ title: "Error", description: "Failed to delete record.", variant: "destructive" });
    } finally {
      setIsRecordDeleteDialogOpen(false);
      setRecordIdToDelete(null);
    }
  };

  const handleStatusChange = async (appointment, newStatus) => {
    try {
        const realId = String(appointment.id).replace('app-', '');
        
        const formData = new FormData();
        formData.append('status', newStatus);
        if(appointment.date) formData.append('date', appointment.date);
        
        const response = await axios.put(`${API_BASE_URL}/appointments/${realId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        setAppointments(prev => prev.map(app => String(app.id) === realId ? response.data : app));
        toast({ title: `Marked as ${newStatus}` });
    } catch (error) {
        console.error("Status update failed", error);
        toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-10 w-10 text-primary"/></div>;
  if (!patient) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-8">
      <div className="flex items-center justify-start mb-2">
        <Button variant="outline" onClick={() => navigate(-1)} className="dark:text-slate-300 dark:border-slate-600">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="shadow-xl border-t-4 border-primary glassmorphic dark:bg-slate-800/70">
        <PatientPageHeader
          patient={patient}
          isDeleteDialogOpen={isPatientDeleteDialogOpen}
          onOpenDeleteDialog={() => setIsPatientDeleteDialogOpen(true)}
          onCloseDeleteDialog={() => setIsPatientDeleteDialogOpen(false)}
          onDeleteConfirm={handleDeletePatientConfirm}
        />
        
        <PatientDetailTabs
          patient={patient}
          patientId={patientId}
          dentalRecords={combinedDentalRecords}
          onAddDentalRecord={handleAddDentalRecord}
          onEditDentalRecord={handleEditDentalRecord}
          onDeleteDentalRecord={handleDeleteRecordClick}
          onStatusChange={handleStatusChange} 
        />
      </Card>

      <AlertDialog open={isRecordDeleteDialogOpen} onOpenChange={setIsRecordDeleteDialogOpen}>
        <AlertDialogContent className="glassmorphic dark:bg-slate-900 border-l-4 border-red-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" /> Delete Record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80">
              Are you sure you want to delete this record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordIdToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRecord} className="bg-red-600 hover:bg-red-700 text-white">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default PatientDetailPage;