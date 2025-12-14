import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

// Ensure this matches your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const AppointmentFormDialog = ({ isOpen, onOpenChange, appointment, onSave }) => {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  
  // 1. REPLACED useLocalStorage with real state
  const [patients, setPatients] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const initialFormData = {
    patientId: '',
    date: today,
    time: '',
    notes: '',
    cost: '',
    status: 'Scheduled',
  };

  const [formData, setFormData] = useState(initialFormData);

  // 2. NEW: Fetch real patients from Database when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchPatients = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/patients`);
          setPatients(response.data || []);
        } catch (error) {
          console.error("Failed to load patients for search:", error);
          toast({ title: "Error", description: "Could not load patient list.", variant: "destructive" });
        }
      };
      fetchPatients();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (appointment) {
      setFormData({
        patientId: appointment.patientId || '',
        date: appointment.date || today,
        time: appointment.time || '',
        notes: appointment.notes || '',
        cost: appointment.cost || '',
        status: appointment.status || 'Scheduled',
      });
      // Set the selected patient ID directly
      setSelectedPatientId(appointment.patientId || '');
      
      // We will fetch the patient name in the next render cycle when 'patients' is populated
    } else {
      setFormData(initialFormData);
      setSelectedPatientId('');
    }
    setSearchTerm(''); 
  }, [appointment, isOpen, today]);

  // Sync selected ID with form data
  useEffect(() => {
    setFormData(prev => ({ ...prev, patientId: selectedPatientId }));
  }, [selectedPatientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectPatient = (patientId) => {
    setSelectedPatientId(patientId);
    setSearchTerm(patients.find(p => p.id === patientId)?.name || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.date) {
      toast({ title: "Missing Fields", description: "Patient and Date are required.", variant: "destructive" });
      return;
    }
    onSave({ ...formData, id: appointment ? appointment.id : undefined }); // Let backend handle ID generation
    onOpenChange(false);
  };

  // Filter logic remains the same, but now runs on real data
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );
  
  // Find name for display
  const currentPatientName = patients.find(p => p.id === selectedPatientId)?.name;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] glassmorphic dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary dark:text-sky-400">
            {appointment ? 'Edit Appointment' : 'Schedule New Appointment'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="patientSearch" className="dark:text-slate-300">
              {selectedPatientId && currentPatientName 
                ? `Selected Patient: ${currentPatientName}` 
                : 'Search Patient (Name/Phone)'}
            </Label>
            
            {/* Search Input - Only show if no patient is locked in */}
            {!selectedPatientId && (
              <Input 
                id="patientSearch" 
                placeholder="Type name or phone..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
              />
            )}

            {/* Dropdown Results */}
            {!selectedPatientId && searchTerm && (
              <div className="max-h-32 overflow-y-auto border rounded-md dark:border-slate-700 bg-white dark:bg-slate-800 z-10 relative">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => handleSelectPatient(p.id)}
                      className="p-2 hover:bg-accent dark:hover:bg-slate-700 cursor-pointer border-b last:border-0 dark:border-slate-700"
                    >
                      <span className="font-medium">{p.name}</span> <span className="text-xs text-muted-foreground">({p.phone})</span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">No patients found.</div>
                )}
              </div>
            )}
            
             {/* Change Patient Button */}
             {selectedPatientId && (
                <div className="flex justify-between items-center mt-1">
                   <span className="text-sm text-green-600 font-medium">Patient Linked ✓</span>
                   <Button type="button" variant="link" size="sm" onClick={() => { setSelectedPatientId(''); setSearchTerm(''); }} className="text-xs text-red-500 h-auto p-0">
                     Change patient
                   </Button>
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="dark:text-slate-300">Date <span className="text-red-500">*</span></Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" />
            </div>
            <div>
              <Label htmlFor="time" className="dark:text-slate-300">Time (Optional)</Label>
              <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" />
            </div>
          </div>
          <div>
            <Label htmlFor="notes" className="dark:text-slate-300">Notes (Service/Treatment)</Label>
            <Textarea id="notes" name="notes" placeholder="e.g., Dental Check-up, Cleaning..." value={formData.notes} onChange={handleChange} rows={3} className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" />
          </div>
          <div>
            <Label htmlFor="cost" className="dark:text-slate-300">Cost (₹)</Label>
            <Input id="cost" name="cost" type="number" step="0.01" placeholder="e.g., 75.00" value={formData.cost} onChange={handleChange} className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancel</Button>
            </DialogClose>
            <Button type="submit">{appointment ? 'Save Changes' : 'Schedule Appointment'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentFormDialog;