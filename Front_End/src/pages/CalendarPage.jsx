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
        setLoading(true);
        // 1. Fetch Appointments (Now returns DTOs with names), Revenue, and Expenses
        // Removed the inefficient /patients call
        const [appointmentsRes, revenueRes, expensesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/appointments`),
          axios.get(`${API_BASE_URL}/revenue`),
          axios.get(`${API_BASE_URL}/expenses`)
        ]);

        setData({
          appointments: appointmentsRes.data || [],
          revenue: revenueRes.data || [],
          expenses: expensesRes.data || []
        });

      } catch (error) {
        console.error("Failed to load calendar data:", error);
        toast({ 
          title: "Error", 
          description: "Could not load calendar data. Please check connection.", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8 p-6" // Added padding for better mobile view
    >
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Financial & Appointment Calendar</h1>
      </div>

      {/* The FinanceCalendar component will now receive objects that ALREADY 
         have a valid .patientName property from the backend.
      */}
      <FinanceCalendar 
        appointments={data.appointments}
        revenueEntries={data.revenue}
        expenseEntries={data.expenses}
      />
    </motion.div>
  );
};

export default CalendarPage;