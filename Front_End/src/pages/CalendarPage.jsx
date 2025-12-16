import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FinanceCalendar from '@/components/finance/FinanceCalendar';
import { useToast } from '@/components/ui/use-toast';

// --- Appointment Dialog ---
import AppointmentFormDialog from '@/components/appointments/AppointmentFormDialog';

// --- NEW IMPORT: Details Modal ---
import FinanceDetailsModal from '@/components/finance/FinanceDetailsModal';

// --- Confirm Dialog ---
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ================= HELPERS (Same as AppointmentsPage) =================

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
    payload.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  if (payload.time && payload.time.length === 5) {
    payload.time = payload.time + ":00";
  }

  delete payload.patientName;
  return payload;
};

// ================= PAGE =================

const CalendarPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);

  // 🔥 DATA STATE (PATIENTS ADDED)
  const [data, setData] = useState({
    appointments: [],
    revenue: [],
    expenses: [],
    patients: []        
  });

  // --- Dialog State ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  // --- NEW: Modal State ---
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDateForDetails, setSelectedDateForDetails] = useState(null);

  // ================= FETCH =================

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        appointmentsRes,
        revenueRes,
        expensesRes,
        patientsRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/appointments`),
        axios.get(`${API_BASE_URL}/revenue`),
        axios.get(`${API_BASE_URL}/expenses`),
        axios.get(`${API_BASE_URL}/patients`)
      ]);

      setData({
        appointments: appointmentsRes.data || [],
        revenue: revenueRes.data || [],
        expenses: expensesRes.data || [],
        patients: patientsRes.data || []
      });

    } catch (error) {
      console.error("Failed to load calendar data:", error);
      toast({
        title: "Error",
        description: "Could not load calendar data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= HANDLERS =================

  const handleOpenForm = (appointment = null) => {
    // If we are editing from the details modal, close it first so the form is visible
    if(isDetailsModalOpen) setIsDetailsModalOpen(false); 
    
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleSaveAppointment = async (appointmentData) => {
    try {
      const payload = prepareForApi(appointmentData);
      let saved;

      if (editingAppointment) {
        const res = await axios.put(
          `${API_BASE_URL}/appointments/${appointmentData.id}`,
          payload
        );
        saved = res.data;

        setData(prev => ({
          ...prev,
          appointments: prev.appointments.map(app =>
            app.id === saved.id ? saved : app
          )
        }));

        toast({ title: "Appointment Updated" });
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/appointments`,
          payload
        );
        saved = res.data;

        setData(prev => ({
          ...prev,
          appointments: [...prev.appointments, saved]
        }));

        toast({ title: "Appointment Created" });
      }

      setIsFormOpen(false);
      setEditingAppointment(null);

    } catch (error) {
      console.error("Save failed", error);
      toast({
        title: "Error",
        description: "Failed to save appointment.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTrigger = (appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/appointments/${appointmentToDelete.id}`
      );

      setData(prev => ({
        ...prev,
        appointments: prev.appointments.filter(
          a => a.id !== appointmentToDelete.id
        )
      }));

      toast({ title: "Appointment Deleted" });
    } catch (error) {
      console.error("Delete failed", error);
      toast({
        title: "Error",
        description: "Could not delete appointment.",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const handleStatusChange = async (appointment, newStatus) => {
    try {
      const payload = prepareForApi({ ...appointment, status: newStatus });
      const res = await axios.put(
        `${API_BASE_URL}/appointments/${appointment.id}`,
        payload
      );
      const updated = res.data;

      setData(prev => ({
        ...prev,
        appointments: prev.appointments.map(app =>
          app.id === appointment.id ? updated : app
        )
      }));

      toast({ title: `Marked as ${newStatus}` });
    } catch (error) {
      console.error("Status update failed", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive"
      });
    }
  };

  // --- NEW: Date Click Handler ---
  const handleDateClick = (date) => {
    setSelectedDateForDetails(date);
    setIsDetailsModalOpen(true);
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // ================= UI =================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8 p-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Financial & Appointment Calendar
        </h1>
      </div>

      {/* ================= APPOINTMENT FORM ================= */}
      <AppointmentFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        appointment={editingAppointment}
        onSave={handleSaveAppointment}
        patients={data.patients}   
      />

      {/* ================= DETAILS MODAL (NEW) ================= */}
      <FinanceDetailsModal 
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        selectedDateForDetails={selectedDateForDetails}
        allRevenueSources={data.revenue}
        expenseEntries={data.expenses}
        appointments={data.appointments}
        // PASS ACTIONS DOWN
        onAppointmentEdit={handleOpenForm}
        onAppointmentDelete={handleDeleteTrigger}
        onAppointmentStatusChange={handleStatusChange}
      />

      {/* ================= DELETE CONFIRM ================= */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glassmorphic dark:bg-slate-900 border-l-4 border-red-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" /> Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80">
              Are you sure you want to cancel this appointment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================= CALENDAR ================= */}
      <FinanceCalendar
        appointments={data.appointments}
        revenueEntries={data.revenue}
        expenseEntries={data.expenses}
        onDateClick={handleDateClick} // <--- PASS THIS HANDLER
        onAppointmentEdit={handleOpenForm}
        onAppointmentDelete={handleDeleteTrigger}
        onAppointmentStatusChange={handleStatusChange}
      />
    </motion.div>
  );
};

export default CalendarPage;