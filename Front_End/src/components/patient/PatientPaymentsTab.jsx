import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Table as TableIcon, Calculator, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

// FIX 1: Add fallback to localhost so it works even if .env is missing
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const PatientPaymentsTab = ({ patientId }) => {
  const { toast } = useToast();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTableTitle, setNewTableTitle] = useState("");

  // --- FETCH DATA ---
  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/treatments?patientId=${patientId}`);
      setTreatments(res.data || []);
    } catch (error) {
      console.error("Failed to load treatments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(patientId) fetchTreatments();
  }, [patientId]);


  // --- ACTIONS ---

  // 1. Create Table
  const handleCreateTreatment = async () => {
    if (!newTableTitle.trim()) return;

    // FIX 2: Safety check to ensure patientId is present and valid
    if (!patientId) {
        toast({ title: "Error", description: "Patient ID is missing", variant: "destructive" });
        return;
    }

    try {
        // FIX 3: Ensure patientId is sent as a number
        const payload = { patientId: Number(patientId), title: newTableTitle, rows: [] };
        const res = await axios.post(`${API_BASE_URL}/treatments`, payload);
        setTreatments([res.data, ...treatments]);
        setNewTableTitle("");
        setIsCreateDialogOpen(false);
        toast({ title: "Table Created" });
    } catch (error) {
        console.error("Create table failed:", error);
        toast({ title: "Error", description: "Failed to create table", variant: "destructive" });
    }
  };

  // 2. Delete Table
  const handleDeleteTreatment = async (treatmentId) => {
    if (!confirm("Delete this entire table? This cannot be undone.")) return;
    try {
        await axios.delete(`${API_BASE_URL}/treatments/${treatmentId}`);
        setTreatments(treatments.filter(t => t.id !== treatmentId));
        toast({ title: "Table Deleted" });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete table", variant: "destructive" });
    }
  };

  // 3. Add Row
  const handleAddRow = async (treatmentId) => {
    try {
        const payload = { 
            notes: "", 
            cost: 0, 
            status: "Unpaid", 
            date: new Date().toISOString().split('T')[0] 
        };
        const res = await axios.post(`${API_BASE_URL}/treatments/${treatmentId}/rows`, payload);
        const newRow = res.data;

        setTreatments(prev => prev.map(t => {
            if (t.id === treatmentId) {
                return { ...t, rows: [...t.rows, newRow] };
            }
            return t;
        }));
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Could not add row", variant: "destructive" });
    }
  };

  // 4. Delete Row
  const handleDeleteRow = async (treatmentId, rowId) => {
    try {
        await axios.delete(`${API_BASE_URL}/treatments/rows/${rowId}`);
        setTreatments(prev => prev.map(t => {
            if (t.id === treatmentId) {
                return { ...t, rows: t.rows.filter(r => r.id !== rowId) };
            }
            return t;
        }));
    } catch (error) {
        toast({ title: "Error", description: "Could not delete row", variant: "destructive" });
    }
  };

  // 5. Update Row (Auto-save on blur/change)
  const updateRowState = (treatmentId, rowId, field, value) => {
    setTreatments(prev => prev.map(t => {
        if (t.id === treatmentId) {
            return {
                ...t,
                rows: t.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r)
            };
        }
        return t;
    }));
  };

  const saveRowChange = async (rowId, field, value) => {
    try {
        await axios.put(`${API_BASE_URL}/treatments/rows/${rowId}`, { [field]: value });
    } catch (error) {
        console.error("Auto-save failed", error);
    }
  };

  const calculateTotalCost = (rows) => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.cost) || 0), 0);
  };

  if (loading && treatments.length === 0) {
      return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary"/></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-xl font-semibold dark:text-slate-100 flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-primary" />
              Patient's Hisab Kitab
            </h2>
            <p className="text-sm text-muted-foreground">
              Permanent records saved to database.
            </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-md">
          <Plus className="mr-2 h-4 w-4" /> New Treatment Table
        </Button>
      </div>

      {treatments.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-700">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full mb-4 shadow-sm">
             <TableIcon className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg font-medium dark:text-slate-300">No Records Yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
            Create a new table to start tracking treatments.
          </p>
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>Create First Table</Button>
        </div>
      )}

      {/* --- Treatment Tables Loop --- */}
      {treatments.map((treatment) => (
        <Card key={treatment.id} className="dark:bg-slate-800/50 dark:border-slate-700 shadow-sm overflow-hidden border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
                <CardTitle className="text-lg font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                   <FileText className="h-4 w-4" />
                   {treatment.title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-normal">
                    {treatment.rows?.length || 0} Entries
                </Badge>
            </div>
            <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-md shadow-sm">
                    <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Total: ₹{calculateTotalCost(treatment.rows || []).toFixed(2)}</span>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteTreatment(treatment.id)}
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/60 border-b">
                    <TableRow>
                    <TableHead className="w-[50px] text-center font-semibold">Sr.</TableHead>
                    <TableHead className="min-w-[200px] font-semibold">Notes / Description</TableHead>
                    <TableHead className="w-[120px] font-semibold">Cost (₹)</TableHead>
                    <TableHead className="w-[160px] font-semibold">Status</TableHead>
                    <TableHead className="w-[150px] font-semibold">Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(!treatment.rows || treatment.rows.length === 0) ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground text-sm">
                                Empty table. <Button variant="link" onClick={() => handleAddRow(treatment.id)} className="h-auto p-0 ml-1">Add Row</Button>
                            </TableCell>
                        </TableRow>
                    ) : (
                        treatment.rows.map((row, index) => (
                        <TableRow key={row.id} className="group hover:bg-muted/30">
                            {/* 1. Sr No */}
                            <TableCell className="text-center font-medium text-muted-foreground bg-muted/5">
                                {index + 1}
                            </TableCell>

                            {/* 2. Notes */}
                            <TableCell className="p-1">
                                <Input 
                                    value={row.notes || ""} 
                                    onChange={(e) => updateRowState(treatment.id, row.id, 'notes', e.target.value)}
                                    onBlur={(e) => saveRowChange(row.id, 'notes', e.target.value)}
                                    className="h-9 border-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/50"
                                    placeholder="Details..."
                                />
                            </TableCell>

                            {/* 3. Cost */}
                            <TableCell className="p-1">
                                <Input 
                                    type="number"
                                    value={row.cost || ""} 
                                    onChange={(e) => updateRowState(treatment.id, row.id, 'cost', e.target.value)}
                                    onBlur={(e) => saveRowChange(row.id, 'cost', e.target.value)}
                                    className="h-9 border-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/50 font-mono"
                                    placeholder="0"
                                />
                            </TableCell>

                            {/* 4. Payment Status */}
                            <TableCell className="p-1">
                                <Select 
                                    value={row.status || "Unpaid"} 
                                    onValueChange={(val) => {
                                        updateRowState(treatment.id, row.id, 'status', val);
                                        saveRowChange(row.id, 'status', val);
                                    }}
                                >
                                    <SelectTrigger className={`h-9 border-none shadow-none bg-transparent focus:ring-0 ${
                                        row.status === 'Paid' ? 'text-green-600 font-medium' : 
                                        row.status === 'Unpaid' ? 'text-red-500 font-medium' : 'text-yellow-600 font-medium'
                                    }`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Paid" className="text-green-600">Paid</SelectItem>
                                        <SelectItem value="Partially Paid" className="text-yellow-600">Partially Paid</SelectItem>
                                        <SelectItem value="Unpaid" className="text-red-500">Unpaid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>

                            {/* 5. Date */}
                            <TableCell className="p-1">
                                <Input 
                                    type="date"
                                    value={row.date || ""} 
                                    onChange={(e) => updateRowState(treatment.id, row.id, 'date', e.target.value)}
                                    onBlur={(e) => saveRowChange(row.id, 'date', e.target.value)}
                                    className="h-9 border-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/50 text-sm"
                                />
                            </TableCell>

                            {/* Delete */}
                            <TableCell className="text-center p-1">
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-opacity"
                                    onClick={() => handleDeleteRow(treatment.id, row.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                </TableBody>
                </Table>
            </div>
            
            <div className="p-2 border-t bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-800">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 dashed-border"
                    onClick={() => handleAddRow(treatment.id)}
                >
                    <Plus className="h-3.5 w-3.5 mr-2" /> Add Row
                </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* --- CREATE TABLE DIALOG --- */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glassmorphic dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>New Treatment Table</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="title" className="mb-2 block">Treatment Title</Label>
            <Input
              id="title"
              value={newTableTitle}
              onChange={(e) => setNewTableTitle(e.target.value)}
              placeholder="e.g., Root Canal, Aligners..."
              className="dark:bg-slate-800"
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreateTreatment}>Create Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientPaymentsTab;