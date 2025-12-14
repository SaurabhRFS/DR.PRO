/*import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppointmentCard from '@/components/appointments/AppointmentCard';

const FinanceCalendar = ({ revenueEntries, expenseEntries, appointments }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState([]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDailyProfit = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dailyRev = revenueEntries.filter(r => r.date === dateStr).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const dailyExp = expenseEntries.filter(e => e.date === dateStr).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    return dailyRev - dailyExp;
  };

  const handleDateClick = (dateObj, day) => {
    setSelectedDate(dateObj);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    const filteredAppointments = appointments.filter(a => {
      const apptDate = new Date(a.date);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate.getTime() === dateObj.getTime();
    });

    setSelectedDateAppointments(filteredAppointments);
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-start-${i}`} className="p-1 sm:p-2"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const profit = getDailyProfit(day);
    const dateObj = new Date(currentYear, currentMonth, day);
    dateObj.setHours(0, 0, 0, 0);

    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDateClick(dateObj, day)}
        className={cn(
          "p-1 sm:p-2 rounded-md text-center border h-16 sm:h-20 flex flex-col justify-between items-center transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-sky-400",
          profit > 0 ? "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700/60 hover:bg-green-200 dark:hover:bg-green-800/60" :
          profit < 0 ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700/60 hover:bg-red-200 dark:hover:bg-red-800/60" :
          "bg-slate-100 dark:bg-slate-700/40 border-slate-300 dark:border-slate-600/60 hover:bg-slate-200 dark:hover:bg-slate-600/60"
        )}
      >
        <span className="text-xs sm:text-sm font-semibold dark:text-slate-200">{day}</span>
        <span className={cn(
          "text-xs sm:text-sm font-medium",
          profit > 0 ? "text-green-700 dark:text-green-300" :
          profit < 0 ? "text-red-700 dark:text-red-300" :
          "text-muted-foreground dark:text-slate-400"
        )}>
          {profit !== 0 ? `₹${Math.round(profit)}` : '-'}
        </span>
      </button>
    );
  }

  return (
    <Card className="dark:bg-slate-800/70">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="dark:text-slate-300 dark:hover:bg-slate-700">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <CardTitle className="text-lg sm:text-xl text-foreground dark:text-slate-200">{monthNames[currentMonth]} {currentYear}</CardTitle>
            <CardDescription className="text-xs sm:text-sm dark:text-slate-400">Click a date to see detailed transactions.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="dark:text-slate-300 dark:hover:bg-slate-700">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
          {dayNames.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays}
        </div>

        {selectedDate && (
          <div className="mt-6 space-y-4">
            <h3 className="text-md font-semibold dark:text-white">
              Appointments on {selectedDate.toDateString()}
            </h3>

            {selectedDateAppointments.length > 0 ? (
              selectedDateAppointments.map((appt, index) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  patientName={appt.patientName || 'Unknown'}
                  index={index}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))
            ) : selectedDate > today ? (
              <div className="text-sm text-muted-foreground">
                No appointments yet. You can add a new appointment for this day.
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No past appointments found.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinanceCalendar;*/


// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
// import { ChevronLeft, ChevronRight } from 'lucide-react';
// import { cn } from '@/lib/utils';

// const FinanceCalendar = ({ revenueEntries, expenseEntries, onDateClick }) => {
//   const [currentDate, setCurrentDate] = useState(new Date());

//   const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
//   const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.

//   const currentYear = currentDate.getFullYear();
//   const currentMonth = currentDate.getMonth();
//   const daysInMonth = getDaysInMonth(currentYear, currentMonth);
//   const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

//   const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
//   const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//   const handlePrevMonth = () => {
//     setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
//   };

//   const handleNextMonth = () => {
//     setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
//   };

//   const getDailyProfit = (day) => {
//     const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//     const dailyRev = revenueEntries.filter(r => r.date === dateStr).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
//     const dailyExp = expenseEntries.filter(e => e.date === dateStr).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
//     return dailyRev - dailyExp;
//   };

//   const calendarDays = [];
//   for (let i = 0; i < firstDayOfMonth; i++) {
//     calendarDays.push(<div key={`empty-start-${i}`} className="p-1 sm:p-2"></div>);
//   }

//   for (let day = 1; day <= daysInMonth; day++) {
//     const profit = getDailyProfit(day);
//     const dateObj = new Date(currentYear, currentMonth, day);
//     calendarDays.push(
//       <button
//         key={day}
//         onClick={() => onDateClick(dateObj)}
//         className={cn(
//           "p-1 sm:p-2 rounded-md text-center border h-16 sm:h-20 flex flex-col justify-between items-center transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-sky-400",
//           profit > 0 ? "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700/60 hover:bg-green-200 dark:hover:bg-green-800/60" :
//           profit < 0 ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700/60 hover:bg-red-200 dark:hover:bg-red-800/60" :
//           "bg-slate-100 dark:bg-slate-700/40 border-slate-300 dark:border-slate-600/60 hover:bg-slate-200 dark:hover:bg-slate-600/60"
//         )}
//       >
//         <span className="text-xs sm:text-sm font-semibold dark:text-slate-200">{day}</span>
//         <span className={cn(
//             "text-xs sm:text-sm font-medium",
//             profit > 0 ? "text-green-700 dark:text-green-300" :
//             profit < 0 ? "text-red-700 dark:text-red-300" :
//             "text-muted-foreground dark:text-slate-400"
//           )}>
//           {profit !== 0 ? `₹${Math.round(profit)}` : '-'}
//         </span>
//       </button>
//     );
//   }

