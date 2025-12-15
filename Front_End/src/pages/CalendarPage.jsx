import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FinanceCalendar from '@/components/finance/FinanceCalendar';
import { useToast } from '@/components/ui/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CalendarPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    appointments: [],
    revenue: [],
    expenses: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Appointments, Finance, AND Patients
        const [appointmentsRes, revenueRes, expensesRes, patientsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/appointments`),
          axios.get(`${API_BASE_URL}/revenue`),
          axios.get(`${API_BASE_URL}/expenses`),
          axios.get(`${API_BASE_URL}/patients`) // <--- New Fetch
        ]);

        const patients = patientsRes.data || [];
        const rawAppointments = appointmentsRes.data || [];

        // 2. "Enrich" the appointments with Patient Names
        const enrichedAppointments = rawAppointments.map(app => {
            const patient = patients.find(p => p.id === app.patientId);
            return {
                ...app,
                patientName: patient ? patient.name : 'Unknown Patient', // Attach Name
                notes: app.notes || app.treatmentName || 'General Visit' // Ensure notes exist
            };
        });

        setData({
          appointments: enrichedAppointments,
          revenue: revenueRes.data || [],
          expenses: expensesRes.data || []
        });

      } catch (error) {
        console.error("Failed to load calendar data:", error);
        toast({ title: "Error", description: "Could not load calendar data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Financial & Appointment Calendar</h1>
      </div>

      <FinanceCalendar 
        appointments={data.appointments}
        revenueEntries={data.revenue}
        expenseEntries={data.expenses}
      />
    </motion.div>
  );
};

export default CalendarPage;