import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Edit3, FileImage, Camera, Upload, CalendarDays, ArrowDownUp, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DentalRecordFormDialog = ({ isOpen, onOpenChange, record, onSave }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // LOGIC FIX: We separate "Preview" (String) from "File" (Object)
  const [formData, setFormData] = useState({
    treatmentName: '',
    notes: '',
    date: today,
    
    // Display fields (URLs or Data Strings)
    prescriptionFileName: '',
    prescriptionPreview: null,
    additionalFileName: '',
    additionalPreview: null,

    // Upload fields (Raw File Objects)
    prescriptionFile: null, 
    additionalFile: null,
    
    isFromAppointment: false,
  });

  const { toast } = useToast();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraForField, setCameraForField] = useState(null); 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  React.useEffect(() => {
    if (record) {
      setFormData({
        treatmentName: record.treatmentName || '',
        notes: record.notes || '',
        date: record.date || today,
        // Load existing URLs for preview
        prescriptionFileName: record.prescriptionFileName || '',
        prescriptionPreview: record.prescriptionUrl || null,
        additionalFileName: record.additionalFileName || '',
        additionalPreview: record.additionalFileUrl || null,
        // Reset raw files on edit (user must re-upload to change)
        prescriptionFile: null,
        additionalFile: null,
        isFromAppointment: record.isFromAppointment || false, 
      });
    } else {
      setFormData({
        treatmentName: '',
        notes: '',
        date: today,
        prescriptionFileName: '',
        prescriptionPreview: null,
        additionalFileName: '',
        additionalPreview: null,
        prescriptionFile: null,
        additionalFile: null,
        isFromAppointment: false,
      });
    }
  }, [record, isOpen, today]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // LOGIC FIX: Store Raw File AND Preview
  const handleFileChange = (e, fieldType) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (fieldType === 'prescription') {
            setFormData(prev => ({ 
                ...prev, 
                prescriptionFile: file, 
                prescriptionPreview: reader.result,
                prescriptionFileName: file.name
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                additionalFile: file, 
                additionalPreview: reader.result,
                additionalFileName: file.name
            }));
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({ title: "Camera Error", description: "Could not access camera. Please check permissions.", variant: "destructive" });
      setIsCameraOpen(false);
      setCameraForField(null);
    }
  };

  // LOGIC FIX: Convert Camera Canvas to File Blob
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 1. Get Blob for Upload
      canvas.toBlob((blob) => {
        const file = new File([blob], `photo-${Date.now()}.png`, { type: "image/png" });
        const previewUrl = URL.createObjectURL(blob);

        if (cameraForField === 'prescriptionFile') {
            setFormData(prev => ({ 
                ...prev, 
                prescriptionFile: file, 
                prescriptionPreview: previewUrl,
                prescriptionFileName: file.name
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                additionalFile: file, 
                additionalPreview: previewUrl,
                additionalFileName: file.name
            }));
        }
        stopCamera();
      }, 'image/png');
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCameraForField(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: record ? record.id : undefined });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) stopCamera(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-lg glassmorphic dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary dark:text-sky-400">{record ? 'Edit Treatment Record' : 'Add New Treatment Record'}</DialogTitle>
        </DialogHeader>
        
        {isCameraOpen ? (
          <div className="space-y-4 py-4">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-md border dark:border-slate-600"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="flex justify-between">
              <Button onClick={capturePhoto} type="button">Capture Photo</Button>
              <Button onClick={stopCamera} variant="outline" type="button">Close Camera</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <Label htmlFor="treatmentName" className="dark:text-slate-300">Treatment Name</Label>
              <Input id="treatmentName" name="treatmentName" value={formData.treatmentName} onChange={handleInputChange} placeholder="e.g., Root Canal Therapy" className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" />
            </div>
            <div>
              <Label htmlFor="notes" className="dark:text-slate-300">Notes</Label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Details about the procedure, observations..." rows={3} className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" />
            </div>
            <div>
              <Label htmlFor="date" className="dark:text-slate-300">Date of Treatment</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" />
            </div>
            
            {/* RESTORED UI: Complex Input Group for Prescription */}
            <div className="space-y-1">
              <Label htmlFor="prescriptionFile" className="dark:text-slate-300">Upload Prescription (Image/PDF)</Label>
              <div className="flex gap-2 items-stretch">
                <Input 
                    id="prescriptionFile" 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={(e) => handleFileChange(e, 'prescription')} 
                    className="flex-grow file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-sky-500/20 dark:file:text-sky-400 dark:hover:file:bg-sky-500/30 dark:text-slate-300 h-9" 
                />
                <Button type="button" variant="outline" size="icon" onClick={() => startCamera('prescriptionFile')} className="h-9 w-9 flex-shrink-0 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              {formData.prescriptionFileName && <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">Selected: {formData.prescriptionFileName}</p>}
            </div>
            
            {/* RESTORED UI: Complex Input Group for Additional File */}
            <div className="space-y-1">
              <Label htmlFor="additionalFile" className="dark:text-slate-300">Upload X-ray or Additional File</Label>
               <div className="flex gap-2 items-stretch">
                <Input 
                    id="additionalFile" 
                    type="file" 
                    accept="image/*,.pdf,.doc,.docx" 
                    onChange={(e) => handleFileChange(e, 'additional')} 
                    className="flex-grow file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-sky-500/20 dark:file:text-sky-400 dark:hover:file:bg-sky-500/30 dark:text-slate-300 h-9" 
                />
                <Button type="button" variant="outline" size="icon" onClick={() => startCamera('additionalFile')} className="h-9 w-9 flex-shrink-0 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              {formData.additionalFileName && <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">Selected: {formData.additionalFileName}</p>}
            </div>

            {record?.isFromAppointment && (
                <p className="text-xs text-blue-600 dark:text-blue-400 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center">
                    <Info className="h-4 w-4 mr-2 flex-shrink-0"/>This record originated from an appointment. Editing here will update this specific dental record.
                </p>
            )}
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancel</Button></DialogClose>
              <Button type="submit">{record ? 'Save Changes' : 'Add Record'}</Button>
            </DialogFooter>
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
  const { toast } = useToast();

  const sortedRecords = useMemo(() => {
    const records = dentalRecords || [];
    if (sortOrder === 'latest') {
      return [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      return [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  }, [dentalRecords, sortOrder]);

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };
  
  const handleAdd = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleSave = (recordData) => {
    if (editingRecord) {
      onRecordEdit(recordData);
    } else {
      onRecordAdd(recordData);
    }
  };
  
  return (
    <TooltipProvider>
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ delay: 0.1, duration: 0.4 }}
      className="p-4 md:p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b dark:border-slate-700">
        <h3 className="text-xl font-semibold text-primary dark:text-sky-400 self-start sm:self-center">Dental Treatment History</h3>
        <div className="flex gap-2 self-stretch sm:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
                <ArrowDownUp className="mr-2 h-4 w-4" /> Sort By
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glassmorphic dark:bg-slate-800 dark:border-slate-700">
              <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
                <DropdownMenuRadioItem value="latest" className="dark:hover:bg-slate-700 dark:text-slate-200">Latest First</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest" className="dark:hover:bg-slate-700 dark:text-slate-200">Oldest First</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAdd} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
      </div>

      <DentalRecordFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} record={editingRecord} onSave={handleSave} />

      {sortedRecords.length === 0 ? (
        <p className="text-muted-foreground text-center py-8 dark:text-slate-400">No dental records found for this patient.</p>
      ) : (
        <div className="space-y-4">
          {sortedRecords.map((record, index) => (
            <motion.div
              key={record.id || `record-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow bg-background/80 dark:bg-slate-800/70 border dark:border-slate-700">
                <CardHeader className="flex flex-row justify-between items-start pb-2 pt-3 px-4">
                  <div className="flex-grow">
                    <CardTitle className="text-md sm:text-lg text-primary dark:text-sky-400 flex items-center">
                      {record.treatmentName || 'Untitled Treatment'}
                      {record.isFromAppointment && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 ml-2 text-blue-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="dark:bg-slate-700 dark:text-slate-200">
                            <p>This record originated from a completed appointment.</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm dark:text-slate-400 flex items-center">
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {new Date(record.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 p-1.5 h-auto dark:text-blue-400 dark:hover:bg-blue-500/20" onClick={() => handleEdit(record)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    {!record.isFromAppointment && (
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1.5 h-auto dark:text-red-400 dark:hover:bg-red-500/20" onClick={() => onRecordDelete(record.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {record.notes && <p className="text-sm text-muted-foreground dark:text-slate-300"><strong>Notes:</strong> {record.notes}</p>}
                  
                  {/* LOGIC FIX: Display Images using stored URLs */}
                  {record.prescriptionUrl && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-muted-foreground dark:text-slate-400">Prescription:</p>
                       <img src={record.prescriptionUrl} alt="Prescription" className="mt-1 rounded-md max-h-32 object-contain border dark:border-slate-600 cursor-pointer" onClick={() => window.open(record.prescriptionUrl)} />
                    </div>
                  )}
                  {record.additionalFileUrl && (
                     <div className="mt-2">
                      <p className="text-xs font-semibold text-muted-foreground dark:text-slate-400">Additional File / X-ray:</p>
                       <img src={record.additionalFileUrl} alt="X-Ray" className="mt-1 rounded-md max-h-32 object-contain border dark:border-slate-600 cursor-pointer" onClick={() => window.open(record.additionalFileUrl)} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
    </TooltipProvider>
  );
};

export default PatientDentalRecordsTab;