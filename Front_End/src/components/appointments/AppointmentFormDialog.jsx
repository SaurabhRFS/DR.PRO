import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Camera, FileText, Image as ImageIcon, X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const AppointmentFormDialog = ({ isOpen, onOpenChange, appointment, onSave }) => {
  const { toast } = useToast();
  
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  // --- FIX: Loading state for double-submit prevention ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraForField, setCameraForField] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const initialFormData = useMemo(() => ({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    notes: '',
    cost: '',
    status: 'Scheduled',
    prescriptionFile: null, prescriptionPreview: null,
    additionalFiles: [], additionalPreviews: [] 
  }), []);

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isOpen) {
        // Reset submitting state when dialog opens
        setIsSubmitting(false);
        
        if (patients.length === 0) {
            const fetchPatients = async () => {
                try {
                const response = await axios.get(`${API_BASE_URL}/patients`);
                setPatients(response.data || []);
                } catch (error) {
                console.error("Failed to load patients:", error);
                }
            };
            fetchPatients();
        }
    }
  }, [isOpen, patients.length]);

  useEffect(() => {
    if (appointment) {
      const existingImages = [
        ...(appointment.fileUrls || []),
        appointment.additionalFileUrl
      ].filter(Boolean);

      setFormData({
        patientId: appointment.patientId || '',
        date: appointment.date || initialFormData.date,
        time: appointment.time || '',
        notes: appointment.notes || '',
        cost: appointment.cost || '',
        status: appointment.status || 'Scheduled',
        prescriptionPreview: appointment.prescriptionUrl || null,
        additionalPreviews: existingImages, 
        additionalFiles: [], 
        prescriptionFile: null, 
      });
      setSelectedPatientId(appointment.patientId || '');
    } else {
      setFormData(initialFormData);
      setSelectedPatientId('');
    }
    setSearchTerm(''); 
  }, [appointment, isOpen, initialFormData]);

  useEffect(() => {
    if (selectedPatientId) {
        setFormData(prev => ({ ...prev, patientId: selectedPatientId }));
    }
  }, [selectedPatientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectPatient = (patientId) => {
    setSelectedPatientId(patientId);
    setSearchTerm(patients.find(p => p.id === patientId)?.name || '');
  };

  const handleFileChange = (e, field) => {
    if (field === 'prescriptionFile') {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, prescriptionFile: file, prescriptionPreview: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    } else {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newPreviews = files.map(f => URL.createObjectURL(f));
            setFormData(prev => ({
                ...prev,
                additionalFiles: [...prev.additionalFiles, ...files],
                additionalPreviews: [...prev.additionalPreviews, ...newPreviews]
            }));
        }
    }
  };

  const startCamera = async (field) => {
    setCameraForField(field);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (err) {
      toast({ title: "Camera Error", description: "Could not access camera.", variant: "destructive" });
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], "capture.png", { type: "image/png" });
        const preview = URL.createObjectURL(blob);
        
        if (cameraForField === 'prescriptionFile') {
            setFormData(prev => ({ ...prev, prescriptionFile: file, prescriptionPreview: preview }));
        } else {
            setFormData(prev => ({
                ...prev,
                additionalFiles: [...prev.additionalFiles, file],
                additionalPreviews: [...prev.additionalPreviews, preview]
            }));
        }
        stopCamera();
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);
  };







  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    if (!formData.patientId || !formData.date) {
      toast({ title: "Missing Fields", description: "Patient and Date are required.", variant: "destructive" });
      return;
    }

    // Lock the button
    setIsSubmitting(true);

    // =========================================================
    // ✅ FIX: Use FormData instead of JSON Object
    // =========================================================
    const submitData = new FormData();

    // 1. Append standard text fields
    // (We convert ID to string just to be safe)
    if (appointment?.id) {
        submitData.append("id", appointment.id);
    }
    submitData.append("patientId", formData.patientId);
    submitData.append("date", formData.date);
    submitData.append("time", formData.time || "");
    submitData.append("notes", formData.notes || "");
    submitData.append("cost", formData.cost || "0");
    submitData.append("status", formData.status || "Scheduled");

    // 2. Append Prescription File (Only if a NEW file is selected)
    // We check 'instanceof File' to make sure we don't send the old URL string
    if (formData.prescriptionFile instanceof File) {
        submitData.append("prescriptionFile", formData.prescriptionFile);
    }

    // 3. Append Additional Files (Loop through the array)
    if (formData.additionalFiles && formData.additionalFiles.length > 0) {
        formData.additionalFiles.forEach((file) => {
            if (file instanceof File) {
              submitData.append("files", file);
            }
        });
    }

    // 4. Send this 'FormData' object to the parent
    // The parent's axios call will automatically detect this 
    // and set the header to 'multipart/form-data'
    onSave(submitData);
    
    // Close modal
    onOpenChange(false);
  };






  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );
  
  const currentPatientName = patients.find(p => p.id === selectedPatientId)?.name;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) stopCamera(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto glassmorphic dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary dark:text-sky-400">
            {appointment ? 'Edit Appointment' : 'Schedule New Appointment'}
          </DialogTitle>
        </DialogHeader>

        {isCameraOpen ? (
          <div className="space-y-4">
            <div className="bg-black aspect-video rounded-md overflow-hidden relative">
               <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"/>
            </div>
            <canvas ref={canvasRef} className="hidden"/>
            <div className="flex gap-2">
               <Button variant="outline" className="flex-1" onClick={stopCamera}>Cancel</Button>
               <Button className="flex-1" onClick={capturePhoto}><Camera className="mr-2 h-4 w-4"/> Capture</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
               <Label className="dark:text-slate-300">
                 {selectedPatientId && currentPatientName ? `Patient: ${currentPatientName}` : 'Search Patient'}
               </Label>
               {!selectedPatientId && (
                 <Input 
                   placeholder="Name or Phone..." 
                   value={searchTerm} 
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="mb-2 dark:bg-slate-700 dark:border-slate-600"
                 />
               )}
               {!selectedPatientId && searchTerm && (
                 <div className="max-h-32 overflow-y-auto border rounded-md dark:border-slate-700 bg-white dark:bg-slate-800 z-10 relative">
                   {filteredPatients.map(p => (
                       <div key={p.id} onClick={() => handleSelectPatient(p.id)} className="p-2 hover:bg-accent dark:hover:bg-slate-700 cursor-pointer border-b last:border-0 dark:border-slate-700">
                         <span className="font-medium">{p.name}</span> <span className="text-xs text-muted-foreground">({p.phone})</span>
                       </div>
                   ))}
                 </div>
               )}
               {selectedPatientId && (
                   <Button type="button" variant="link" size="sm" onClick={() => { setSelectedPatientId(''); setSearchTerm(''); }} className="text-xs text-red-500 p-0 h-auto ml-2">Change</Button>
               )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-slate-300">Date <span className="text-red-500">*</span></Label>
                <Input name="date" type="date" value={formData.date} onChange={handleChange} required className="dark:bg-slate-700 dark:border-slate-600" />
              </div>
              <div>
                <Label className="dark:text-slate-300">Time</Label>
                <Input name="time" type="time" value={formData.time} onChange={handleChange} className="dark:bg-slate-700 dark:border-slate-600" />
              </div>
            </div>

            <div>
              <Label className="dark:text-slate-300">Notes</Label>
              <Textarea name="notes" placeholder="Details..." value={formData.notes} onChange={handleChange} rows={2} className="dark:bg-slate-700 dark:border-slate-600" />
            </div>
            <div>
              <Label className="dark:text-slate-300">Cost (₹)</Label>
              <Input name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} className="dark:bg-slate-700 dark:border-slate-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-3 border rounded bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
                   <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><FileText className="h-3 w-3"/> Prescription</Label>
                   <div className="flex gap-2">
                      <Input type="file" onChange={(e)=>handleFileChange(e,'prescriptionFile')} className="text-xs dark:bg-slate-700"/>
                      <Button type="button" size="icon" variant="outline" onClick={()=>startCamera('prescriptionFile')}><Camera className="h-4 w-4"/></Button>
                   </div>
                   {formData.prescriptionPreview && <img src={formData.prescriptionPreview} className="h-16 rounded border mt-2 bg-white object-contain"/>}
                </div>

                <div className="space-y-2 p-3 border rounded bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
                   <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><ImageIcon className="h-3 w-3"/> X-Rays / Images</Label>
                   <div className="flex gap-2">
                      <Input type="file" multiple onChange={(e)=>handleFileChange(e,'additionalFile')} className="text-xs dark:bg-slate-700"/>
                      <Button type="button" size="icon" variant="outline" onClick={()=>startCamera('additionalFile')}><Camera className="h-4 w-4"/></Button>
                   </div>
                   
                   {formData.additionalPreviews.length > 0 && (
                     <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                        {formData.additionalPreviews.map((src, i) => (
                           <img key={i} src={src} className="h-16 w-16 min-w-[4rem] rounded border bg-white object-cover"/>
                        ))}
                     </div>
                   )}
                </div>
            </div>

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              
              {/* --- FIX: Button Disabled State --- */}
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (appointment ? 'Save Changes' : 'Schedule')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentFormDialog;