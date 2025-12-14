
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AddDentalRecordDialog = ({ patientId, onRecordAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({ date: new Date().toISOString().split('T')[0], treatment: '', notes: '', cost: '' });
  const { toast } = useToast();

  const handleRecordChange = (e) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRecordSubmit = (e) => {
    e.preventDefault();
    if (!newRecord.date || !newRecord.treatment) {
      toast({ title: "Missing Information", description: "Please fill in Date and Treatment.", variant: "destructive" });
      return;
    }
    const recordToAdd = { 
      id: Date.now().toString(), 
      ...newRecord, 
      cost: parseFloat(newRecord.cost) || 0 
    };
    onRecordAdd(recordToAdd);
    setNewRecord({ date: new Date().toISOString().split('T')[0], treatment: '', notes: '', cost: '' });
    setIsOpen(false);
    toast({ title: "Dental Record Added", description: "New record saved successfully." });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-accent to-green-600 hover:from-accent/90 hover:to-green-600/90 text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Record
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] glassmorphic">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Add New Dental Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddRecordSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="record-date">Date</Label>
            <Input id="record-date" name="date" type="date" value={newRecord.date} onChange={handleRecordChange} required />
          </div>
          <div>
            <Label htmlFor="record-treatment">Treatment</Label>
            <Input id="record-treatment" name="treatment" placeholder="e.g., Cleaning, Filling" value={newRecord.treatment} onChange={handleRecordChange} required />
          </div>
          <div>
            <Label htmlFor="record-notes">Notes</Label>
            <Textarea id="record-notes" name="notes" placeholder="Additional details about the treatment..." value={newRecord.notes} onChange={handleRecordChange} />
          </div>
          <div>
            <Label htmlFor="record-cost">Cost ($)</Label>
            <Input id="record-cost" name="cost" type="number" step="0.01" placeholder="e.g., 150.00" value={newRecord.cost} onChange={handleRecordChange} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDentalRecordDialog;
