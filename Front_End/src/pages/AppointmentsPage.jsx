import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smile, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppointmentCardComponent from '@/components/appointments/AppointmentCard';
import AppointmentFormDialog from '@/components/appointments/AppointmentFormDialog';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
        new Date(app.date) < new Date(today)
      );
    } else if (currentTabFilter === 'today') {
      filtered = filtered.filter(app =>
        app.date === today && !['Done', 'Cancelled', 'Missed'].includes(app.status)
      );
    } else {
      // Upcoming
      filtered = filtered.filter(app =>
        new Date(app.date) >= new Date(today) &&
        !['Done', 'Cancelled', 'Missed'].includes(app.status)
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
      const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
      return isHistoryTab ? dateB - dateA : dateA - dateB;
    });
  }, [appointments, currentTabFilter, today]);

  // --- ACTIONS ---

  const handleOpenForm = (appointment = null) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleSaveAppointment = async (appointmentData) => {
    try {
      let saved;
      if (editingAppointment) {
        // Update
        const res = await axios.put(`${API_BASE_URL}/appointments/${appointmentData.id}`, appointmentData);
        saved = res.data;
        setAppointments(prev => prev.map(app => app.id === saved.id ? saved : app));
        toast({ title: "Appointment Updated" });
      } else {
        // Create
        const res = await axios.post(`${API_BASE_URL}/appointments`, appointmentData);
        saved = res.data;
        setAppointments(prev => [...prev, saved]);
        toast({ title: "Appointment Created" });
      }
      setIsFormOpen(false);
      setEditingAppointment(null);
    } catch (error) {
      console.error("Save failed", error);
      toast({ title: "Error", description: "Failed to save appointment.", variant: "destructive" });
    }
  };

  const handleDelete = async (appointment) => {
    if(!window.confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/appointments/${appointment.id}`);
      setAppointments(prev => prev.filter(a => a.id !== appointment.id));
      toast({ title: "Appointment Deleted" });
    } catch (error) {
      console.error("Delete failed", error);
      toast({ title: "Error", description: "Could not delete appointment.", variant: "destructive" });
    }
  };

  const handleStatusChange = async (appointment, newStatus) => {
    try {
      // Create updated object
      const updatedApp = { ...appointment, status: newStatus };
      
      // Call API
      await axios.put(`${API_BASE_URL}/appointments/${appointment.id}`, updatedApp);
      
      // Update UI
      setAppointments(prev => prev.map(app => app.id === appointment.id ? updatedApp : app));
      
      toast({ title: `Marked as ${newStatus}` });

      // Special check: If marked as Done, maybe refresh data to update dashboard stats logic if needed elsewhere
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
                      onDelete={handleDelete}
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