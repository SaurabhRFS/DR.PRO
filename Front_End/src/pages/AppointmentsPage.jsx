import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smile, Loader2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle icon
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppointmentCardComponent from '@/components/appointments/AppointmentCard';
import AppointmentFormDialog from '@/components/appointments/AppointmentFormDialog';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

// --- NEW IMPORTS FOR CUSTOM DELETE DIALOG ---
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

// --- HELPERS (Keep these for sorting/saving) ---
const parseUniversalDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (Array.isArray(dateInput)) {
    const [year, month, day] = dateInput;
    return new Date(year, month - 1, day);
  }
  return new Date(dateInput);
};

const prepareForApi = (appointment) => {
  const payload = { ...appointment };
  if (payload.date) {
    const d = parseUniversalDate(payload.date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    payload.date = `${year}-${month}-${day}`;
  }
  if (payload.time && payload.time.length === 5) {
      payload.time = payload.time + ":00";
  }
  delete payload.patientName; 
  return payload;
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- NEW STATE FOR DELETE DIALOG ---
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabFilter = searchParams.get('filter') || 'upcoming';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appointmentsRes, patientsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/appointments`),
        axios.get(`${API_BASE_URL}/patients`)
      ]);
      setAppointments(appointmentsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "Error", description: "Failed to load appointments.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];
    const isHistoryTab = currentTabFilter === 'past';

    if (isHistoryTab) {
      filtered = filtered.filter(app =>
        ['Done', 'Cancelled', 'Missed'].includes(app.status) ||
        parseUniversalDate(app.date) < new Date(today)
      );
    } else if (currentTabFilter === 'today') {
      filtered = filtered.filter(app => {
        const appDate = parseUniversalDate(app.date).toISOString().split('T')[0];
        return appDate === today && !['Done', 'Cancelled', 'Missed'].includes(app.status);
      });
    } else {
      // Upcoming
      filtered = filtered.filter(app =>
        parseUniversalDate(app.date) >= new Date(today) &&
        !['Done', 'Cancelled', 'Missed'].includes(app.status)
      );
    }

    return filtered.sort((a, b) => {
      const dateA = parseUniversalDate(a.date);
      const dateB = parseUniversalDate(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
         return isHistoryTab ? dateB - dateA : dateA - dateB;
      }
      const timeA = a.time ? parseInt(a.time.replace(/:/g, '')) : 0;
      const timeB = b.time ? parseInt(b.time.replace(/:/g, '')) : 0;
      return isHistoryTab ? timeB - timeA : timeA - timeB;
    });
  }, [appointments, currentTabFilter, today]);

  // --- ACTIONS ---

  const handleOpenForm = (appointment = null) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleSaveAppointment = async (appointmentData) => {
    try {
      const payload = prepareForApi(appointmentData);
      let saved;
      if (editingAppointment) {
        const res = await axios.put(`${API_BASE_URL}/appointments/${appointmentData.id}`, payload);
        saved = res.data;
        setAppointments(prev => prev.map(app => app.id === saved.id ? { ...saved, patientName: getPatientName(saved.patientId) } : app));
        toast({ title: "Appointment Updated" });
      } else {
        const res = await axios.post(`${API_BASE_URL}/appointments`, payload);
        saved = res.data;
        setAppointments(prev => [...prev, { ...saved, patientName: getPatientName(saved.patientId) }]);
        toast({ title: "Appointment Created" });
      }
      setIsFormOpen(false);
      setEditingAppointment(null);
    } catch (error) {
      console.error("Save failed", error);
      toast({ title: "Error", description: "Failed to save appointment.", variant: "destructive" });
    }
  };

  // --- STEP 1: TRIGGER THE DIALOG (Don't delete yet) ---
  const handleDeleteTrigger = (appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteDialogOpen(true);
  };

  // --- STEP 2: ACTUALLY DELETE (Called by Dialog) ---
  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/appointments/${appointmentToDelete.id}`);
      setAppointments(prev => prev.filter(a => a.id !== appointmentToDelete.id));
      toast({ title: "Appointment Deleted" });
    } catch (error) {
      console.error("Delete failed", error);
      toast({ title: "Error", description: "Could not delete appointment.", variant: "destructive" });
    } finally {
      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const handleStatusChange = async (appointment, newStatus) => {
    try {
      const payload = prepareForApi({ ...appointment, status: newStatus });
      const res = await axios.put(`${API_BASE_URL}/appointments/${appointment.id}`, payload);
      const updated = res.data;
      setAppointments(prev => prev.map(app => app.id === appointment.id ? { ...updated, patientName: getPatientName(updated.patientId) } : app));
      toast({ title: `Marked as ${newStatus}` });
    } catch (error) {
      console.error("Status update failed", error);
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown Patient';
  };

  const handleTabChange = (value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('filter', value);
    setSearchParams(newParams);
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Appointments</h1>
        <Button onClick={() => handleOpenForm()}>New Appointment</Button>
      </div>

      <AppointmentFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        appointment={editingAppointment}
        onSave={handleSaveAppointment}
      />

      {/* --- CUSTOM DELETE CONFIRMATION DIALOG --- */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glassmorphic dark:bg-slate-900 border-l-4 border-red-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
               <AlertTriangle className="h-5 w-5" /> Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80">
              Are you sure you want to cancel the appointment for 
              <span className="font-bold text-foreground"> {appointmentToDelete?.patientName}</span>?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAppointmentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
            >
              Yes, Delete It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs value={currentTabFilter} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">History</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTabFilter}>
          {filteredAppointments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Smile size={48} className="mx-auto mb-4 text-primary/70" />
              <h3 className="text-xl font-semibold mb-2">No Appointments</h3>
              <p>No appointments matching your current filters.</p>
            </motion.div>
          ) : (
            <Card className="shadow-none border-none mt-0 bg-transparent">
              <CardContent className="p-0 sm:p-4">
                <div className="space-y-4">
                  {filteredAppointments.map((app, index) => (
                    <AppointmentCardComponent
                      key={app.id}
                      appointment={app}
                      patientName={getPatientName(app.patientId)}
                      index={index}
                      onEdit={handleOpenForm}
                      // Pass the TRIGGER function, not the confirm function
                      onDelete={handleDeleteTrigger}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AppointmentsPage;