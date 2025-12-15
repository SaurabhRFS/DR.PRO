import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Edit3, Camera, CalendarDays, ArrowDownUp, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- FIXED: Date Parser for Arrays [yyyy, mm, dd] & Strings ---
const parseUniversalDate = (dateInput) => {
  if (!dateInput) return new Date(0); // Return Epoch if null
  // Handle Spring Boot Array: [2024, 12, 25]
  if (Array.isArray(dateInput)) {
    const [year, month, day] = dateInput;
    return new Date(year, month - 1, day);
  }
  // Handle ISO String: "2024-12-25"
  return new Date(dateInput);
};

const DentalRecordFormDialog = ({ isOpen, onOpenChange, record, onSave }) => {
  const today = new Date().toISOString().split('T')[0];
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    treatmentName: '', notes: '', date: today,
    prescriptionFile: null, prescriptionPreview: null, prescriptionFileName: '',
    additionalFile: null, additionalPreview: null, additionalFileName: ''
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraForField, setCameraForField] = useState(null); 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  React.useEffect(() => {
    if (record) {
      // Use helper to format date for input (YYYY-MM-DD)
      let dateStr = today;
      if (record.date) {
        const d = parseUniversalDate(record.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }

      setFormData({
        treatmentName: record.treatmentName || '',
        notes: record.notes || '',
        date: dateStr,
        prescriptionFileName: record.prescriptionFileName || '',
        prescriptionPreview: record.prescriptionUrl || null,
        prescriptionFile: null,
        additionalFileName: record.additionalFileName || '',
        additionalPreview: record.additionalFileUrl || null,
        additionalFile: null
      });
    } else {
      setFormData({
        treatmentName: '', notes: '', date: today,
        prescriptionFile: null, prescriptionPreview: null, prescriptionFileName: '',
        additionalFile: null, additionalPreview: null, additionalFileName: ''
      });
    }
  }, [record, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldType) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (fieldType === 'prescription') {
            setFormData(prev => ({ ...prev, prescriptionFile: file, prescriptionPreview: reader.result, prescriptionFileName: file.name }));
        } else {
            setFormData(prev => ({ ...prev, additionalFile: file, additionalPreview: reader.result, additionalFileName: file.name }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async (field) => {
    setCameraForField(field);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (err) {
      toast({ title: "Camera Error", description: "Check permissions.", variant: "destructive" });
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], `capture_${Date.now()}.png`, { type: "image/png" });
        const previewUrl = URL.createObjectURL(blob);

        if (cameraForField === 'prescriptionFile') {
            setFormData(prev => ({ ...prev, prescriptionFile: file, prescriptionPreview: previewUrl, prescriptionFileName: file.name }));
        } else {
            setFormData(prev => ({ ...prev, additionalFile: file, additionalPreview: previewUrl, additionalFileName: file.name }));
        }
        stopCamera();
        toast({ title: "Photo Captured" });
      }, 'image/png');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: record ? record.id : undefined });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) stopCamera(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-lg glassmorphic dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary dark:text-sky-400">{record ? 'Edit Record' : 'Add New Record'}</DialogTitle>
        </DialogHeader>
        
        {isCameraOpen ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md overflow-hidden bg-black aspect-video relative">
               <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="flex gap-4">
              <Button onClick={stopCamera} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={capturePhoto} className="flex-1 bg-primary text-white">Capture</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4">
               <div><Label className="dark:text-slate-300">Treatment Name</Label><Input name="treatmentName" value={formData.treatmentName} onChange={handleInputChange} required className="dark:bg-slate-700 dark:text-slate-50"/></div>
               <div><Label className="dark:text-slate-300">Date</Label><Input name="date" type="date" value={formData.date} onChange={handleInputChange} required className="dark:bg-slate-700 dark:text-slate-50"/></div>
            </div>
            <div><Label className="dark:text-slate-300">Notes</Label><Textarea name="notes" value={formData.notes} onChange={handleInputChange} className="dark:bg-slate-700 dark:text-slate-50"/></div>
            
            <div className="space-y-2 p-3 border rounded-md dark:border-slate-700">
               <Label className="text-xs uppercase font-semibold text-muted-foreground">Prescription</Label>
               <div className="flex gap-2">
                 <Input type="file" accept="image/*,.pdf" onChange={(e)=>handleFileChange(e,'prescription')} className="flex-grow dark:bg-slate-700"/>
                 <Button type="button" size="icon" variant="outline" onClick={()=>startCamera('prescriptionFile')}><Camera className="h-4 w-4"/></Button>
               </div>
               {formData.prescriptionPreview && <img src={formData.prescriptionPreview} alt="Preview" className="h-24 w-auto rounded-md object-contain bg-slate-100 mt-2"/>}
            </div>

            <div className="space-y-2 p-3 border rounded-md dark:border-slate-700">
               <Label className="text-xs uppercase font-semibold text-muted-foreground">X-Ray / Other</Label>
               <div className="flex gap-2">
                 <Input type="file" accept="image/*,.pdf" onChange={(e)=>handleFileChange(e,'additional')} className="flex-grow dark:bg-slate-700"/>
                 <Button type="button" size="icon" variant="outline" onClick={()=>startCamera('additionalFile')}><Camera className="h-4 w-4"/></Button>
               </div>
               {formData.additionalPreview && <img src={formData.additionalPreview} alt="Preview" className="h-24 w-auto rounded-md object-contain bg-slate-100 mt-2"/>}
            </div>

            <DialogFooter><Button type="submit">{record ? 'Save Changes' : 'Add Record'}</Button></DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PatientDentalRecordsTab = ({ patientId, dentalRecords, onRecordAdd, onRecordEdit, onRecordDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [sortOrder, setSortOrder] = useState('latest'); 

  // --- FIX: SORT LOGIC USING PARSER ---
  const sortedRecords = useMemo(() => {
    return [...(dentalRecords || [])].sort((a, b) => {
      const dateA = parseUniversalDate(a.date).getTime(); // Use .getTime() for numbers
      const dateB = parseUniversalDate(b.date).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });
  }, [dentalRecords, sortOrder]);

  const handleEdit = (record) => { setEditingRecord(record); setIsFormOpen(true); };
  const handleAdd = () => { setEditingRecord(null); setIsFormOpen(true); };

  return (
    <TooltipProvider>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center gap-4 mb-6 pb-4 border-b dark:border-slate-700">
        <h3 className="text-xl font-semibold text-primary dark:text-sky-400">Dental History</h3>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" className="dark:text-slate-300 dark:border-slate-600"><ArrowDownUp className="mr-2 h-4 w-4" /> Sort</Button></DropdownMenuTrigger>
            <DropdownMenuContent className="dark:bg-slate-800">
                <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
                    <DropdownMenuRadioItem value="latest" className="dark:text-slate-200">Latest First</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="oldest" className="dark:text-slate-200">Oldest First</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAdd} className="bg-gradient-to-r from-primary to-purple-600 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
        </div>
      </div>

      <DentalRecordFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} record={editingRecord} onSave={(data) => editingRecord ? onRecordEdit(data) : onRecordAdd(data)} />

      {sortedRecords.length === 0 ? <p className="text-center text-muted-foreground">No records found.</p> : 
        <div className="space-y-4">
          {sortedRecords.map((record, index) => (
            <motion.div key={record.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:shadow-md bg-background/80 dark:bg-slate-800/70 border dark:border-slate-700">
                <CardHeader className="flex flex-row justify-between pt-3 px-4 pb-2">
                  <div>
                    <CardTitle className="text-lg text-primary dark:text-sky-400 flex items-center">
                      {record.treatmentName}
                      {record.isFromAppointment && <Info className="h-4 w-4 ml-2 text-blue-500"/>}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1 dark:text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5 mr-1"/> 
                        {parseUniversalDate(record.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}><Edit3 className="h-4 w-4 text-blue-500"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => onRecordDelete(record.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {record.notes && <p className="text-sm text-muted-foreground dark:text-slate-300 mb-2"><strong>Notes:</strong> {record.notes}</p>}
                  <div className="flex gap-4">
                    {record.prescriptionUrl && <img src={record.prescriptionUrl} className="h-20 rounded border cursor-pointer hover:scale-105 transition" onClick={()=>window.open(record.prescriptionUrl)} />}
                    {record.additionalFileUrl && <img src={record.additionalFileUrl} className="h-20 rounded border cursor-pointer hover:scale-105 transition" onClick={()=>window.open(record.additionalFileUrl)} />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      }
    </motion.div>
    </TooltipProvider>
  );
};

export default PatientDentalRecordsTab;