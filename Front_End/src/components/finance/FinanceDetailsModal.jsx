import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, DollarSign, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- NEW IMPORT ---
import AppointmentCard from '@/components/appointments/AppointmentCard';

const FinanceDetailsModal = ({
  isOpen,
  onOpenChange,
  selectedDateForDetails,
  allRevenueSources,
  expenseEntries,
  appointments,
  // --- NEW PROPS ---
  onAppointmentEdit,
  onAppointmentDelete,
  onAppointmentStatusChange
}) => {
  // Helper to format date nicely
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Helper to filter data for the selected date
  const filterByDate = (entries) => {
    if (!selectedDateForDetails || !entries) return [];
    
    // Normalize selected date to YYYY-MM-DD
    const selected = new Date(selectedDateForDetails);
    selected.setHours(0, 0, 0, 0);
    const selectedStr = selected.toLocaleDateString('en-CA'); // YYYY-MM-DD

    return entries.filter(entry => {
      if (!entry.date) return false;
      
      // Handle array dates [2024, 12, 25] or strings
      let entryDate;
      if (Array.isArray(entry.date)) {
        entryDate = new Date(entry.date[0], entry.date[1] - 1, entry.date[2]);
      } else {
        entryDate = new Date(entry.date);
      }
      
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.toLocaleDateString('en-CA') === selectedStr;
    });
  };

  const dailyRevenue = filterByDate(allRevenueSources);
  const dailyExpenses = filterByDate(expenseEntries);
  const dailyAppointments = filterByDate(appointments || []);

  const totalRev = dailyRevenue.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalExp = dailyExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        
        {/* Header Section */}
        <DialogHeader className="p-6 pb-2 bg-muted/30 dark:bg-slate-800/50 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            {formatDate(selectedDateForDetails)}
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-muted-foreground">
            Daily Summary
          </DialogDescription>
          
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Income</p>
              <p className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-300">₹{totalRev.toFixed(2)}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase">Expenses</p>
              <p className="text-lg sm:text-xl font-bold text-red-700 dark:text-red-300">₹{totalExp.toFixed(2)}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs defaultValue="activity" className="w-full flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-2 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">Financial Activity</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              
              {/* --- Financial Activity Tab --- */}
              <TabsContent value="activity" className="mt-0 space-y-4">
                {dailyRevenue.length === 0 && dailyExpenses.length === 0 ? (
                  <EmptyState message="No financial activity recorded for this date." />
                ) : (
                  <div className="space-y-3 pb-2">
                    {/* Revenue Items */}
                    {dailyRevenue.map((item, idx) => (
                      <ActivityCard 
                        key={`rev-${idx}`} 
                        item={item} 
                        type="income" 
                      />
                    ))}
                    {/* Expense Items */}
                    {dailyExpenses.map((item, idx) => (
                      <ActivityCard 
                        key={`exp-${idx}`} 
                        item={item} 
                        type="expense" 
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* --- Appointments Tab (UPDATED) --- */}
              <TabsContent value="appointments" className="mt-0 space-y-4">
                {dailyAppointments.length === 0 ? (
                  <EmptyState message="No appointments scheduled for this date." />
                ) : (
                  <div className="space-y-3 pb-2">
                    {dailyAppointments.map((app, idx) => (
                      // 🔥 REPLACED STATIC DIV WITH INTERACTIVE CARD
                      <AppointmentCard 
                        key={app.id || idx}
                        appointment={app}
                        patientName={app.patientName || "Unknown Patient"}
                        index={idx}
                        onEdit={onAppointmentEdit}
                        onDelete={onAppointmentDelete}
                        onStatusChange={onAppointmentStatusChange}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

            </div>
          </Tabs>
        </div>
        
        <div className="p-4 border-t bg-muted/10 flex justify-end flex-shrink-0">
             <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Sub-components for Cleanliness ---

const ActivityCard = ({ item, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isIncome = type === 'income';

  return (
    <div 
      className={`border rounded-lg bg-card dark:bg-slate-800 shadow-sm transition-all duration-200 ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}
    >
      <div 
        className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 ${isIncome ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate text-sm sm:text-base">
              {isIncome ? (item.source || 'Revenue') : (item.type || 'Expense')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isIncome ? 'Income' : 'Outcome'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <span className={`font-bold text-sm sm:text-base ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isIncome ? '+' : '-'}₹{parseFloat(item.amount || 0).toFixed(2)}
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground border-t border-dashed mt-1">
              <div className="pt-3 flex gap-2 items-start">
                <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                   <span className="font-medium text-foreground">Details:</span>
                   <p className="mt-1 leading-relaxed">
                     {item.notes || item.description || "No additional notes provided."}
                   </p>
                   {item.patientName && (
                     <p className="mt-2 text-xs bg-muted/50 p-1.5 rounded inline-block">
                       Linked Patient: <span className="font-medium">{item.patientName}</span>
                     </p>
                   )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
    <div className="bg-muted/50 p-4 rounded-full mb-3">
      <CalendarIcon className="h-8 w-8 opacity-50" />
    </div>
    <p>{message}</p>
  </div>
);

export default FinanceDetailsModal;