//   return (
//     <Card className="dark:bg-slate-800/70">
//       <CardHeader>
//         <div className="flex justify-between items-center">
//           <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="dark:text-slate-300 dark:hover:bg-slate-700">
//             <ChevronLeft className="h-5 w-5" />
//           </Button>
//           <div className="text-center">
//             <CardTitle className="text-lg sm:text-xl text-foreground dark:text-slate-200">{monthNames[currentMonth]} {currentYear}</CardTitle>
//             <CardDescription className="text-xs sm:text-sm dark:text-slate-400">Click a date to see detailed transactions.</CardDescription>
//           </div>
//           <Button variant="ghost" size="icon" onClick={handleNextMonth} className="dark:text-slate-300 dark:hover:bg-slate-700">
//             <ChevronRight className="h-5 w-5" />
//           </Button>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
//           {dayNames.map(d => <div key={d}>{d}</div>)}
//         </div>
//         <div className="grid grid-cols-7 gap-1 sm:gap-2">
//           {calendarDays}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default FinanceCalendar;
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppointmentCard from '@/components/appointments/AppointmentCard';

const FinanceCalendar = ({ revenueEntries, expenseEntries, appointments }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState([]);
  const [selectedDateRevenue, setSelectedDateRevenue] = useState([]); // NEW: State for selected date's revenue

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null); // NEW: Reset selection on month change
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null); // NEW: Reset selection on month change
  };

  const getDailyProfit = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dailyRev = revenueEntries.filter(r => r.date === dateStr).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const dailyExp = expenseEntries.filter(e => e.date === dateStr).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    return dailyRev - dailyExp;
  };

  const handleDateClick = (dateObj) => { // NEW: Simplified argument
    setSelectedDate(dateObj);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // Filter appointments for the selected date
    const filteredAppointments = appointments.filter(a => {
      const apptDate = new Date(a.date);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate.getTime() === dateObj.getTime();
    });
    setSelectedDateAppointments(filteredAppointments);

    // NEW: Filter revenue entries for the selected date
    const filteredRevenue = revenueEntries.filter(r => r.date === dateStr);
    setSelectedDateRevenue(filteredRevenue);
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-start-${i}`} className="p-1 sm:p-2"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const profit = getDailyProfit(day);
    const dateObj = new Date(currentYear, currentMonth, day);
    dateObj.setHours(0, 0, 0, 0);

    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDateClick(dateObj)} // NEW: Updated onClick handler
        className={cn(
          "p-1 sm:p-2 rounded-md text-center border h-16 sm:h-20 flex flex-col justify-between items-center transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-sky-400",
          profit > 0 ? "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700/60 hover:bg-green-200 dark:hover:bg-green-800/60" :
          profit < 0 ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700/60 hover:bg-red-200 dark:hover:bg-red-800/60" :
          "bg-slate-100 dark:bg-slate-700/40 border-slate-300 dark:border-slate-600/60 hover:bg-slate-200 dark:hover:bg-slate-600/60",
          selectedDate?.getTime() === dateObj.getTime() && "ring-2 ring-primary dark:ring-sky-400" // NEW: Highlight selected date
        )}
      >
        <span className="text-xs sm:text-sm font-semibold dark:text-slate-200">{day}</span>
        <span className={cn(
          "text-xs sm:text-sm font-medium",
          profit > 0 ? "text-green-700 dark:text-green-300" :
          profit < 0 ? "text-red-700 dark:text-red-300" :
          "text-muted-foreground dark:text-slate-400"
        )}>
          {profit !== 0 ? `₹${Math.round(profit)}` : '-'}
        </span>
      </button>
    );
  }

  return (
    <Card className="dark:bg-slate-800/70">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="dark:text-slate-300 dark:hover:bg-slate-700">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <CardTitle className="text-lg sm:text-xl text-foreground dark:text-slate-200">{monthNames[currentMonth]} {currentYear}</CardTitle>
            <CardDescription className="text-xs sm:text-sm dark:text-slate-400">Click a date to see appointments and revenue.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="dark:text-slate-300 dark:hover:bg-slate-700">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
          {dayNames.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays}
        </div>

        {selectedDate && (
          <div className="mt-6 space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-md font-semibold dark:text-white">
                Appointments on {selectedDate.toLocaleDateString()}
              </h3>
              {selectedDateAppointments.length > 0 ? (
                selectedDateAppointments.map((appt, index) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    patientName={appt.patientName || 'Unknown'}
                    index={index}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))
              ) : (
                <div className="text-sm text-muted-foreground dark:text-slate-400">
                  No appointments scheduled for this day.
                </div>
              )}
            </div>

            
            <div className="space-y-4">
              <h3 className="text-md font-semibold dark:text-white">
                Revenue on {selectedDate.toLocaleDateString()}
              </h3>
              {selectedDateRevenue.length > 0 ? (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm dark:bg-slate-800/80">
                  <div className="p-4 space-y-2">
                    {selectedDateRevenue.map((rev, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-300">{rev.description || 'Revenue Entry'}</span>
                        <span className="font-medium text-green-600 dark:text-green-400">₹{parseFloat(rev.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground dark:text-slate-400">
                  No revenue recorded for this day.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinanceCalendar;





