import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smile, Loader2, AlertTriangle } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppointmentCardComponent from '@/components/appointments/AppointmentCard';
import AppointmentFormDialog from '@/components/appointments/AppointmentFormDialog';
import { useToast } from '@/components/ui/use-toast';
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

// ================= HELPERS =================

const parseUniversalDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (Array.isArray(dateInput)) {
    const [y, m, d] = dateInput;
    return new Date(y, m - 1, d);
  }
  return new Date(dateInput);
};

const prepareForApi = (appointment) => {
  const payload = { ...appointment };

  if (payload.date) {
    const d = parseUniversalDate(payload.date);
    payload.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  if (payload.time && payload.time.length === 5) {
    payload.time = payload.time + ":00";
  }

  delete payload.patientName;
  return payload;
};

const createFormData = (data) => {
  const formData = new FormData();
  if (data.patientId) formData.append('patientId', data.patientId);
  formData.append('date', data.date);
  if (data.time) formData.append('time', data.time);
  formData.append('notes', data.notes || "");
  formData.append('cost', data.cost || 0);
  formData.append('status', data.status || "Scheduled");

  if (data.prescriptionFile) formData.append('prescriptionFile', data.prescriptionFile);
  if (data.additionalFile) formData.append('additionalFile', data.additionalFile);

  return formData;
};

// ================= PAGE =================

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]); // ✅ REQUIRED
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabFilter = searchParams.get('filter') || 'upcoming';

  // ================= FETCH =================

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appointmentsRes, patientsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/appointments`),
        axios.get(`${API_BASE_URL}/patients`)
      ]);
      setAppointments(appointmentsRes.data || []);
      setPatients(patientsRes.data || []); // ✅ ENSURED
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load appointments.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const today = new Date().toISOString().split('T')[0];

  // ================= FILTER + SORT =================

  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];
    const isHistoryTab = currentTabFilter === 'past';

    if (isHistoryTab) {
      filtered = filtered.filter(app =>
        ['Done', 'Cancelled', 'Missed'].includes(app.status) ||
        parseUniversalDate(app.date) < new Date(today)
      );
    } else if (currentTabFilter === 'today') {
      filtered = filtered.filter(app =>
        parseUniversalDate(app.date).toISOString().split('T')[0] === today &&
        !['Done', 'Cancelled', 'Missed'].includes(app.status)
      );
    } else {
      filtered = filtered.filter(app =>
        parseUniversalDate(app.date) >= new Date(today) &&
        !['Done', 'Cancelled', 'Missed'].includes(app.status)
      );
    }

    return filtered.sort((a, b) => {
      const dA = parseUniversalDate(a.date);
      const dB = parseUniversalDate(b.date);
      if (dA.getTime() !== dB.getTime()) return isHistoryTab ? dB - dA : dA - dB;
      const tA = a.time ? parseInt(a.time.replace(/:/g,'')) : 0;
      const tB = b.time ? parseInt(b.time.replace(/:/g,'')) : 0;
      return isHistoryTab ? tB - tA : tA - tB;
    });
  }, [appointments, currentTabFilter, today]);

  // ================= GROUP BY DATE =================

  const groupedAppointments = useMemo(() => {
    const groups = {};
    filteredAppointments.forEach(app => {
      const key = parseUniversalDate(app.date).toDateString();
      if (!groups[key]) groups[key] = { list: [] };
      groups[key].list.push(app);
    });
    return groups;
  }, [filteredAppointments]);

  const getPatientName = (id) =>
    patients.find(p => p.id === id)?.name || 'Unknown Patient';

  // ================= SAVE =================

  const handleSaveAppointment = async (appointmentData) => {
    try {
      const payload = prepareForApi(appointmentData);
      const formData = createFormData(payload);

      let saved;
      if (editingAppointment) {
        const res = await axios.put(
          `${API_BASE_URL}/appointments/${appointmentData.id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        saved = res.data;
        setAppointments(prev =>
          prev.map(app => app.id === saved.id ? { ...saved, patientName: getPatientName(saved.patientId) } : app)
        );
        toast({ title: "Appointment Updated" });
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/appointments`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        saved = res.data;
        setAppointments(prev => [...prev, { ...saved, patientName: getPatientName(saved.patientId) }]);
        toast({ title: "Appointment Created" });
      }

      setIsFormOpen(false);
      setEditingAppointment(null);
    } catch (error) {
      console.error("Save failed", error);
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
  };

  // ================= DELETE =================

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/appointments/${appointmentToDelete.id}`);
      setAppointments(prev => prev.filter(a => a.id !== appointmentToDelete.id));
      toast({ title: "Appointment Deleted" });
    } catch {
      toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;
  }

  // ================= UI =================

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-8">

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Button onClick={() => setIsFormOpen(true)}>New Appointment</Button>
      </div>

      <AppointmentFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        appointment={editingAppointment}
        onSave={handleSaveAppointment}
        patients={patients}   
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" /> Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Delete appointment for <strong>{appointmentToDelete?.patientName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs value={currentTabFilter} onValueChange={(v)=>setSearchParams({ filter: v })}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">History</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTabFilter}>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Smile size={48} className="mx-auto mb-4"/>
              No appointments
            </div>
          ) : (
            Object.keys(groupedAppointments).map(dateKey => (
              <div key={dateKey} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border"/>
                  <span className="text-sm font-medium">{dateKey}</span>
                  <div className="h-px flex-1 bg-border"/>
                </div>
                {groupedAppointments[dateKey].list.map((app, i) => (
                  <AppointmentCardComponent
                    key={app.id}
                    appointment={app}
                    patientName={getPatientName(app.patientId)}
                    index={i}
                    onEdit={(a)=>{ setEditingAppointment(a); setIsFormOpen(true); }}
                    onDelete={(a)=>{ setAppointmentToDelete(a); setIsDeleteDialogOpen(true); }}
                  />
                ))}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AppointmentsPage;