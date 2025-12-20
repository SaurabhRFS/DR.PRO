import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Table as TableIcon, Calculator, FileText, Loader2, Zap, Settings, X, Edit2, Minus, Check, Calendar as CalendarIcon, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const PatientPaymentsTab = ({ patientId }) => {
  const { toast } = useToast();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- Quick Estimate State ---
  const [isQuickEstOpen, setIsQuickEstOpen] = useState(false);
  const [activeTreatmentId, setActiveTreatmentId] = useState(null);
  const [procedureItems, setProcedureItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({}); 
  
  const [isAddingProcedure, setIsAddingProcedure] = useState(false);
  const [editingProcedureId, setEditingProcedureId] = useState(null);
  const [newProcData, setNewProcData] = useState({ description: '', price: '' });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTableTitle, setNewTableTitle] = useState("");

  // --- FETCH DATA ---
  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/treatments?patientId=${patientId}`);
      const sortedTreatments = (res.data || []).sort((a, b) => b.id - a.id);
      setTreatments(sortedTreatments);
    } catch (error) {
      console.error("Failed to load treatments", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProcedures = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/procedures`);
        setProcedureItems(res.data || []);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if(patientId) fetchTreatments();
  }, [patientId]);

  // --- ACTIONS ---

  const handleCreateTreatment = async () => {
    if (!newTableTitle.trim()) return;
    if (!patientId) { toast({ title: "Error", description: "Patient ID missing", variant: "destructive" }); return; }
    try {
        const payload = { patientId: Number(patientId), title: newTableTitle, rows: [] };
        const res = await axios.post(`${API_BASE_URL}/treatments`, payload);
        setTreatments([res.data, ...treatments]); 
        setNewTableTitle("");
        setIsCreateDialogOpen(false);
        toast({ title: "Table Created" });
    } catch (error) { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDeleteTreatment = async (treatmentId) => {
    if (!confirm("Delete this entire table?")) return;
    try {
        await axios.delete(`${API_BASE_URL}/treatments/${treatmentId}`);
        setTreatments(treatments.filter(t => t.id !== treatmentId));
        toast({ title: "Table Deleted" });
    } catch (error) { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleAddRow = async (treatmentId) => {
    try {
        const payload = { 
            notes: "", 
            cost: 0, 
            status: "Paid", // UPDATED DEFAULT TO PAID
            date: new Date().toISOString().split('T')[0] 
        };
        const res = await axios.post(`${API_BASE_URL}/treatments/${treatmentId}/rows`, payload);
        const newRow = res.data;
        setTreatments(prev => prev.map(t => t.id === treatmentId ? { ...t, rows: [...t.rows, newRow] } : t));
    } catch (error) { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDeleteRow = async (treatmentId, rowId) => {
    try {
        await axios.delete(`${API_BASE_URL}/treatments/rows/${rowId}`);
        setTreatments(prev => prev.map(t => t.id === treatmentId ? { ...t, rows: t.rows.filter(r => r.id !== rowId) } : t));
    } catch (error) { toast({ title: "Error", variant: "destructive" }); }
  };

  const updateRowState = (treatmentId, rowId, field, value) => {
    setTreatments(prev => prev.map(t => t.id === treatmentId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r)
    } : t));
  };

  const saveRowChange = async (rowId, field, value) => {
    try { await axios.put(`${API_BASE_URL}/treatments/rows/${rowId}`, { [field]: value }); } 
    catch (error) { console.error("Auto-save failed", error); }
  };

  // --- QUICK ESTIMATE ---

  const openQuickEstimate = (treatmentId) => {
    setActiveTreatmentId(treatmentId);
    fetchProcedures();
    setSelectedItems({});
    setIsAddingProcedure(false);
    setIsQuickEstOpen(true);
  };

  const handleSaveProcedure = async () => {
    if (!newProcData.description || !newProcData.price) return;
    try {
        if (editingProcedureId) {
            const res = await axios.put(`${API_BASE_URL}/procedures/${editingProcedureId}`, newProcData);
            setProcedureItems(items => items.map(i => i.id === editingProcedureId ? res.data : i));
        } else {
            const res = await axios.post(`${API_BASE_URL}/procedures`, newProcData);
            setProcedureItems([...procedureItems, res.data]);
        }
        setIsAddingProcedure(false);
        setEditingProcedureId(null);
        setNewProcData({ description: '', price: '' });
    } catch (error) { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDeleteProcedure = async (id) => {
    if(!confirm("Delete this item?")) return;
    try {
        await axios.delete(`${API_BASE_URL}/procedures/${id}`);
        setProcedureItems(items => items.filter(i => i.id !== id));
        const newSel = { ...selectedItems }; delete newSel[id]; setSelectedItems(newSel);
    } catch(err) { toast({ title: "Error", variant: "destructive" }); }
  };

  const toggleSelection = (item) => {
    setSelectedItems(prev => {
        const next = { ...prev };
        if (next[item.id]) delete next[item.id];
        else next[item.id] = { ...item, quantity: 1 };
        return next;
    });
  };

  const updateQuantity = (id, delta) => {
    setSelectedItems(prev => {
        const item = prev[id];
        if (!item) return prev;
        const newQty = Math.max(1, item.quantity + delta);
        return { ...prev, [id]: { ...item, quantity: newQty } };
    });
  };

  const addSelectedToTable = async () => {
    if (!activeTreatmentId) return;
    const items = Object.values(selectedItems);
    if (items.length === 0) return;
    try {
        for (const item of items) {
            const payload = {
                notes: `${item.description} (x${item.quantity})`,
                cost: item.price * item.quantity,
                status: "Paid", // UPDATED DEFAULT TO PAID
                date: new Date().toISOString().split('T')[0]
            };
            await axios.post(`${API_BASE_URL}/treatments/${activeTreatmentId}/rows`, payload);
        }
        fetchTreatments();
        setIsQuickEstOpen(false);
        toast({ title: "Success", description: `${items.length} items added.` });
    } catch (error) { toast({ title: "Error", variant: "destructive" }); }
  };

  const calculateSelectionTotal = () => Object.values(selectedItems).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculateTotalCost = (rows) => rows.reduce((sum, row) => sum + (parseFloat(row.cost) || 0), 0);
  const adjustTextareaHeight = (e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; };

  if (loading && treatments.length === 0) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-xl font-semibold dark:text-slate-100 flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-primary" />
              Patient Hisab Kitab
            </h2>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-md w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> New Treatment Table
        </Button>
      </div>

      {treatments.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
          <h3 className="text-lg font-medium dark:text-slate-300">No Records Yet</h3>
          <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>Create First Table</Button>
        </div>
      )}

      {/* TREATMENTS LOOP */}
      {treatments.map((treatment) => (
        <Card key={treatment.id} className="dark:bg-slate-800/50 dark:border-slate-700 shadow-sm overflow-hidden border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-muted/20 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" /> 
                <CardTitle className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-400 truncate">
                   {treatment.title}
                </CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold px-2 py-1 bg-white dark:bg-slate-800 border rounded-md shadow-sm whitespace-nowrap">
                    <span>₹{calculateTotalCost(treatment.rows || []).toFixed(0)}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteTreatment(treatment.id)} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            
            {/* --- VIEW 1: DESKTOP TABLE (Hidden on Mobile) --- */}
            <div className="hidden md:block overflow-x-auto">
                <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/60 border-b">
                    <TableRow>
                    <TableHead className="w-[50px] text-center">Sr.</TableHead>
                    <TableHead className="min-w-[250px]">Description</TableHead>
                    <TableHead className="w-[120px]">Cost (₹)</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(!treatment.rows || treatment.rows.length === 0) ? (
                        <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground text-sm">Empty.</TableCell></TableRow>
                    ) : (
                        treatment.rows.map((row, index) => (
                        <TableRow key={row.id} className="group hover:bg-muted/30">
                            <TableCell className="text-center font-medium text-muted-foreground bg-muted/5 align-top pt-4">{index + 1}</TableCell>
                            <TableCell className="p-1 align-top">
                                <Textarea value={row.notes || ""} 
                                    onChange={(e) => { updateRowState(treatment.id, row.id, 'notes', e.target.value); adjustTextareaHeight(e); }}
                                    onBlur={(e) => saveRowChange(row.id, 'notes', e.target.value)}
                                    className="min-h-[40px] border-none bg-transparent shadow-none resize-none overflow-hidden py-2" placeholder="Details..." rows={1} />
                            </TableCell>
                            <TableCell className="p-1 align-top">
                                <Input type="number" value={row.cost || ""} 
                                    onChange={(e) => updateRowState(treatment.id, row.id, 'cost', e.target.value)}
                                    onBlur={(e) => saveRowChange(row.id, 'cost', e.target.value)}
                                    className="h-10 border-none bg-transparent shadow-none font-mono" placeholder="0" />
                            </TableCell>
                            <TableCell className="p-1 align-top">
                                <Select value={row.status || "Paid"} onValueChange={(val) => { updateRowState(treatment.id, row.id, 'status', val); saveRowChange(row.id, 'status', val); }}>
                                    <SelectTrigger className={`h-10 border-none shadow-none bg-transparent ${row.status === 'Paid' ? 'text-green-600 font-medium' : row.status === 'Unpaid' ? 'text-red-500 font-medium' : 'text-yellow-600 font-medium'}`}><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Paid" className="text-green-600 font-medium">Paid</SelectItem>
                                        <SelectItem value="Partially Paid" className="text-yellow-600 font-medium">Partially Paid</SelectItem>
                                        <SelectItem value="Unpaid" className="text-red-500 font-medium">Unpaid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="p-1 align-top">
                                <Input type="date" value={row.date || ""} 
                                    onChange={(e) => updateRowState(treatment.id, row.id, 'date', e.target.value)}
                                    onBlur={(e) => saveRowChange(row.id, 'date', e.target.value)}
                                    className="h-10 border-none bg-transparent shadow-none text-sm" />
                            </TableCell>
                            <TableCell className="text-center p-1 align-top pt-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500" onClick={() => handleDeleteRow(treatment.id, row.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                </TableBody>
                </Table>
            </div>

            {/* --- VIEW 2: MOBILE CARDS (Visible only on Mobile) --- */}
            <div className="md:hidden flex flex-col divide-y dark:divide-slate-700 bg-slate-50/50 dark:bg-slate-900/10">
                 {(!treatment.rows || treatment.rows.length === 0) ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No entries yet. Add a row below.</div>
                 ) : (
                    treatment.rows.map((row, index) => (
                        <div key={row.id} className="p-3 flex flex-col gap-2 bg-white dark:bg-slate-800">
                             {/* Row 1: Sr No & Delete */}
                             <div className="flex justify-between items-start">
                                <Badge variant="outline" className="text-xs text-muted-foreground bg-slate-50">#{index + 1}</Badge>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500 -mt-1 -mr-1" onClick={() => handleDeleteRow(treatment.id, row.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                             </div>

                             {/* Row 2: Notes (Textarea) */}
                             <Textarea 
                                value={row.notes || ""}
                                onChange={(e) => { updateRowState(treatment.id, row.id, 'notes', e.target.value); adjustTextareaHeight(e); }}
                                onBlur={(e) => saveRowChange(row.id, 'notes', e.target.value)}
                                className="min-h-[36px] p-0 border-none bg-transparent shadow-none resize-none text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50"
                                placeholder="Enter treatment details..."
                                rows={1}
                             />

                             {/* Row 3: Inputs Grid */}
                             <div className="grid grid-cols-12 gap-2 mt-1">
                                {/* Cost */}
                                <div className="col-span-4 relative">
                                    <IndianRupee className="absolute left-0 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input 
                                        type="number"
                                        value={row.cost || ""}
                                        onChange={(e) => updateRowState(treatment.id, row.id, 'cost', e.target.value)}
                                        onBlur={(e) => saveRowChange(row.id, 'cost', e.target.value)}
                                        className="h-8 pl-4 pr-1 text-sm border-0 border-b rounded-none focus-visible:ring-0 bg-transparent font-semibold"
                                        placeholder="0"
                                    />
                                </div>
                                {/* Status */}
                                <div className="col-span-4">
                                    <Select value={row.status || "Paid"} onValueChange={(val) => { updateRowState(treatment.id, row.id, 'status', val); saveRowChange(row.id, 'status', val); }}>
                                        <SelectTrigger className={`h-8 text-xs border-0 border-b rounded-none focus:ring-0 px-1 ${row.status === 'Paid' ? 'text-green-600 font-bold' : row.status === 'Unpaid' ? 'text-red-500 font-bold' : 'text-yellow-600 font-bold'}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Paid" className="text-green-600">Paid</SelectItem>
                                            <SelectItem value="Partially Paid" className="text-yellow-600">Partial</SelectItem>
                                            <SelectItem value="Unpaid" className="text-red-500">Unpaid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Date */}
                                <div className="col-span-4 relative">
                                    <Input 
                                        type="date"
                                        value={row.date || ""}
                                        onChange={(e) => updateRowState(treatment.id, row.id, 'date', e.target.value)}
                                        onBlur={(e) => saveRowChange(row.id, 'date', e.target.value)}
                                        className="h-8 text-xs border-0 border-b rounded-none focus-visible:ring-0 bg-transparent px-0"
                                    />
                                </div>
                             </div>
                        </div>
                    ))
                 )}
            </div>
            
            {/* --- ACTION BUTTONS --- */}
            <div className="p-2 border-t bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-800 flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-primary hover:bg-primary/5 dashed-border" onClick={() => handleAddRow(treatment.id)}><Plus className="h-3.5 w-3.5 mr-2" /> Add Row</Button>
                <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 dashed-border" onClick={() => openQuickEstimate(treatment.id)}><Zap className="h-3.5 w-3.5 mr-2" /> Quick Estimate</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* --- QUICK ESTIMATE MODAL --- */}
      <Dialog open={isQuickEstOpen} onOpenChange={setIsQuickEstOpen}>
        <DialogContent className="w-[95vw] max-w-lg h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-slate-900 border-none rounded-lg overflow-hidden outline-none" aria-describedby="quick-est-desc">
            <DialogHeader className="p-4 border-b flex flex-row items-center justify-between bg-white dark:bg-slate-900 z-10 space-y-0">
                <div className="flex items-center gap-2">
                    <DialogTitle>Items List</DialogTitle>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 ml-2" onClick={() => { setIsAddingProcedure(true); setEditingProcedureId(null); setNewProcData({description:'', price:''}); }}>
                        <Plus className="h-3 w-3"/> Add
                    </Button>
                </div>
                <DialogDescription id="quick-est-desc" className="sr-only">Quickly add procedure items.</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50">
                {isAddingProcedure && (
                    <Card className="mb-4 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20">
                        <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm font-medium">{editingProcedureId ? 'Edit Item' : 'New Item'}</CardTitle></CardHeader>
                        <CardContent className="space-y-3 pb-3">
                            <Input placeholder="Description" value={newProcData.description} onChange={e => setNewProcData({...newProcData, description: e.target.value})} className="bg-white dark:bg-slate-900" />
                            <Input type="number" placeholder="Price (₹)" value={newProcData.price} onChange={e => setNewProcData({...newProcData, price: e.target.value})} className="bg-white dark:bg-slate-900" />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsAddingProcedure(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleSaveProcedure}>Save</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {procedureItems.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">No items found. Add one above.</div>
                ) : (
                    procedureItems.map(item => {
                        const isSelected = !!selectedItems[item.id];
                        const qty = selectedItems[item.id]?.quantity || 1;
                        return (
                            <div key={item.id} className={`p-3 rounded-lg border transition-all ${isSelected ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-start gap-3">
                                        <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" checked={isSelected} onChange={() => toggleSelection(item)} />
                                        <span className={`font-medium text-base ${isSelected ? 'text-blue-700 dark:text-blue-300' : ''}`}>{item.description}</span>
                                    </div>
                                    <div className="flex items-center justify-between pl-8">
                                        {isSelected ? (
                                            <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border shadow-sm h-8">
                                                <button className="px-2 hover:bg-slate-100" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3"/></button>
                                                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                                                <button className="px-2 hover:bg-slate-100" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3"/></button>
                                            </div>
                                        ) : <span className="text-xs text-muted-foreground">Select to add</span>}
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold font-mono">₹{item.price}</span>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-500" onClick={() => { setIsAddingProcedure(true); setEditingProcedureId(item.id); setNewProcData({description: item.description, price: item.price}); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => handleDeleteProcedure(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t bg-white dark:bg-slate-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                    <span className="text-xl font-bold text-primary">₹{calculateSelectionTotal().toFixed(2)}</span>
                </div>
                <Button className="w-full h-11 text-lg shadow-lg" disabled={calculateSelectionTotal() === 0} onClick={addSelectedToTable}>
                    Add to Table
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>New Treatment Table</DialogTitle></DialogHeader>
          <div className="py-4"><Input value={newTableTitle} onChange={(e) => setNewTableTitle(e.target.value)} placeholder="Title..." autoFocus /></div>
          <DialogFooter><Button onClick={handleCreateTreatment}>Create Table</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientPaymentsTab;



























// import React, { useState, useEffect } from 'react';
// import { Plus, Trash2, Table as TableIcon, Calculator, FileText, Loader2, Zap, Settings, X, Edit2, Minus, Check } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
// import { Label } from '@/components/ui/label';
// import { useToast } from '@/components/ui/use-toast';
// import { Badge } from '@/components/ui/badge';
// import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// const PatientPaymentsTab = ({ patientId }) => {
//   const { toast } = useToast();
//   const [treatments, setTreatments] = useState([]);
//   const [loading, setLoading] = useState(false);
  
//   // --- Quick Estimate State ---
//   const [isQuickEstOpen, setIsQuickEstOpen] = useState(false);
//   const [activeTreatmentId, setActiveTreatmentId] = useState(null);
//   const [procedureItems, setProcedureItems] = useState([]);
//   const [selectedItems, setSelectedItems] = useState({}); 
  
//   // Add/Edit Procedure Mode
//   const [isAddingProcedure, setIsAddingProcedure] = useState(false);
//   const [editingProcedureId, setEditingProcedureId] = useState(null);
//   const [newProcData, setNewProcData] = useState({ description: '', price: '' });

//   // Dialog State (Create Table)
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
//   const [newTableTitle, setNewTableTitle] = useState("");

//   // --- FETCH DATA ---
//   const fetchTreatments = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(`${API_BASE_URL}/treatments?patientId=${patientId}`);
//       const sortedTreatments = (res.data || []).sort((a, b) => b.id - a.id);
//       setTreatments(sortedTreatments);
//     } catch (error) {
//       console.error("Failed to load treatments", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchProcedures = async () => {
//     try {
//         const res = await axios.get(`${API_BASE_URL}/procedures`);
//         setProcedureItems(res.data || []);
//     } catch (error) {
//         console.error("Failed to load procedures", error);
//         // Toast is distracting on load, so we log only
//     }
//   };

//   useEffect(() => {
//     if(patientId) fetchTreatments();
//   }, [patientId]);

//   // --- ACTIONS ---

//   const handleCreateTreatment = async () => {
//     if (!newTableTitle.trim()) return;
//     if (!patientId) {
//         toast({ title: "Error", description: "Patient ID is missing", variant: "destructive" });
//         return;
//     }
//     try {
//         const payload = { patientId: Number(patientId), title: newTableTitle, rows: [] };
//         const res = await axios.post(`${API_BASE_URL}/treatments`, payload);
//         setTreatments([res.data, ...treatments]); 
//         setNewTableTitle("");
//         setIsCreateDialogOpen(false);
//         toast({ title: "Table Created" });
//     } catch (error) {
//         toast({ title: "Error", description: "Failed to create table", variant: "destructive" });
//     }
//   };

//   const handleDeleteTreatment = async (treatmentId) => {
//     if (!confirm("Delete this entire table?")) return;
//     try {
//         await axios.delete(`${API_BASE_URL}/treatments/${treatmentId}`);
//         setTreatments(treatments.filter(t => t.id !== treatmentId));
//         toast({ title: "Table Deleted" });
//     } catch (error) {
//         toast({ title: "Error", description: "Failed to delete table", variant: "destructive" });
//     }
//   };

//   const handleAddRow = async (treatmentId) => {
//     try {
//         const payload = { 
//             notes: "", cost: 0, status: "Unpaid", 
//             date: new Date().toISOString().split('T')[0] 
//         };
//         const res = await axios.post(`${API_BASE_URL}/treatments/${treatmentId}/rows`, payload);
//         const newRow = res.data;
//         setTreatments(prev => prev.map(t => t.id === treatmentId ? { ...t, rows: [...t.rows, newRow] } : t));
//     } catch (error) {
//         toast({ title: "Error", description: "Could not add row", variant: "destructive" });
//     }
//   };

//   const handleDeleteRow = async (treatmentId, rowId) => {
//     try {
//         await axios.delete(`${API_BASE_URL}/treatments/rows/${rowId}`);
//         setTreatments(prev => prev.map(t => t.id === treatmentId ? { ...t, rows: t.rows.filter(r => r.id !== rowId) } : t));
//     } catch (error) {
//         toast({ title: "Error", description: "Could not delete row", variant: "destructive" });
//     }
//   };

//   const updateRowState = (treatmentId, rowId, field, value) => {
//     setTreatments(prev => prev.map(t => t.id === treatmentId ? {
//         ...t, rows: t.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r)
//     } : t));
//   };

//   const saveRowChange = async (rowId, field, value) => {
//     try { await axios.put(`${API_BASE_URL}/treatments/rows/${rowId}`, { [field]: value }); } 
//     catch (error) { console.error("Auto-save failed", error); }
//   };

//   // --- QUICK ESTIMATE LOGIC ---

//   const openQuickEstimate = (treatmentId) => {
//     setActiveTreatmentId(treatmentId);
//     fetchProcedures();
//     setSelectedItems({});
//     setIsAddingProcedure(false);
//     setIsQuickEstOpen(true);
//   };

//   const handleSaveProcedure = async () => {
//     if (!newProcData.description || !newProcData.price) return;
//     try {
//         if (editingProcedureId) {
//             // Update
//             const res = await axios.put(`${API_BASE_URL}/procedures/${editingProcedureId}`, newProcData);
//             setProcedureItems(items => items.map(i => i.id === editingProcedureId ? res.data : i));
//             toast({ title: "Updated", description: "Item updated successfully." });
//         } else {
//             // Create
//             const res = await axios.post(`${API_BASE_URL}/procedures`, newProcData);
//             setProcedureItems([...procedureItems, res.data]);
//             toast({ title: "Added", description: "New item added to list." });
//         }
//         setIsAddingProcedure(false);
//         setEditingProcedureId(null);
//         setNewProcData({ description: '', price: '' });
//     } catch (error) {
//         console.error("Save Error:", error);
//         toast({ title: "Error", description: "Failed to save item. Is backend running?", variant: "destructive" });
//     }
//   };

//   const handleDeleteProcedure = async (id) => {
//     if(!confirm("Delete this item permanently?")) return;
//     try {
//         await axios.delete(`${API_BASE_URL}/procedures/${id}`);
//         setProcedureItems(items => items.filter(i => i.id !== id));
//         const newSel = { ...selectedItems };
//         delete newSel[id];
//         setSelectedItems(newSel);
//     } catch(err) { toast({ title: "Error", variant: "destructive" }); }
//   };

//   const toggleSelection = (item) => {
//     setSelectedItems(prev => {
//         const next = { ...prev };
//         if (next[item.id]) {
//             delete next[item.id];
//         } else {
//             next[item.id] = { ...item, quantity: 1 };
//         }
//         return next;
//     });
//   };

//   const updateQuantity = (id, delta) => {
//     setSelectedItems(prev => {
//         const item = prev[id];
//         if (!item) return prev;
//         const newQty = Math.max(1, item.quantity + delta);
//         return { ...prev, [id]: { ...item, quantity: newQty } };
//     });
//   };

//   const calculateSelectionTotal = () => {
//     return Object.values(selectedItems).reduce((sum, item) => sum + (item.price * item.quantity), 0);
//   };

//   const addSelectedToTable = async () => {
//     if (!activeTreatmentId) return;
//     const items = Object.values(selectedItems);
//     if (items.length === 0) return;

//     try {
//         for (const item of items) {
//             const payload = {
//                 notes: `${item.description} (x${item.quantity})`,
//                 cost: item.price * item.quantity,
//                 status: "Unpaid",
//                 date: new Date().toISOString().split('T')[0]
//             };
//             await axios.post(`${API_BASE_URL}/treatments/${activeTreatmentId}/rows`, payload);
//         }
//         fetchTreatments();
//         setIsQuickEstOpen(false);
//         toast({ title: "Success", description: `${items.length} items added to table.` });
//     } catch (error) {
//         toast({ title: "Error", description: "Failed to add items.", variant: "destructive" });
//     }
//   };

//   const calculateTotalCost = (rows) => rows.reduce((sum, row) => sum + (parseFloat(row.cost) || 0), 0);
//   const adjustTextareaHeight = (e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; };

//   if (loading && treatments.length === 0) {
//       return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary"/></div>;
//   }

//   return (
//     <div className="space-y-8 animate-in fade-in duration-500">
      
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div>
//             <h2 className="text-xl font-semibold dark:text-slate-100 flex items-center gap-2">
//               <TableIcon className="h-5 w-5 text-primary" />
//               Patient Hisab Kitab
//             </h2>
//         </div>
//         <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-md">
//           <Plus className="mr-2 h-4 w-4" /> New Treatment Table
//         </Button>
//       </div>

//       {treatments.length === 0 && !loading && (
//         <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
//           <TableIcon className="h-8 w-8 text-muted-foreground opacity-50 mb-4" />
//           <h3 className="text-lg font-medium dark:text-slate-300">No Records Yet</h3>
//           <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>Create First Table</Button>
//         </div>
//       )}

//       {treatments.map((treatment) => (
//         <Card key={treatment.id} className="dark:bg-slate-800/50 dark:border-slate-700 shadow-sm overflow-hidden border-t-4 border-t-blue-500">
//           <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20 dark:bg-slate-900/40">
//             <div className="flex items-center gap-3">
//                 <CardTitle className="text-lg font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
//                    <FileText className="h-4 w-4" /> {treatment.title}
//                 </CardTitle>
//                 <Badge variant="secondary" className="text-xs font-normal">{treatment.rows?.length || 0} Entries</Badge>
//             </div>
//             <div className="flex items-center gap-3">
//                 <div className="hidden sm:flex items-center gap-2 text-sm font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-md shadow-sm">
//                     <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
//                     <span>Total: ₹{calculateTotalCost(treatment.rows || []).toFixed(2)}</span>
//                 </div>
//                 <Button variant="ghost" size="icon" onClick={() => handleDeleteTreatment(treatment.id)} className="text-muted-foreground hover:text-red-500">
//                     <Trash2 className="h-4 w-4" />
//                 </Button>
//             </div>
//           </CardHeader>
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//                 <Table>
//                 <TableHeader className="bg-slate-50 dark:bg-slate-900/60 border-b">
//                     <TableRow>
//                     <TableHead className="w-[50px] text-center font-semibold">Sr.</TableHead>
//                     <TableHead className="min-w-[250px] font-semibold">Notes / Description</TableHead>
//                     <TableHead className="w-[120px] font-semibold">Cost (₹)</TableHead>
//                     <TableHead className="w-[160px] font-semibold">Status</TableHead>
//                     <TableHead className="w-[150px] font-semibold">Date</TableHead>
//                     <TableHead className="w-[50px]"></TableHead>
//                     </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                     {(!treatment.rows || treatment.rows.length === 0) ? (
//                         <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground text-sm">Empty table.</TableCell></TableRow>
//                     ) : (
//                         treatment.rows.map((row, index) => (
//                         <TableRow key={row.id} className="group hover:bg-muted/30">
//                             <TableCell className="text-center font-medium text-muted-foreground bg-muted/5 align-top pt-4">{index + 1}</TableCell>
//                             <TableCell className="p-1 align-top">
//                                 <Textarea value={row.notes || ""} 
//                                     onChange={(e) => { updateRowState(treatment.id, row.id, 'notes', e.target.value); adjustTextareaHeight(e); }}
//                                     onBlur={(e) => saveRowChange(row.id, 'notes', e.target.value)}
//                                     className="min-h-[40px] border-none bg-transparent shadow-none resize-none overflow-hidden py-2" placeholder="Details..." rows={1} />
//                             </TableCell>
//                             <TableCell className="p-1 align-top">
//                                 <Input type="number" value={row.cost || ""} 
//                                     onChange={(e) => updateRowState(treatment.id, row.id, 'cost', e.target.value)}
//                                     onBlur={(e) => saveRowChange(row.id, 'cost', e.target.value)}
//                                     className="h-10 border-none bg-transparent shadow-none font-mono" placeholder="0" />
//                             </TableCell>
//                             <TableCell className="p-1 align-top">
//                                 <Select value={row.status || "Unpaid"} onValueChange={(val) => { updateRowState(treatment.id, row.id, 'status', val); saveRowChange(row.id, 'status', val); }}>
//                                     <SelectTrigger className={`h-10 border-none shadow-none bg-transparent ${row.status === 'Paid' ? 'text-green-600' : row.status === 'Unpaid' ? 'text-red-500' : 'text-yellow-600'}`}><SelectValue /></SelectTrigger>
//                                     <SelectContent>
//                                         <SelectItem value="Paid" className="text-green-600">Paid</SelectItem>
//                                         <SelectItem value="Partially Paid" className="text-yellow-600">Partially Paid</SelectItem>
//                                         <SelectItem value="Unpaid" className="text-red-500">Unpaid</SelectItem>
//                                     </SelectContent>
//                                 </Select>
//                             </TableCell>
//                             <TableCell className="p-1 align-top">
//                                 <Input type="date" value={row.date || ""} 
//                                     onChange={(e) => updateRowState(treatment.id, row.id, 'date', e.target.value)}
//                                     onBlur={(e) => saveRowChange(row.id, 'date', e.target.value)}
//                                     className="h-10 border-none bg-transparent shadow-none text-sm" />
//                             </TableCell>
//                             <TableCell className="text-center p-1 align-top pt-2">
//                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500" onClick={() => handleDeleteRow(treatment.id, row.id)}><Trash2 className="h-4 w-4" /></Button>
//                             </TableCell>
//                         </TableRow>
//                         ))
//                     )}
//                 </TableBody>
//                 </Table>
//             </div>
//             <div className="p-2 border-t bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-800 flex gap-2">
//                 <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-primary hover:bg-primary/5 dashed-border" onClick={() => handleAddRow(treatment.id)}><Plus className="h-3.5 w-3.5 mr-2" /> Add Row</Button>
//                 <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 dashed-border" onClick={() => openQuickEstimate(treatment.id)}><Zap className="h-3.5 w-3.5 mr-2" /> Quick Estimate</Button>
//             </div>
//           </CardContent>
//         </Card>
//       ))}

//       {/* --- QUICK ESTIMATE MODAL --- */}
//       <Dialog open={isQuickEstOpen} onOpenChange={setIsQuickEstOpen}>
//         <DialogContent className="w-[95vw] max-w-lg h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-slate-900 border-none rounded-lg overflow-hidden outline-none">
            
//             {/* Header: Fixed to include DialogTitle and Description for Accessibility */}
//             <DialogHeader className="p-4 border-b flex flex-row items-center justify-between bg-white dark:bg-slate-900 z-10 space-y-0">
//                 <div className="flex items-center gap-2">
//                     <DialogTitle>Items List</DialogTitle>
//                     <Button size="sm" variant="outline" className="h-7 text-xs gap-1 ml-2" onClick={() => { setIsAddingProcedure(true); setEditingProcedureId(null); setNewProcData({description:'', price:''}); }}>
//                         <Plus className="h-3 w-3"/> Add Procedure
//                     </Button>
//                 </div>
//                 {/* Visual Hidden Description for Accessibility */}
//                 <DialogDescription className="sr-only">
//                     Select medical procedures to add to the treatment table.
//                 </DialogDescription>
//                 {/* Close button is handled automatically by DialogContent usually, but we keep explicit check if needed */}
//             </DialogHeader>

//             {/* Content Area */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50">
//                 {isAddingProcedure && (
//                     <Card className="mb-4 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20">
//                         <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm font-medium">{editingProcedureId ? 'Edit Item' : 'New Item'}</CardTitle></CardHeader>
//                         <CardContent className="space-y-3 pb-3">
//                             <Input placeholder="Description" value={newProcData.description} onChange={e => setNewProcData({...newProcData, description: e.target.value})} className="bg-white dark:bg-slate-900" />
//                             <Input type="number" placeholder="Price (₹)" value={newProcData.price} onChange={e => setNewProcData({...newProcData, price: e.target.value})} className="bg-white dark:bg-slate-900" />
//                             <div className="flex justify-end gap-2">
//                                 <Button variant="ghost" size="sm" onClick={() => setIsAddingProcedure(false)}>Cancel</Button>
//                                 <Button size="sm" onClick={handleSaveProcedure}>Save</Button>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}

//                 {procedureItems.length === 0 ? (
//                     <div className="text-center text-muted-foreground py-10">No items found. Add one above.</div>
//                 ) : (
//                     procedureItems.map(item => {
//                         const isSelected = !!selectedItems[item.id];
//                         const qty = selectedItems[item.id]?.quantity || 1;
//                         return (
//                             <div key={item.id} className={`p-3 rounded-lg border transition-all ${isSelected ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
//                                 <div className="flex flex-col gap-2">
//                                     <div className="flex items-start gap-3">
//                                         <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" checked={isSelected} onChange={() => toggleSelection(item)} />
//                                         <span className={`font-medium text-base ${isSelected ? 'text-blue-700 dark:text-blue-300' : ''}`}>{item.description}</span>
//                                     </div>
//                                     <div className="flex items-center justify-between pl-8">
//                                         {isSelected ? (
//                                             <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border shadow-sm h-8">
//                                                 <button className="px-2 hover:bg-slate-100" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3"/></button>
//                                                 <span className="w-8 text-center text-sm font-semibold">{qty}</span>
//                                                 <button className="px-2 hover:bg-slate-100" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3"/></button>
//                                             </div>
//                                         ) : <span className="text-xs text-muted-foreground">Select to add</span>}
//                                         <div className="flex items-center gap-4">
//                                             <span className="font-bold font-mono">₹{item.price}</span>
//                                             <div className="flex items-center gap-1">
//                                                 <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-500" onClick={() => { setIsAddingProcedure(true); setEditingProcedureId(item.id); setNewProcData({description: item.description, price: item.price}); }}><Edit2 className="h-3.5 w-3.5" /></Button>
//                                                 <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => handleDeleteProcedure(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         );
//                     })
//                 )}
//             </div>

//             {/* Sticky Footer */}
//             <div className="p-4 border-t bg-white dark:bg-slate-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
//                 <div className="flex items-center justify-between mb-3">
//                     <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
//                     <span className="text-xl font-bold text-primary">₹{calculateSelectionTotal().toFixed(2)}</span>
//                 </div>
//                 <Button className="w-full h-11 text-lg shadow-lg" disabled={calculateSelectionTotal() === 0} onClick={addSelectedToTable}>
//                     Add to Table
//                 </Button>
//             </div>

//         </DialogContent>
//       </Dialog>

//       {/* --- Create Table Dialog --- */}
//       <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
//         <DialogContent className="sm:max-w-[425px]">
//           <DialogHeader><DialogTitle>New Treatment Table</DialogTitle></DialogHeader>
//           <div className="py-4"><Input value={newTableTitle} onChange={(e) => setNewTableTitle(e.target.value)} placeholder="Title..." autoFocus /></div>
//           <DialogFooter><Button onClick={handleCreateTreatment}>Create Table</Button></DialogFooter>
//         </DialogContent>
//       </Dialog>

//     </div>
//   );
// };

// export default PatientPaymentsTab;