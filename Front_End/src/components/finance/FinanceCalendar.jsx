import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar'; // Ensure you have this: npm install react-calendar
import 'react-calendar/dist/Calendar.css'; // Default styling
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Stethoscope, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar as CalendarIcon,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom styling to make the calendar look modern
import './FinanceCalendar.css'; 

const FinanceCalendar = ({ appointments = [], revenueEntries = [], expenseEntries = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- Helpers ---
  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // --- Filtering Data for the Selected Date ---
  const dayData = useMemo(() => {
    const apps = appointments.filter(a => isSameDay(new Date(a.date), selectedDate));
    const revs = revenueEntries.filter(r => isSameDay(new Date(r.date), selectedDate));
    const exps = expenseEntries.filter(e => isSameDay(new Date(e.date), selectedDate));
    
    // Sort appointments by time (if available)
    apps.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

    return { apps, revs, exps };
  }, [selectedDate, appointments, revenueEntries, expenseEntries]);

  // --- Tile Content (Dots on the Calendar) ---
  const getTileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    // Check if this date has any data
    const hasApps = appointments.some(a => isSameDay(new Date(a.date), date));
    const hasMoney = revenueEntries.some(r => isSameDay(new Date(r.date), date)) || 
                     expenseEntries.some(e => isSameDay(new Date(e.date), date));

    if (!hasApps && !hasMoney) return null;

    return (
      <div className="flex justify-center gap-1 mt-1">
        {hasApps && <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>}
        {hasMoney && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>}
      </div>
    );
  };

  const isToday = isSameDay(selectedDate, new Date());
  const isFuture = selectedDate > new Date() && !isToday;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[85vh]">
      
      {/* LEFT SIDE: The Calendar */}
      <Card className="flex-1 shadow-lg border-t-4 border-primary/50 dark:bg-slate-800/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary"/> 
            Overview
          </CardTitle>
          <CardDescription>Select a date to view history or upcoming events.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <div className="custom-calendar-wrapper w-full max-w-md">
            <Calendar 
              onChange={setSelectedDate} 
              value={selectedDate}
              tileContent={getTileContent}
              className="w-full border-none rounded-lg font-sans"
            />
          </div>
        </CardContent>
        {/* Legend */}
        <div className="flex justify-center gap-4 pb-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-500"></div>Appointment</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500"></div>Transaction</div>
        </div>
      </Card>

      {/* RIGHT SIDE: The Day Docket (Details) */}
      <Card className="flex-1 shadow-lg flex flex-col overflow-hidden border-t-4 border-blue-500 dark:bg-slate-800/80">
        <CardHeader className="pb-3 border-b dark:border-slate-700 bg-muted/20">
          <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-2xl text-blue-700 dark:text-blue-400">
                    {isToday ? "Today's Agenda" : isFuture ? "Upcoming Schedule" : "Daily History"}
                </CardTitle>
                <CardDescription className="text-base font-medium mt-1">
                    {formatDate(selectedDate)}
                </CardDescription>
            </div>
            {isToday && <Badge className="bg-green-600 animate-pulse">Live</Badge>}
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 relative">
           <ScrollArea className="h-[60vh] p-4">
             <AnimatePresence mode="wait">
               <motion.div 
                 key={selectedDate.toString()}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.2 }}
                 className="space-y-6"
               >
                 
                 {/* 1. FINANCIALS SECTION (Salary, Expenses, Income) */}
                 {(dayData.exps.length > 0 || dayData.revs.length > 0) && (
                   <div className="space-y-3">
                     <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Wallet className="h-4 w-4"/> Financial Activity
                     </h3>
                     <div className="grid gap-2">
                        {/* Expenses */}
                        {dayData.exps.map((exp, i) => (
                            <div key={`exp-${i}`} className="flex justify-between items-center p-3 rounded-lg bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-red-500 shadow-sm"><TrendingDown className="h-4 w-4"/></div>
                                    <div>
                                        <p className="font-semibold text-red-900 dark:text-red-200">{exp.description || 'Expense'}</p>
                                        <p className="text-xs text-red-600/80 dark:text-red-400">{exp.category}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-red-600">-₹{exp.amount}</span>
                            </div>
                        ))}
                        {/* Revenue (Direct Entries) */}
                        {dayData.revs.map((rev, i) => (
                            <div key={`rev-${i}`} className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-emerald-500 shadow-sm"><TrendingUp className="h-4 w-4"/></div>
                                    <div>
                                        <p className="font-semibold text-emerald-900 dark:text-emerald-200">{rev.description || 'Income'}</p>
                                        <p className="text-xs text-emerald-600/80 dark:text-emerald-400">Direct Entry</p>
                                    </div>
                                </div>
                                <span className="font-bold text-emerald-600">+₹{rev.amount}</span>
                            </div>
                        ))}
                     </div>
                   </div>
                 )}

                 {/* 2. APPOINTMENTS SECTION */}
                 <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Stethoscope className="h-4 w-4"/>
                        {dayData.apps.length > 0 ? "Appointments" : "No Appointments"}
                    </h3>
                    
                    {dayData.apps.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                            No appointments scheduled.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {dayData.apps.map((app) => (
                                <div key={app.id} className="group flex items-start gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                    {/* Time Column */}
                                    <div className="flex flex-col items-center min-w-[3rem] pt-1">
                                        <span className="text-sm font-bold">{app.time || "Any"}</span>
                                        <span className="text-xs text-muted-foreground">{parseInt(app.time) >= 12 ? 'PM' : 'AM'}</span>
                                    </div>
                                    
                                    {/* Details Column */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-base">{app.patientName || "Walk-in Patient"}</h4>
                                            {/* Status Badge */}
                                            {app.status === 'Done' ? (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50"><CheckCircle2 className="h-3 w-3 mr-1"/> Done</Badge>
                                            ) : app.status === 'Cancelled' ? (
                                                <Badge variant="outline" className="text-red-500 border-red-200"><AlertCircle className="h-3 w-3 mr-1"/> Cancelled</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-blue-500 border-blue-200"><Clock className="h-3 w-3 mr-1"/> Planned</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-0.5">{app.notes || "General Consultation"}</p>
                                        
                                        {/* Money collected from this appointment? */}
                                        {app.status === 'Done' && app.cost && (
                                            <div className="mt-2 text-xs flex items-center text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-1 rounded">
                                                <TrendingUp className="h-3 w-3 mr-1"/> Collected: ₹{app.cost}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>

               </motion.div>
             </AnimatePresence>
           </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceCalendar;