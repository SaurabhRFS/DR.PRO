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
        onRecordEdit(data);
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
                            /* ✅ FIX: Extract the ID properly here */
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







// import React, { useState, useMemo, useRef } from 'react';
// import { motion } from 'framer-motion';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
// import { PlusCircle, Trash2, Edit3, Camera, CalendarDays, ArrowDownUp, Info } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuRadioGroup,
//   DropdownMenuRadioItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// // --- FIXED: Date Parser for Arrays [yyyy, mm, dd] & Strings ---
// const parseUniversalDate = (dateInput) => {
//   if (!dateInput) return new Date(0); // Return Epoch if null
//   // Handle Spring Boot Array: [2024, 12, 25]
//   if (Array.isArray(dateInput)) {
//     const [year, month, day] = dateInput;
//     return new Date(year, month - 1, day);
//   }
//   // Handle ISO String: "2024-12-25"
//   return new Date(dateInput);
// };

// const DentalRecordFormDialog = ({ isOpen, onOpenChange, record, onSave }) => {
//   const today = new Date().toISOString().split('T')[0];
//   const { toast } = useToast();
  
//   const [formData, setFormData] = useState({
//     treatmentName: '', notes: '', date: today,
//     prescriptionFile: null, prescriptionPreview: null, prescriptionFileName: '',
//     additionalFile: null, additionalPreview: null, additionalFileName: ''
//   });

//   const [isCameraOpen, setIsCameraOpen] = useState(false);
//   const [cameraForField, setCameraForField] = useState(null); 
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   React.useEffect(() => {
//     if (record) {
//       // Use helper to format date for input (YYYY-MM-DD)
//       let dateStr = today;
//       if (record.date) {
//         const d = parseUniversalDate(record.date);
//         const year = d.getFullYear();
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const day = String(d.getDate()).padStart(2, '0');
//         dateStr = `${year}-${month}-${day}`;
//       }

//       setFormData({
//         treatmentName: record.treatmentName || '',
//         notes: record.notes || '',
//         date: dateStr,
//         prescriptionFileName: record.prescriptionFileName || '',
//         prescriptionPreview: record.prescriptionUrl || null,
//         prescriptionFile: null,
//         additionalFileName: record.additionalFileName || '',
//         additionalPreview: record.additionalFileUrl || null,
//         additionalFile: null
//       });
//     } else {
//       setFormData({
//         treatmentName: '', notes: '', date: today,
//         prescriptionFile: null, prescriptionPreview: null, prescriptionFileName: '',
//         additionalFile: null, additionalPreview: null, additionalFileName: ''
//       });
//     }
//   }, [record, isOpen]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e, fieldType) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         if (fieldType === 'prescription') {
//             setFormData(prev => ({ ...prev, prescriptionFile: file, prescriptionPreview: reader.result, prescriptionFileName: file.name }));
//         } else {
//             setFormData(prev => ({ ...prev, additionalFile: file, additionalPreview: reader.result, additionalFileName: file.name }));
//         }
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const startCamera = async (field) => {
//     setCameraForField(field);
//     setIsCameraOpen(true);
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
//       setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
//     } catch (err) {
//       toast({ title: "Camera Error", description: "Check permissions.", variant: "destructive" });
//       setIsCameraOpen(false);
//     }
//   };

//   const capturePhoto = () => {
//     if (videoRef.current && canvasRef.current) {
//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       const context = canvas.getContext('2d');
//       context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
//       canvas.toBlob((blob) => {
//         if (!blob) return;
//         const file = new File([blob], `capture_${Date.now()}.png`, { type: "image/png" });
//         const previewUrl = URL.createObjectURL(blob);

//         if (cameraForField === 'prescriptionFile') {
//             setFormData(prev => ({ ...prev, prescriptionFile: file, prescriptionPreview: previewUrl, prescriptionFileName: file.name }));
//         } else {
//             setFormData(prev => ({ ...prev, additionalFile: file, additionalPreview: previewUrl, additionalFileName: file.name }));
//         }
//         stopCamera();
//         toast({ title: "Photo Captured" });
//       }, 'image/png');
//     }
//   };

//   const stopCamera = () => {
//     if (videoRef.current?.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach(track => track.stop());
//     }
//     setIsCameraOpen(false);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSave({ ...formData, id: record ? record.id : undefined });
//     onOpenChange(false);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => { if(!open) stopCamera(); onOpenChange(open); }}>
//       <DialogContent className="sm:max-w-lg glassmorphic dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-2xl text-primary dark:text-sky-400">{record ? 'Edit Record' : 'Add New Record'}</DialogTitle>
//         </DialogHeader>
        
//         {isCameraOpen ? (
//           <div className="space-y-4 py-4">
//             <div className="rounded-md overflow-hidden bg-black aspect-video relative">
//                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
//             </div>
//             <canvas ref={canvasRef} className="hidden"></canvas>
//             <div className="flex gap-4">
//               <Button onClick={stopCamera} variant="outline" className="flex-1">Cancel</Button>
//               <Button onClick={capturePhoto} className="flex-1 bg-primary text-white">Capture</Button>
//             </div>
//           </div>
//         ) : (
//           <form onSubmit={handleSubmit} className="space-y-4 py-2">
//             <div className="grid grid-cols-1 gap-4">
//                <div><Label className="dark:text-slate-300">Treatment Name</Label><Input name="treatmentName" value={formData.treatmentName} onChange={handleInputChange} required className="dark:bg-slate-700 dark:text-slate-50"/></div>
//                <div><Label className="dark:text-slate-300">Date</Label><Input name="date" type="date" value={formData.date} onChange={handleInputChange} required className="dark:bg-slate-700 dark:text-slate-50"/></div>
//             </div>
//             <div><Label className="dark:text-slate-300">Notes</Label><Textarea name="notes" value={formData.notes} onChange={handleInputChange} className="dark:bg-slate-700 dark:text-slate-50"/></div>
            
//             <div className="space-y-2 p-3 border rounded-md dark:border-slate-700">
//                <Label className="text-xs uppercase font-semibold text-muted-foreground">Prescription</Label>
//                <div className="flex gap-2">
//                  <Input type="file" accept="image/*,.pdf" onChange={(e)=>handleFileChange(e,'prescription')} className="flex-grow dark:bg-slate-700"/>
//                  <Button type="button" size="icon" variant="outline" onClick={()=>startCamera('prescriptionFile')}><Camera className="h-4 w-4"/></Button>
//                </div>
//                {formData.prescriptionPreview && <img src={formData.prescriptionPreview} alt="Preview" className="h-24 w-auto rounded-md object-contain bg-slate-100 mt-2"/>}
//             </div>

//             <div className="space-y-2 p-3 border rounded-md dark:border-slate-700">
//                <Label className="text-xs uppercase font-semibold text-muted-foreground">X-Ray / Other</Label>
//                <div className="flex gap-2">
//                  <Input type="file" accept="image/*,.pdf" onChange={(e)=>handleFileChange(e,'additional')} className="flex-grow dark:bg-slate-700"/>
//                  <Button type="button" size="icon" variant="outline" onClick={()=>startCamera('additionalFile')}><Camera className="h-4 w-4"/></Button>
//                </div>
//                {formData.additionalPreview && <img src={formData.additionalPreview} alt="Preview" className="h-24 w-auto rounded-md object-contain bg-slate-100 mt-2"/>}
//             </div>

//             <DialogFooter><Button type="submit">{record ? 'Save Changes' : 'Add Record'}</Button></DialogFooter>
//           </form>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// const PatientDentalRecordsTab = ({ patientId, dentalRecords, onRecordAdd, onRecordEdit, onRecordDelete }) => {
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [editingRecord, setEditingRecord] = useState(null);
//   const [sortOrder, setSortOrder] = useState('latest'); 

//   // --- FIX: SORT LOGIC USING PARSER ---
//   const sortedRecords = useMemo(() => {
//     return [...(dentalRecords || [])].sort((a, b) => {
//       const dateA = parseUniversalDate(a.date).getTime(); // Use .getTime() for numbers
//       const dateB = parseUniversalDate(b.date).getTime();
//       return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
//     });
//   }, [dentalRecords, sortOrder]);

//   const handleEdit = (record) => { setEditingRecord(record); setIsFormOpen(true); };
//   const handleAdd = () => { setEditingRecord(null); setIsFormOpen(true); };

//   return (
//     <TooltipProvider>
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-6">
//       <div className="flex justify-between items-center gap-4 mb-6 pb-4 border-b dark:border-slate-700">
//         <h3 className="text-xl font-semibold text-primary dark:text-sky-400">Dental History</h3>
//         <div className="flex gap-2">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild><Button variant="outline" className="dark:text-slate-300 dark:border-slate-600"><ArrowDownUp className="mr-2 h-4 w-4" /> Sort</Button></DropdownMenuTrigger>
//             <DropdownMenuContent className="dark:bg-slate-800">
//                 <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
//                     <DropdownMenuRadioItem value="latest" className="dark:text-slate-200">Latest First</DropdownMenuRadioItem>
//                     <DropdownMenuRadioItem value="oldest" className="dark:text-slate-200">Oldest First</DropdownMenuRadioItem>
//                 </DropdownMenuRadioGroup>
//             </DropdownMenuContent>
//           </DropdownMenu>
//           <Button onClick={handleAdd} className="bg-gradient-to-r from-primary to-purple-600 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
//         </div>
//       </div>

//       <DentalRecordFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} record={editingRecord} onSave={(data) => editingRecord ? onRecordEdit(data) : onRecordAdd(data)} />

//       {sortedRecords.length === 0 ? <p className="text-center text-muted-foreground">No records found.</p> : 
//         <div className="space-y-4">
//           {sortedRecords.map((record, index) => (
//             <motion.div key={record.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//               <Card className="hover:shadow-md bg-background/80 dark:bg-slate-800/70 border dark:border-slate-700">
//                 <CardHeader className="flex flex-row justify-between pt-3 px-4 pb-2">
//                   <div>
//                     <CardTitle className="text-lg text-primary dark:text-sky-400 flex items-center">
//                       {record.treatmentName}
//                       {record.isFromAppointment && <Info className="h-4 w-4 ml-2 text-blue-500"/>}
//                     </CardTitle>
//                     <CardDescription className="flex items-center mt-1 dark:text-slate-400">
//                         <CalendarDays className="h-3.5 w-3.5 mr-1"/> 
//                         {parseUniversalDate(record.date).toLocaleDateString()}
//                     </CardDescription>
//                   </div>
//                   <div className="flex gap-1">
//                     <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}><Edit3 className="h-4 w-4 text-blue-500"/></Button>
//                     <Button variant="ghost" size="icon" onClick={() => onRecordDelete(record.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="px-4 pb-3">
//                   {record.notes && <p className="text-sm text-muted-foreground dark:text-slate-300 mb-2"><strong>Notes:</strong> {record.notes}</p>}
//                   <div className="flex gap-4">
//                     {record.prescriptionUrl && <img src={record.prescriptionUrl} className="h-20 rounded border cursor-pointer hover:scale-105 transition" onClick={()=>window.open(record.prescriptionUrl)} />}
//                     {record.additionalFileUrl && <img src={record.additionalFileUrl} className="h-20 rounded border cursor-pointer hover:scale-105 transition" onClick={()=>window.open(record.additionalFileUrl)} />}
//                   </div>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           ))}
//         </div>
//       }
//     </motion.div>
//     </TooltipProvider>
//   );
// };

// export default PatientDentalRecordsTab;
































// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import AppointmentCard from '@/components/appointments/AppointmentCard'; 
// import AppointmentFormDialog from '@/components/appointments/AppointmentFormDialog';
// import { PlusCircle } from 'lucide-react';
// import { Button } from '@/components/ui/button';

// const PatientDentalRecordsTab = ({ 
//   patientId, 
//   dentalRecords, 
//   onRecordEdit, 
//   onRecordAdd, 
//   onRecordDelete,
//   onStatusChange // <--- ACCEPT THE PROP
// }) => {
//   const [editingApp, setEditingApp] = useState(null);
//   const [isFormOpen, setIsFormOpen] = useState(false);

//   const handleEditClick = (app) => {
//     // Clean the ID if it has the 'app-' prefix
//     const cleanApp = { ...app };
//     if (typeof cleanApp.id === 'string' && cleanApp.id.startsWith('app-')) {
//        cleanApp.id = cleanApp.id.replace('app-', '');
//     }
//     setEditingApp(cleanApp);
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

//   // Sort: Latest first
//   const sortedHistory = [...dentalRecords].sort((a,b) => new Date(b.date) - new Date(a.date));

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

//       <div className="grid grid-cols-1 gap-4">
//         {sortedHistory.length === 0 ? (
//           <p className="text-muted-foreground text-center py-8">No history recorded.</p>
//         ) : (
//           sortedHistory.map((app, index) => (
//              <AppointmentCard 
//                 key={app.id || index}
//                 appointment={app}
//                 patientName={app.patientName || "Current Patient"}
//                 index={index}
//                 onEdit={handleEditClick}
//                 onDelete={onRecordDelete}
//                 onStatusChange={onStatusChange} // <--- PASS TO CARD (Fixes the Error)
//              />
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default PatientDentalRecordsTab;












// import React, { useState, useMemo, useRef } from 'react';
// import { motion } from 'framer-motion';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { 
//   PlusCircle, Trash2, Edit3, Camera, CalendarDays, 
//   ArrowDownUp, Info, DollarSign, FileText, Image as ImageIcon, 
//   Clock, CheckCircle 
// } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuRadioGroup,
//   DropdownMenuRadioItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// // --- Helper: Date Parser ---
// const parseUniversalDate = (dateInput) => {
//   if (!dateInput) return new Date(0);
//   if (Array.isArray(dateInput)) {
//     const [year, month, day] = dateInput;
//     return new Date(year, month - 1, day);
//   }
//   return new Date(dateInput);
// };

// // --- DIALOG COMPONENT ---
// const DentalRecordFormDialog = ({ isOpen, onOpenChange, record, onSave }) => {
//   const today = new Date().toISOString().split('T')[0];
//   const { toast } = useToast();
  
//   const [formData, setFormData] = useState({
//     treatmentName: '', 
//     notes: '', 
//     date: today,
//     cost: '', 
//     prescriptionFile: null, prescriptionPreview: null, prescriptionFileName: '',
//     additionalFile: null, additionalPreview: null, additionalFileName: ''
//   });

//   const [isCameraOpen, setIsCameraOpen] = useState(false);
//   const [cameraForField, setCameraForField] = useState(null); 
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   React.useEffect(() => {
//     if (record) {
//       let dateStr = today;
//       if (record.date) {
//         const d = parseUniversalDate(record.date);
//         const year = d.getFullYear();
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const day = String(d.getDate()).padStart(2, '0');
//         dateStr = `${year}-${month}-${day}`;
//       }

//       // Fix for "Title vs Notes" Bug: Load them distinctly
//       setFormData({
//         treatmentName: record.treatmentName || '',
//         notes: record.notes === record.treatmentName ? '' : (record.notes || ''), // If same, clear notes
//         date: dateStr,
//         cost: record.cost || '',
//         prescriptionFileName: record.prescriptionFileName || '',
//         prescriptionPreview: record.prescriptionUrl || null,
//         prescriptionFile: null,
//         additionalFileName: record.additionalFileName || '',
//         additionalPreview: record.additionalFileUrl || null,
//         additionalFile: null
//       });
//     } else {
//       setFormData({
//         treatmentName: '', notes: '', date: today, cost: '',
//         prescriptionFile: null, prescriptionPreview: null, prescriptionFileName: '',
//         additionalFile: null, additionalPreview: null, additionalFileName: ''
//       });
//     }
//   }, [record, isOpen]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e, fieldType) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         if (fieldType === 'prescription') {
//             setFormData(prev => ({ ...prev, prescriptionFile: file, prescriptionPreview: reader.result, prescriptionFileName: file.name }));
//         } else {
//             setFormData(prev => ({ ...prev, additionalFile: file, additionalPreview: reader.result, additionalFileName: file.name }));
//         }
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const startCamera = async (field) => {
//     setCameraForField(field);
//     setIsCameraOpen(true);
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
//       setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
//     } catch (err) {
//       toast({ title: "Camera Error", description: "Check permissions.", variant: "destructive" });
//       setIsCameraOpen(false);
//     }
//   };

//   const capturePhoto = () => {
//     if (videoRef.current && canvasRef.current) {
//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       const context = canvas.getContext('2d');
//       context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
//       canvas.toBlob((blob) => {
//         if (!blob) return;
//         const file = new File([blob], `capture_${Date.now()}.png`, { type: "image/png" });
//         const previewUrl = URL.createObjectURL(blob);

//         if (cameraForField === 'prescriptionFile') {
//             setFormData(prev => ({ ...prev, prescriptionFile: file, prescriptionPreview: previewUrl, prescriptionFileName: "captured_rx.png" }));
//         } else {
//             setFormData(prev => ({ ...prev, additionalFile: file, additionalPreview: previewUrl, additionalFileName: "captured_xray.png" }));
//         }
//         stopCamera();
//       }, 'image/png');
//     }
//   };

//   const stopCamera = () => {
//     if (videoRef.current?.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach(track => track.stop());
//     }
//     setIsCameraOpen(false);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSave({ ...formData, id: record ? record.id : undefined });
//     onOpenChange(false);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => { if(!open) stopCamera(); onOpenChange(open); }}>
//       <DialogContent className="sm:max-w-lg glassmorphic dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-2xl text-primary dark:text-sky-400">{record ? 'Edit Record' : 'Add New Record'}</DialogTitle>
//         </DialogHeader>
        
//         {isCameraOpen ? (
//           <div className="space-y-4 py-4">
//             <div className="rounded-md overflow-hidden bg-black aspect-video relative">
//                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
//             </div>
//             <canvas ref={canvasRef} className="hidden"></canvas>
//             <div className="flex gap-4">
//               <Button onClick={stopCamera} variant="outline" className="flex-1">Cancel</Button>
//               <Button onClick={capturePhoto} className="flex-1 bg-primary text-white">Capture</Button>
//             </div>
//           </div>
//         ) : (
//           <form onSubmit={handleSubmit} className="space-y-4 py-2">
            
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                <div>
//                  <Label>Treatment Name</Label>
//                  <Input name="treatmentName" placeholder="e.g. Root Canal" value={formData.treatmentName} onChange={handleInputChange} required className="dark:bg-slate-700"/>
//                </div>
//                <div>
//                  <Label>Date</Label>
//                  <Input name="date" type="date" value={formData.date} onChange={handleInputChange} required className="dark:bg-slate-700"/>
//                </div>
//             </div>

//             <div>
//                <Label>Cost ($)</Label>
//                <Input name="cost" type="number" step="0.01" placeholder="0.00" value={formData.cost} onChange={handleInputChange} className="dark:bg-slate-700"/>
//             </div>

//             <div>
//                <Label>Notes (Details)</Label>
//                <Textarea name="notes" placeholder="Detailed description..." value={formData.notes} onChange={handleInputChange} className="dark:bg-slate-700"/>
//             </div>
            
//             {/* File 1 */}
//             <div className="space-y-2 p-3 border rounded-md dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
//                <Label className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-2">
//                  <FileText className="h-4 w-4"/> Prescription / Document
//                </Label>
//                <div className="flex gap-2">
//                  <Input type="file" accept="image/*,.pdf" onChange={(e)=>handleFileChange(e,'prescription')} className="flex-grow dark:bg-slate-700"/>
//                  <Button type="button" size="icon" variant="outline" onClick={()=>startCamera('prescriptionFile')}><Camera className="h-4 w-4"/></Button>
//                </div>
//                {formData.prescriptionPreview && <img src={formData.prescriptionPreview} alt="Preview" className="h-20 w-auto rounded border mt-2"/>}
//             </div>

//             {/* File 2 */}
//             <div className="space-y-2 p-3 border rounded-md dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
//                <Label className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-2">
//                  <ImageIcon className="h-4 w-4"/> X-Ray / Image
//                </Label>
//                <div className="flex gap-2">
//                  <Input type="file" accept="image/*,.pdf" onChange={(e)=>handleFileChange(e,'additional')} className="flex-grow dark:bg-slate-700"/>
//                  <Button type="button" size="icon" variant="outline" onClick={()=>startCamera('additionalFile')}><Camera className="h-4 w-4"/></Button>
//                </div>
//                {formData.additionalPreview && <img src={formData.additionalPreview} alt="Preview" className="h-20 w-auto rounded border mt-2"/>}
//             </div>

//             <DialogFooter><Button type="submit">{record ? 'Save Changes' : 'Add Record'}</Button></DialogFooter>
//           </form>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// // --- MAIN LIST COMPONENT ---
// const PatientDentalRecordsTab = ({ patientId, dentalRecords, onRecordAdd, onRecordEdit, onRecordDelete }) => {
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [editingRecord, setEditingRecord] = useState(null);
//   const [sortOrder, setSortOrder] = useState('latest'); 

//   const sortedRecords = useMemo(() => {
//     return [...(dentalRecords || [])].sort((a, b) => {
//       const dateA = parseUniversalDate(a.date).getTime();
//       const dateB = parseUniversalDate(b.date).getTime();
//       return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
//     });
//   }, [dentalRecords, sortOrder]);

//   const handleEdit = (record) => { setEditingRecord(record); setIsFormOpen(true); };
//   const handleAdd = () => { setEditingRecord(null); setIsFormOpen(true); };

//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-6">
//       <div className="flex justify-between items-center gap-4 mb-4 pb-4 border-b dark:border-slate-700">
//         <h3 className="text-xl font-semibold text-primary dark:text-sky-400">Dental & Appointment History</h3>
//         <div className="flex gap-2">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><ArrowDownUp className="mr-2 h-4 w-4" /> Sort</Button></DropdownMenuTrigger>
//             <DropdownMenuContent><DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}><DropdownMenuRadioItem value="latest">Latest First</DropdownMenuRadioItem><DropdownMenuRadioItem value="oldest">Oldest First</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent>
//           </DropdownMenu>
//           <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-primary to-purple-600 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
//         </div>
//       </div>

//       <DentalRecordFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} record={editingRecord} onSave={(data) => editingRecord ? onRecordEdit(data) : onRecordAdd(data)} />

//       {sortedRecords.length === 0 ? <p className="text-center text-muted-foreground py-10">No history found.</p> : 
//         <div className="space-y-4">
//           {sortedRecords.map((record, index) => (
//             <motion.div key={record.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              
//               {/* --- CARD DESIGN MATCHING APPOINTMENTS --- */}
//               <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500 overflow-hidden">
//                 <CardHeader className="flex flex-row justify-between pt-4 px-4 pb-2">
//                   <div>
//                     <CardTitle className="text-lg font-bold text-primary dark:text-sky-400 flex items-center gap-2">
//                       {record.treatmentName || "General Visit"}
//                       {record.isFromAppointment && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">APPOINTMENT</span>}
//                     </CardTitle>
//                     <CardDescription className="flex items-center mt-1 text-sm dark:text-slate-400">
//                         <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground"/> 
//                         {parseUniversalDate(record.date).toLocaleDateString()}
//                     </CardDescription>
//                   </div>
                  
//                   <div className="flex gap-1">
//                     <Button variant="ghost" size="icon" onClick={() => handleEdit(record)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"><Edit3 className="h-4 w-4"/></Button>
//                     <Button variant="ghost" size="icon" onClick={() => onRecordDelete(record.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
//                   </div>
//                 </CardHeader>

//                 <CardContent className="px-4 pb-4">
//                   {/* Logic to hide Notes if they are just a duplicate of Title */}
//                   {record.notes && record.notes !== record.treatmentName && (
//                      <div className="mb-3 text-sm text-foreground/80 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md border dark:border-slate-700">
//                         {record.notes}
//                      </div>
//                   )}

//                   <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2">
//                      <div className="flex gap-3">
//                         {record.prescriptionUrl && (
//                             <div className="group relative cursor-pointer" onClick={()=>window.open(record.prescriptionUrl)}>
//                                 <img src={record.prescriptionUrl} className="h-14 w-14 object-cover rounded-md border hover:scale-105 transition-transform" />
//                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center text-white text-[10px]">View</div>
//                             </div>
//                         )}
//                         {record.additionalFileUrl && (
//                             <div className="group relative cursor-pointer" onClick={()=>window.open(record.additionalFileUrl)}>
//                                 <img src={record.additionalFileUrl} className="h-14 w-14 object-cover rounded-md border hover:scale-105 transition-transform" />
//                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center text-white text-[10px]">View</div>
//                             </div>
//                         )}
//                      </div>

//                      {record.cost > 0 && (
//                         <div className="flex items-center text-green-700 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md border border-green-100 dark:border-green-800">
//                            <DollarSign className="h-4 w-4 mr-1"/>{parseFloat(record.cost).toFixed(2)}
//                         </div>
//                      )}
//                   </div>
//                 </CardContent>
//               </Card>

//             </motion.div>
//           ))}
//         </div>
//       }
//     </motion.div>
//   );
// };

// export default PatientDentalRecordsTab;
















// import React, { useState, useMemo, useRef } from 'react';
// import { motion } from 'framer-motion';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { PlusCircle, Trash2, Edit3, Camera, CalendarDays, ArrowDownUp, Info, DollarSign, FileText, Image as ImageIcon } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuRadioGroup,
//   DropdownMenuRadioItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { TooltipProvider } from "@/components/ui/tooltip";

// // --- Helper: Date Parser ---
// const parseUniversalDate = (dateInput) => {
//   if (!dateInput) return new Date(0);
//   if (Array.isArray(dateInput)) {
//     const [year, month, day] = dateInput;
//     return new Date(year, month - 1, day);
//   }
//   return new Date(dateInput);
// };

// const DentalRecordFormDialog = ({ isOpen, onOpenChange, record, onSave }) => {
//   const today = new Date().toISOString().split('T')[0];
//   const { toast } = useToast();
  
//   const [formData, setFormData] = useState({
//     treatmentName: '', 
//     notes: '', 
//     date: today,
//     cost: '', 
//     prescriptionFile: null, prescriptionPreview: null, prescriptionFileName: '',
//     additionalFile: null, additionalPreview: null, additionalFileName: ''
//   });

//   // Camera State
//   const [isCameraOpen, setIsCameraOpen] = useState(false);
//   const [cameraForField, setCameraForField] = useState(null); 
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   React.useEffect(() => {
//     if (record) {
//       let dateStr = today;
//       if (record.date) {
//         const d = parseUniversalDate(record.date);
//         const year = d.getFullYear();
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const day = String(d.getDate()).padStart(2, '0');
//         dateStr = `${year}-${month}-${day}`;
//       }

//       setFormData({
//         treatmentName: record.treatmentName || '',
//         notes: record.notes || '',
//         date: dateStr,
//         cost: record.cost || '',
//         prescriptionFileName: record.prescriptionFileName || '',
//         prescriptionPreview: record.prescriptionUrl || null,
//         prescriptionFile: null,
//         additionalFileName: record.additionalFileName || '',
//         additionalPreview: record.additionalFileUrl || null,
//         additionalFile: null
//       });
//     } else {
//       setFormData({
//         treatmentName: '', notes: '', date: today, cost: '',
//         prescriptionFile: null, prescriptionPreview: null, prescriptionFileName: '',
//         additionalFile: null, additionalPreview: null, additionalFileName: ''
//       });
//     }
//   }, [record, isOpen]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e, fieldType) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         if (fieldType === 'prescription') {
//             setFormData(prev => ({ ...prev, prescriptionFile: file, prescriptionPreview: reader.result, prescriptionFileName: file.name }));
//         } else {
//             setFormData(prev => ({ ...prev, additionalFile: file, additionalPreview: reader.result, additionalFileName: file.name }));
//         }
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   // --- Camera Logic ---
//   const startCamera = async (field) => {
//     setCameraForField(field);
//     setIsCameraOpen(true);
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
//       setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
//     } catch (err) {
//       toast({ title: "Camera Error", description: "Check permissions.", variant: "destructive" });
//       setIsCameraOpen(false);
//     }
//   };

//   const capturePhoto = () => {
//     if (videoRef.current && canvasRef.current) {
//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       const context = canvas.getContext('2d');
//       context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
//       canvas.toBlob((blob) => {
//         if (!blob) return;
//         const file = new File([blob], `capture_${Date.now()}.png`, { type: "image/png" });
//         const previewUrl = URL.createObjectURL(blob);

//         if (cameraForField === 'prescriptionFile') {
//             setFormData(prev => ({ ...prev, prescriptionFile: file, prescriptionPreview: previewUrl, prescriptionFileName: "captured_rx.png" }));
//         } else {
//             setFormData(prev => ({ ...prev, additionalFile: file, additionalPreview: previewUrl, additionalFileName: "captured_xray.png" }));
//         }
//         stopCamera();
//         toast({ title: "Photo Captured" });
//       }, 'image/png');
//     }
//   };

//   const stopCamera = () => {
//     if (videoRef.current?.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach(track => track.stop());
//     }
//     setIsCameraOpen(false);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSave({ ...formData, id: record ? record.id : undefined });
//     onOpenChange(false);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => { if(!open) stopCamera(); onOpenChange(open); }}>
//       <DialogContent className="sm:max-w-lg glassmorphic dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-2xl text-primary dark:text-sky-400">{record ? 'Edit Record' : 'Add New Record'}</DialogTitle>
//         </DialogHeader>
        
//         {isCameraOpen ? (
//           <div className="space-y-4 py-4">
//             <div className="rounded-md overflow-hidden bg-black aspect-video relative">
//                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
//             </div>
//             <canvas ref={canvasRef} className="hidden"></canvas>
//             <div className="flex gap-4">
//               <Button onClick={stopCamera} variant="outline" className="flex-1">Cancel</Button>
//               <Button onClick={capturePhoto} className="flex-1 bg-primary text-white">Capture</Button>
//             </div>
//           </div>
//         ) : (
//           <form onSubmit={handleSubmit} className="space-y-4 py-2">
            
//             {/* Treatment Name & Date */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                <div>
//                  <Label>Treatment Name (Title)</Label>
//                  <Input name="treatmentName" placeholder="e.g. Root Canal" value={formData.treatmentName} onChange={handleInputChange} required className="dark:bg-slate-700"/>
//                </div>
//                <div>
//                  <Label>Date</Label>
//                  <Input name="date" type="date" value={formData.date} onChange={handleInputChange} required className="dark:bg-slate-700"/>
//                </div>
//             </div>

//             {/* Cost */}
//             <div>
//                <Label>Cost ($)</Label>
//                <Input name="cost" type="number" step="0.01" placeholder="0.00" value={formData.cost} onChange={handleInputChange} className="dark:bg-slate-700"/>
//             </div>

//             {/* Notes */}
//             <div>
//                <Label>Notes / Details</Label>
//                <Textarea name="notes" placeholder="Detailed description of the procedure..." value={formData.notes} onChange={handleInputChange} className="dark:bg-slate-700"/>
//             </div>
            
//             {/* File 1: Prescription */}
//             <div className="space-y-2 p-3 border rounded-md dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
//                <Label className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-2">
//                  <FileText className="h-4 w-4"/> Prescription / Document
//                </Label>
//                <div className="flex gap-2">
//                  <Input type="file" accept="image/*,.pdf" onChange={(e)=>handleFileChange(e,'prescription')} className="flex-grow dark:bg-slate-700"/>
//                  <Button type="button" size="icon" variant="outline" onClick={()=>startCamera('prescriptionFile')}><Camera className="h-4 w-4"/></Button>
//                </div>
//                {formData.prescriptionPreview && (
//                  <div className="mt-2 relative group w-fit">
//                     <img src={formData.prescriptionPreview} alt="Preview" className="h-20 w-auto rounded border bg-white object-contain"/>
//                     <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{formData.prescriptionFileName}</div>
//                  </div>
//                )}
//             </div>

//             {/* File 2: X-Ray */}
//             <div className="space-y-2 p-3 border rounded-md dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
//                <Label className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-2">
//                  <ImageIcon className="h-4 w-4"/> X-Ray / Additional Image
//                </Label>
//                <div className="flex gap-2">
//                  <Input type="file" accept="image/*,.pdf" onChange={(e)=>handleFileChange(e,'additional')} className="flex-grow dark:bg-slate-700"/>
//                  <Button type="button" size="icon" variant="outline" onClick={()=>startCamera('additionalFile')}><Camera className="h-4 w-4"/></Button>
//                </div>
//                {formData.additionalPreview && (
//                  <div className="mt-2 relative group w-fit">
//                     <img src={formData.additionalPreview} alt="Preview" className="h-20 w-auto rounded border bg-white object-contain"/>
//                     <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{formData.additionalFileName}</div>
//                  </div>
//                )}
//             </div>

//             <DialogFooter><Button type="submit">{record ? 'Save Changes' : 'Add Record'}</Button></DialogFooter>
//           </form>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// const PatientDentalRecordsTab = ({ patientId, dentalRecords, onRecordAdd, onRecordEdit, onRecordDelete }) => {
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [editingRecord, setEditingRecord] = useState(null);
//   const [sortOrder, setSortOrder] = useState('latest'); 

//   const sortedRecords = useMemo(() => {
//     return [...(dentalRecords || [])].sort((a, b) => {
//       const dateA = parseUniversalDate(a.date).getTime();
//       const dateB = parseUniversalDate(b.date).getTime();
//       return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
//     });
//   }, [dentalRecords, sortOrder]);

//   const handleEdit = (record) => { setEditingRecord(record); setIsFormOpen(true); };
//   const handleAdd = () => { setEditingRecord(null); setIsFormOpen(true); };

//   return (
//     <TooltipProvider>
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-6">
//       <div className="flex justify-between items-center gap-4 mb-6 pb-4 border-b dark:border-slate-700">
//         <h3 className="text-xl font-semibold text-primary dark:text-sky-400">Dental History</h3>
//         <div className="flex gap-2">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild><Button variant="outline" className="dark:text-slate-300 dark:border-slate-600"><ArrowDownUp className="mr-2 h-4 w-4" /> Sort</Button></DropdownMenuTrigger>
//             <DropdownMenuContent className="dark:bg-slate-800">
//                 <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
//                     <DropdownMenuRadioItem value="latest">Latest First</DropdownMenuRadioItem>
//                     <DropdownMenuRadioItem value="oldest">Oldest First</DropdownMenuRadioItem>
//                 </DropdownMenuRadioGroup>
//             </DropdownMenuContent>
//           </DropdownMenu>
//           <Button onClick={handleAdd} className="bg-gradient-to-r from-primary to-purple-600 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
//         </div>
//       </div>

//       <DentalRecordFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} record={editingRecord} onSave={(data) => editingRecord ? onRecordEdit(data) : onRecordAdd(data)} />

//       {sortedRecords.length === 0 ? <p className="text-center text-muted-foreground">No records found.</p> : 
//         <div className="space-y-4">
//           {sortedRecords.map((record, index) => (
//             <motion.div key={record.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//               {/* --- CARD DESIGN UPDATED TO MATCH APPOINTMENT STYLE --- */}
//               <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500 bg-background/80 dark:bg-slate-800/70 border-t dark:border-t-slate-700 border-r dark:border-r-slate-700 border-b dark:border-b-slate-700">
//                 <CardHeader className="flex flex-row justify-between pt-4 px-4 pb-2">
//                   <div>
//                     <CardTitle className="text-lg font-bold text-primary dark:text-sky-400 flex items-center">
//                       {record.treatmentName || "Untitled Treatment"}
//                       {record.isFromAppointment && 
//                          <span className="ml-2 text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
//                             <Info className="h-3 w-3 mr-1"/> From Appt
//                          </span>
//                       }
//                     </CardTitle>
//                     <CardDescription className="flex items-center mt-1 text-sm dark:text-slate-400">
//                         <CalendarDays className="h-3.5 w-3.5 mr-1.5"/> 
//                         {parseUniversalDate(record.date).toLocaleDateString()}
//                     </CardDescription>
//                   </div>
                  
//                   {/* Actions */}
//                   <div className="flex gap-1">
//                     <Button variant="ghost" size="icon" onClick={() => handleEdit(record)} title="Edit Record">
//                         <Edit3 className="h-4 w-4 text-blue-500"/>
//                     </Button>
//                     <Button variant="ghost" size="icon" onClick={() => onRecordDelete(record.id)} title="Delete Record">
//                         <Trash2 className="h-4 w-4 text-red-500"/>
//                     </Button>
//                   </div>
//                 </CardHeader>

//                 <CardContent className="px-4 pb-4">
                  
//                   {/* Notes Section */}
//                   <div className="mb-3 text-sm text-foreground/80 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md border dark:border-slate-700">
//                     <span className="font-semibold text-xs uppercase text-muted-foreground block mb-1">Notes / Details:</span>
//                     {record.notes || "No additional notes provided."}
//                   </div>

//                   <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
//                      {/* Images Section */}
//                      <div className="flex gap-3">
//                         {record.prescriptionUrl && (
//                             <div className="group relative">
//                                 <img 
//                                     src={record.prescriptionUrl} 
//                                     className="h-16 w-16 object-cover rounded-md border cursor-pointer hover:scale-110 transition-transform shadow-sm" 
//                                     onClick={()=>window.open(record.prescriptionUrl)} 
//                                     title="View Prescription"
//                                 />
//                                 <div className="absolute -bottom-5 left-0 text-[10px] text-center w-full font-medium text-muted-foreground">Rx</div>
//                             </div>
//                         )}
//                         {record.additionalFileUrl && (
//                             <div className="group relative">
//                                 <img 
//                                     src={record.additionalFileUrl} 
//                                     className="h-16 w-16 object-cover rounded-md border cursor-pointer hover:scale-110 transition-transform shadow-sm" 
//                                     onClick={()=>window.open(record.additionalFileUrl)} 
//                                     title="View X-Ray/Doc"
//                                 />
//                                 <div className="absolute -bottom-5 left-0 text-[10px] text-center w-full font-medium text-muted-foreground">X-Ray</div>
//                             </div>
//                         )}
//                      </div>

//                      {/* Cost Badge */}
//                      {record.cost > 0 && (
//                         <div className="flex items-center text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
//                            <DollarSign className="h-4 w-4 mr-1"/>
//                            {parseFloat(record.cost).toFixed(2)}
//                         </div>
//                      )}
//                   </div>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           ))}
//         </div>
//       }
//     </motion.div>
//     </TooltipProvider>
//   );
// };

// export default PatientDentalRecordsTab;