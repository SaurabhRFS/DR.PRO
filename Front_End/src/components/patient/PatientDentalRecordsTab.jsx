import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import AppointmentCard from '@/components/appointments/AppointmentCard'; 
import AppointmentFormDialog from '@/components/appointments/AppointmentFormDialog';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const parseUniversalDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (Array.isArray(dateInput)) {
    const [y, m, d] = dateInput;
    return new Date(y, m - 1, d);
  }
  return new Date(dateInput);
};

const PatientDentalRecordsTab = ({ 
  patientId, 
  dentalRecords, 
  onRecordEdit, 
  onRecordAdd, 
  onRecordDelete,
  onStatusChange 
}) => {
  const [editingApp, setEditingApp] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEditClick = (app) => {
    // DO NOT remove the prefix. The parent component (PatientDetailPage)
    // needs the 'app-' prefix to know this is an Appointment, not a Dental Record.
    setEditingApp(app);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingApp(null);
    setIsFormOpen(true);
  };

  const handleSave = (data) => {
    if (editingApp) {
        // ✅ FIX: Explicitly merge the original ID.
        // The dialog usually returns only the form fields, so we lose the ID without this.
        onRecordEdit({ ...data, id: editingApp.id });
    } else {
        onRecordAdd(data);
    }
    setIsFormOpen(false);
  };

  const groupedRecords = useMemo(() => {
    const groups = {};
    const sorted = [...dentalRecords].sort((a,b) => parseUniversalDate(b.date) - parseUniversalDate(a.date));
    
    sorted.forEach(app => {
        const d = parseUniversalDate(app.date);
        const dateKey = d.toDateString(); 
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(app);
    });
    return groups;
  }, [dentalRecords]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl font-semibold text-primary dark:text-sky-400">Appointment History</h3>
          <Button onClick={handleAddNew} size="sm" className="bg-gradient-to-r from-primary to-purple-600 text-white">
             <PlusCircle className="mr-2 h-4 w-4" /> Add Record
          </Button>
      </div>
      
      <AppointmentFormDialog 
         isOpen={isFormOpen} 
         onOpenChange={setIsFormOpen} 
         appointment={editingApp} 
         onSave={handleSave}
         patientId={patientId}
      />

      <div className="space-y-6">
        {Object.keys(groupedRecords).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No history recorded.</p>
        ) : (
          Object.keys(groupedRecords).map(dateKey => (
             <div key={dateKey} className="space-y-3">
                <div className="flex items-center gap-4 pt-2">
                  <div className="h-px flex-1 bg-border dark:bg-slate-700"/>
                  <span className="text-sm font-medium text-muted-foreground">{dateKey}</span>
                  <div className="h-px flex-1 bg-border dark:bg-slate-700"/>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {groupedRecords[dateKey].map((app, index) => (
                        <AppointmentCard 
                            key={app.id || index}
                            appointment={app}
                            patientName={app.patientName || "Current Patient"}
                            index={index}
                            onEdit={handleEditClick}
                            /* ✅ Ensure ID is passed for deletion too */
                            onDelete={(record) => onRecordDelete(record.id)} 
                            onStatusChange={onStatusChange}
                        />
                    ))}
                </div>
             </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientDentalRecordsTab;









// import React, { useState, useMemo } from 'react';
// import { motion } from 'framer-motion';
// import AppointmentCard from '@/components/appointments/AppointmentCard'; 
// import AppointmentFormDialog from '@/components/appointments/AppointmentFormDialog';
// import { PlusCircle } from 'lucide-react';
// import { Button } from '@/components/ui/button';

// const parseUniversalDate = (dateInput) => {
//   if (!dateInput) return new Date();
//   if (Array.isArray(dateInput)) {
//     const [y, m, d] = dateInput;
//     return new Date(y, m - 1, d);
//   }
//   return new Date(dateInput);
// };

// const PatientDentalRecordsTab = ({ 
//   patientId, 
//   dentalRecords, 
//   onRecordEdit, 
//   onRecordAdd, 
//   onRecordDelete,
//   onStatusChange 
// }) => {
//   const [editingApp, setEditingApp] = useState(null);
//   const [isFormOpen, setIsFormOpen] = useState(false);

//   const handleEditClick = (app) => {
//     // DO NOT remove the prefix. The parent component (PatientDetailPage)
//     // needs the 'app-' prefix to know this is an Appointment, not a Dental Record.
//     setEditingApp(app);
//     setIsFormOpen(true);
//   };

//   const handleAddNew = () => {
//     setEditingApp(null);
//     setIsFormOpen(true);
//   };

//   const handleSave = (data) => {
//     if (editingApp) {
//         onRecordEdit(data);
//     } else {
//         onRecordAdd(data);
//     }
//     setIsFormOpen(false);
//   };

//   const groupedRecords = useMemo(() => {
//     const groups = {};
//     const sorted = [...dentalRecords].sort((a,b) => parseUniversalDate(b.date) - parseUniversalDate(a.date));
    
//     sorted.forEach(app => {
//         const d = parseUniversalDate(app.date);
//         const dateKey = d.toDateString(); 
//         if (!groups[dateKey]) groups[dateKey] = [];
//         groups[dateKey].push(app);
//     });
//     return groups;
//   }, [dentalRecords]);

//   return (
//     <div className="p-4 space-y-6">
//       <div className="flex justify-between items-center border-b pb-4">
//           <h3 className="text-xl font-semibold text-primary dark:text-sky-400">Appointment History</h3>
//           <Button onClick={handleAddNew} size="sm" className="bg-gradient-to-r from-primary to-purple-600 text-white">
//              <PlusCircle className="mr-2 h-4 w-4" /> Add Record
//           </Button>
//       </div>
      
//       <AppointmentFormDialog 
//          isOpen={isFormOpen} 
//          onOpenChange={setIsFormOpen} 
//          appointment={editingApp} 
//          onSave={handleSave}
//          patientId={patientId}
//       />

//       <div className="space-y-6">
//         {Object.keys(groupedRecords).length === 0 ? (
//           <p className="text-muted-foreground text-center py-8">No history recorded.</p>
//         ) : (
//           Object.keys(groupedRecords).map(dateKey => (
//              <div key={dateKey} className="space-y-3">
//                 <div className="flex items-center gap-4 pt-2">
//                   <div className="h-px flex-1 bg-border dark:bg-slate-700"/>
//                   <span className="text-sm font-medium text-muted-foreground">{dateKey}</span>
//                   <div className="h-px flex-1 bg-border dark:bg-slate-700"/>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4">
//                     {groupedRecords[dateKey].map((app, index) => (
//                         <AppointmentCard 
//                             key={app.id || index}
//                             appointment={app}
//                             patientName={app.patientName || "Current Patient"}
//                             index={index}
//                             onEdit={handleEditClick}
//                             /* ✅ FIX: Extract the ID properly here */
//                             onDelete={(record) => onRecordDelete(record.id)} 
//                             onStatusChange={onStatusChange}
//                         />
//                     ))}
//                 </div>
//              </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default PatientDentalRecordsTab;