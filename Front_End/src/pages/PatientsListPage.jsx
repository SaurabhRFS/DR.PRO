import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserPlus, Search, ArrowUpDown, Filter, CalendarMinus, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PatientsListPage = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [patientsResponse, appointmentsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/patients`),
          axios.get(`${API_BASE_URL}/appointments`)
        ]);
        
        setPatients(patientsResponse.data || []);
        setAppointments(appointmentsResponse.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not load data. Ensure Backend is running on port 8080.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPatientTotalCost = (patientId) => {
    return appointments
      .filter(app => app.patientId === patientId && app.status === 'Done' && app.cost)
      .reduce((sum, app) => sum + parseFloat(app.cost), 0);
  };
  
  const getPatientLastVisit = (patientId) => {
    const patientAppointments = appointments
      .filter(app => app.patientId === patientId && ['Done', 'Scheduled', 'Confirmed'].includes(app.status))
      .sort((a,b) => new Date(b.date) - new Date(a.date));
    return patientAppointments.length > 0 ? patientAppointments[0].date : null;
  };

  const processedPatients = useMemo(() => {
    if (!patients) return [];
    return patients.map(p => ({
      ...p,
      totalCost: getPatientTotalCost(p.id),
      lastVisitDate: getPatientLastVisit(p.id),
    }));
  }, [patients, appointments]);


  const filteredAndSortedPatients = useMemo(() => {
    let filtered = processedPatients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    switch (sortOption) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'lastVisit-asc':
        filtered.sort((a, b) => {
          const dateA = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : Infinity;
          const dateB = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : Infinity;
          return dateA - dateB;
        });
        break;
      case 'lastVisit-desc':
        filtered.sort((a, b) => {
          const dateA = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : -Infinity;
          const dateB = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : -Infinity;
          return dateB - dateA;
        });
        break;
      case 'cost-high':
        filtered.sort((a, b) => b.totalCost - a.totalCost);
        break;
      case 'cost-low':
        filtered.sort((a, b) => a.totalCost - b.totalCost);
        break;
      default:
        break;
    }
    return filtered;
  }, [processedPatients, searchTerm, sortOption]);

  const getInitials = (name) => {
    if (!name) return 'P';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0]?.[0]?.toUpperCase() || 'P';
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-xl text-muted-foreground">Loading Patients...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive bg-red-50 dark:bg-red-900/20 rounded-lg">
        <AlertTriangle size={48} className="mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">An Error Occurred</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center">
          <Users className="mr-3 h-8 w-8" /> Patient Directory
        </h1>
        <Link to="/patients/new">
          <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
            <UserPlus className="mr-2 h-5 w-5" /> Add New Patient
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg dark:bg-slate-800/70">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
                  <Filter className="mr-2 h-4 w-4" /> Sort By <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glassmorphic dark:bg-slate-800 dark:border-slate-700">
                <DropdownMenuRadioGroup value={sortOption} onValueChange={setSortOption}>
                  <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioItem value="lastVisit-desc">Most Recently Visited</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="lastVisit-asc">Least Recently Visited</DropdownMenuRadioItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioItem value="cost-high">Total Spent (High-Low)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="cost-low">Total Spent (Low-High)</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedPatients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground dark:text-slate-400">
              <Users size={48} className="mx-auto mb-4 text-primary/70 dark:text-sky-400/70" />
              <h3 className="text-xl font-semibold mb-2 dark:text-slate-200">No Patients Found</h3>
              <p>{searchTerm ? "Try adjusting your search or filter criteria." : "There are no patients in the system yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedPatients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={`/patients/${patient.id}`} className="block h-full">
                    <Card className="h-full hover:shadow-xl transition-all duration-300 ease-out group dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:border-slate-700">
                      
                      {/* --- UPDATED CARD HEADER: LARGER AVATAR (h-24 w-24) --- */}
                      <CardHeader className="flex flex-row items-center gap-6 p-6">
                        <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-600 shadow-md">
                          <AvatarImage src={patient.avatarUrl} alt={patient.name} className="object-cover" />
                          <AvatarFallback className="bg-muted dark:bg-slate-700 dark:text-slate-300 text-3xl font-bold">
                            {getInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl font-bold group-hover:text-primary dark:text-slate-100 dark:group-hover:text-sky-400 truncate">
                            {patient.name}
                          </CardTitle>
                          <CardDescription className="text-base mt-1 dark:text-slate-400">
                            {patient.phone}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      {/* ---------------------------------------------------- */}

                      <CardContent className="p-4 pt-0 text-sm text-muted-foreground dark:text-slate-400">
                        {patient.lastVisitDate ? (
                          <div className="flex items-center mb-1">
                            <CalendarMinus className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0" /> Last Visit: {new Date(patient.lastVisitDate).toLocaleDateString()}
                          </div>
                        ) : (
                           <div className="flex items-center mb-1 text-slate-500">
                            <CalendarMinus className="h-4 w-4 mr-2 flex-shrink-0" /> No visit history
                           </div>
                        )}
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-green-500 dark:text-green-400 flex-shrink-0" /> Total Spent: ₹{patient.totalCost.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PatientsListPage;