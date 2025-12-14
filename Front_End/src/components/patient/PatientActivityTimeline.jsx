
import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, FileText, Pill, DollarSign } from 'lucide-react';

const TimelineItem = ({ icon: Icon, title, date, description, color, children, index }) => (
  <motion.div 
    className="flex space-x-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    <div className="flex flex-col items-center">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-grow w-px bg-gray-300 dark:bg-slate-600 my-1"></div>
    </div>
    <div className="pb-8 flex-grow">
      <h4 className="font-semibold text-md text-foreground dark:text-slate-100">{title}</h4>
      <p className="text-xs text-muted-foreground dark:text-slate-400">{new Date(date).toLocaleString()}</p>
      {description && <p className="text-sm mt-1 text-gray-600 dark:text-slate-300">{description}</p>}
      {children && <div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{children}</div>}
    </div>
  </motion.div>
);

const PatientActivityTimeline = ({ patientId, appointments, notes, prescriptions }) => {
  const timelineEvents = [];

  (appointments || []).forEach(app => {
    timelineEvents.push({
      type: 'appointment',
      date: new Date(`${app.date}T${app.time || '00:00:00'}`),
      title: `Appointment: ${app.service || app.notes || 'General Visit'}`,
      description: `Status: ${app.status}${app.cost ? `, Cost: ₹${parseFloat(app.cost).toFixed(2)}` : ''}`,
      icon: CalendarDays,
      color: 'bg-blue-500',
    });
  });

  (notes || []).forEach(note => {
    timelineEvents.push({
      type: 'note',
      date: new Date(note.date),
      title: 'Note Added',
      description: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
      icon: FileText,
      color: 'bg-yellow-500',
    });
  });

  (prescriptions || []).forEach(rx => {
    timelineEvents.push({
      type: 'prescription',
      date: new Date(rx.date),
      title: `Prescription: ${rx.fileName || 'Details Added'}`,
      description: rx.text ? rx.text.substring(0,100) + (rx.text.length > 100 ? '...' : '') : (rx.fileName || 'File Attached'),
      icon: Pill,
      color: 'bg-green-500',
      children: rx.fileUrl && rx.fileUrl.startsWith('data:image') ? 
        <img-replace src={rx.fileUrl} alt={rx.fileName || 'Prescription'} className="mt-1 rounded max-h-24 border dark:border-slate-600" /> : 
        (rx.fileUrl ? <a href={rx.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline dark:text-sky-400">View Attachment</a> : null)
    });
  });
  
  // Placeholder for financial events - this would need actual financial data linked to patient
  // Example:
  // timelineEvents.push({
  //   type: 'payment',
  //   date: new Date(),
  //   title: 'Payment Received',
  //   description: 'Amount: ₹500.00 for Check-up',
  //   icon: DollarSign,
  //   color: 'bg-purple-500',
  // });

  const sortedEvents = timelineEvents.sort((a, b) => b.date - a.date);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ delay: 0.1, duration: 0.4 }}
      className="p-4 md:p-6"
    >
      <h3 className="text-xl font-semibold mb-6 text-primary border-b pb-2 dark:text-sky-400 dark:border-slate-700">Patient Activity Timeline</h3>
      {sortedEvents.length === 0 ? (
        <p className="text-muted-foreground text-center py-8 dark:text-slate-400">No activities recorded for this patient yet.</p>
      ) : (
        <div className="relative">
          {/* This div creates the main vertical line if needed, but items have their own connectors */}
          {/* <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700"></div> */}
          {sortedEvents.map((event, index) => (
            <TimelineItem
              key={`${event.type}-${event.date.toISOString()}-${index}`}
              icon={event.icon}
              title={event.title}
              date={event.date}
              description={event.description}
              color={event.color}
              index={index}
            >
              {event.children}
            </TimelineItem>
          ))}
           {/* Remove the last connector line part for the final item */}
           {sortedEvents.length > 0 && (
             <div className="flex space-x-4">
                <div className="flex flex-col items-center">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-transparent flex items-center justify-center">
                    </div>
                </div>
             </div>
           )}
        </div>
      )}
    </motion.div>
  );
};

export default PatientActivityTimeline;
