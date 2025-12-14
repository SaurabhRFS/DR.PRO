
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/components/ui/use-toast';

const AppointmentFormDialog = ({ isOpen, onOpenChange, appointment, onSave }) => {
  const [patients] = useLocalStorage('patients', []);
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
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
      setSelectedPatientId(appointment.patientId || '');
    } else {
      setFormData(initialFormData);
      setSelectedPatientId('');
    }
    setSearchTerm(''); 
  }, [appointment, isOpen, today]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, patientId: selectedPatientId }));
  }, [selectedPatientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectPatient = (patientId) => {
    setSelectedPatientId(patientId);
    setSearchTerm(patients.find(p => p.id === patientId)?.name || ''); // Show name in search bar
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.date) {
      toast({ title: "Missing Fields", description: "Patient and Date are required.", variant: "destructive" });
      return;
    }
    onSave({ ...formData, id: appointment ? appointment.id : Date.now().toString() });
    onOpenChange(false); // Close dialog on save
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );
  
  const currentPatientName = patients.find(p => p.id === selectedPatientId)?.name;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] glassmorphic dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary dark:text-sky-400">{appointment ? 'Edit Appointment' : 'Schedule New Appointment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="patientSearch" className="dark:text-slate-300">
              {selectedPatientId && currentPatientName ? `Selected Patient: ${currentPatientName}` : 'Search Patient (Name/Phone)'}
            </Label>
            {!selectedPatientId && (
              <Input 
                id="patientSearch" 
                placeholder="Type to search..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
              />
            )}
            {!selectedPatientId && searchTerm && (
              <div className="max-h-32 overflow-y-auto border rounded-md dark:border-slate-700">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => handleSelectPatient(p.id)}
                      className="p-2 hover:bg-accent dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {p.name} ({p.phone})
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">No patients found.</div>
                )}
              </div>
            )}
             {selectedPatientId && (
                <Button variant="link" size="sm" onClick={() => { setSelectedPatientId(''); setSearchTerm(''); }} className="text-xs">Change patient</Button>
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
