import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './FinanceCalendar.css';

const FinanceCalendar = ({ revenueEntries, expenseEntries, appointments, onDateClick }) => {
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate(); // Initialize hook

  // Helper to get entries for a specific date
  const getEntriesForDate = (targetDate) => {
    const dateStr = targetDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
    
    // Normalize appointments to YYYY-MM-DD
    const daysAppointments = appointments.filter(app => app.date === dateStr);
    
    const daysRevenue = revenueEntries.filter(r => {
        // Handle both ISO strings and YYYY-MM-DD
        const rDate = new Date(r.date).toLocaleDateString('en-CA');
        return rDate === dateStr;
    });

    const daysExpenses = expenseEntries.filter(e => {
        const eDate = new Date(e.date).toLocaleDateString('en-CA');
        return eDate === dateStr;
    });

    return {
      appointments: daysAppointments,
      revenue: daysRevenue,
      expenses: daysExpenses
    };
  };

  const selectedDayData = getEntriesForDate(date);
  const hasData = selectedDayData.appointments.length > 0 || selectedDayData.revenue.length > 0 || selectedDayData.expenses.length > 0;

  // Custom tile content to show dots on calendar
  const tileContent = ({ date: tileDate, view }) => {
    if (view === 'month') {
      const { appointments, revenue, expenses } = getEntriesForDate(tileDate);
      const hasContent = appointments.length > 0 || revenue.length > 0 || expenses.length > 0;
      
      if (hasContent) {
        return (
          <div className="flex justify-center mt-1 gap-0.5">
            {appointments.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
            {revenue.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            {expenses.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
          </div>
        );
      }
    }
    return null;
  };

  // Handler to open patient profile
  const handleProfileClick = (patientId) => {
    if (patientId) {
      navigate(`/patients/${patientId}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Section */}
      <Card className="flex-1 dark:bg-slate-800/70 border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground dark:text-slate-200">Calendar</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-4 flex justify-center">
            <style>{`
                .react-calendar { 
                    width: 100%; 
                    background: transparent; 
                    border: none; 
                    font-family: inherit;
                }
                .react-calendar__tile {
                    padding: 10px 6px;
                    border-radius: 8px;
                }
                .react-calendar__tile:enabled:hover,
                .react-calendar__tile:enabled:focus {
                    background-color: var(--muted);
                }
                .react-calendar__tile--active {
                    background: var(--primary) !important;
                    color: white !important;
                }
                .react-calendar__navigation button {
                    min-width: 44px;
                    background: none;
                }
            `}</style>
          <Calendar
            onChange={setDate}
            value={date}
            className="w-full text-sm border-none shadow-none dark:text-slate-200"
            tileContent={tileContent}
            prevLabel={<ChevronLeft className="h-4 w-4" />}
            nextLabel={<ChevronRight className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Agenda Section */}
      <Card className="flex-1 lg:max-w-md dark:bg-slate-800/70 border-none shadow-md flex flex-col h-auto lg:h-auto min-h-[400px]">
        <CardHeader className="border-b dark:border-slate-700 pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-foreground dark:text-slate-200">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </CardTitle>
            <Badge variant="outline" className="ml-2">
                {selectedDayData.appointments.length + selectedDayData.revenue.length + selectedDayData.expenses.length} Events
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 flex-1 overflow-y-auto max-h-[500px] lg:max-h-[600px]">
          {/* Action Button to View Details */}
          {hasData && (
             <button 
                onClick={() => onDateClick(date)}
                className="w-full mb-4 text-xs flex items-center justify-center gap-1 p-2 rounded border border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors"
             >
                <MoreHorizontal className="h-3 w-3" /> View Full Details Breakdown
             </button>
          )}

          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 min-h-[200px]">
              <p>No events scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* 1. Appointments (Clickable) */}
              {selectedDayData.appointments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appointments</h4>
                  {selectedDayData.appointments.map(app => (
                    <div 
                        key={app.id} 
                        onClick={() => handleProfileClick(app.patientId)}
                        className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border-l-2 border-blue-500 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        title="Click to view Patient Profile"
                    >
                      <div className="flex justify-between font-medium">
                         <span className="dark:text-blue-200 underline decoration-dotted decoration-blue-400/50 underline-offset-2">
                            {app.patientName || `Patient #${app.patientId}`}
                         </span>
                         <span className="text-blue-600 dark:text-blue-400">{app.time ? app.time.substring(0, 5) : 'All Day'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">{app.notes || 'No notes'}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Revenue (Clickable if linked to Patient) */}
              {selectedDayData.revenue.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</h4>
                  {selectedDayData.revenue.map((rev, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => rev.patientId && handleProfileClick(rev.patientId)}
                        className={`p-3 rounded-lg bg-green-50/50 dark:bg-green-900/20 border-l-2 border-green-500 text-sm flex justify-between items-center ${rev.patientId ? 'cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors' : ''}`}
                        title={rev.patientId ? "Click to view Patient Profile" : "General Revenue"}
                    >
                      <span className={`dark:text-green-200 truncate pr-2 ${rev.patientId ? 'underline decoration-dotted decoration-green-400/50 underline-offset-2' : ''}`}>
                          {rev.description || rev.notes || 'Payment'}
                      </span>
                      <span className="font-bold text-green-700 dark:text-green-400 whitespace-nowrap">₹{parseFloat(rev.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Expenses (Not Clickable - No Profile) */}
              {selectedDayData.expenses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expenses</h4>
                  {selectedDayData.expenses.map((exp, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-red-50/50 dark:bg-red-900/20 border-l-2 border-red-500 text-sm flex justify-between items-center">
                      <span className="dark:text-red-200 truncate pr-2">{exp.type}</span>
                      <span className="font-bold text-red-700 dark:text-red-400 whitespace-nowrap">₹{parseFloat(exp.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceCalendar;