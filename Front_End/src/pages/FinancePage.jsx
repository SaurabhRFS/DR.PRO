import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, PlusCircle, Filter, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';
import FinanceCalendar from '@/components/finance/FinanceCalendar';
import FinanceChart from '@/components/finance/FinanceChart';
import FinanceDetailsModal from '@/components/finance/FinanceDetailsModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = {
  getAppointments: async () => {
    const response = await fetch(`${API_BASE_URL}/appointments`);
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },
  getPatients: async () => {
    const response = await fetch(`${API_BASE_URL}/patients`);
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  },
  getRevenueEntries: async () => {
    const response = await fetch(`${API_BASE_URL}/revenue`);
    if (!response.ok) throw new Error('Failed to fetch revenue entries');
    return response.json();
  },
  addRevenueEntry: async (entry) => {
    const response = await fetch(`${API_BASE_URL}/revenue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error('Failed to add revenue entry');
    return response.json();
  },
  getExpenseEntries: async () => {
    const response = await fetch(`${API_BASE_URL}/expenses`);
    if (!response.ok) throw new Error('Failed to fetch expense entries');
    return response.json();
  },
  addExpenseEntry: async (entry) => {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error('Failed to add expense entry');
    return response.json();
  },
};

const FinancePage = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [revenueEntries, setRevenueEntries] = useState([]);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isRevenueFormOpen, setIsRevenueFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [currentRevenueEntry, setCurrentRevenueEntry] = useState({ source: 'Patient', amount: '', notes: '', date: new Date().toISOString().split('T')[0], patientId: '' });
  const [currentExpenseEntry, setCurrentExpenseEntry] = useState({ type: 'Others', amount: '', notes: '', date: new Date().toISOString().split('T')[0] });
  const [filter, setFilter] = useState('This Month');
  const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });
  const [viewingDetailsFor, setViewingDetailsFor] = useState(null);
  const [selectedDateForDetails, setSelectedDateForDetails] = useState(null);

  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [appointmentsData, patientsData, revenueData, expenseData] = await Promise.all([
        api.getAppointments(),
        api.getPatients(),
        api.getRevenueEntries(),
        api.getExpenseEntries(),
      ]);
      setAppointments(appointmentsData);
      setPatients(patientsData);
      setRevenueEntries(revenueData);
      setExpenseEntries(expenseData);
    } catch (error) {
      console.error("Error fetching finance data:", error);
      toast({
        title: "Error",
        description: "Failed to load finance data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchParams.get('action') === 'addExpense') {
      setIsExpenseFormOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const getPatientName = useCallback((patientId) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : `ID: ${patientId}`;
  }, [patients]);

  const filterEntriesByDateRange = (entries, startDate, endDate) => {
    if (!startDate || !endDate) return entries;
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const normalizedEntryDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
      return normalizedEntryDate >= startDate && normalizedEntryDate <= endDate;
    });
  };

  const { startDate: currentFilterStartDate, endDate: currentFilterEndDate } = useMemo(() => {
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (filter) {
      case 'Today':
        break;
      case 'This Week':
        const currentDay = now.getDay();
        const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
        startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59, 999);
        break;
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'This Quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
        break;
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'Custom Date Range':
        if (customDateRange.from && customDateRange.to) {
          startDate = new Date(customDateRange.from);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customDateRange.to);
          endDate.setHours(23, 59, 59, 999);
        } else {
          return { startDate: null, endDate: null };
        }
        break;
      default:
        return { startDate: null, endDate: null };
    }
    return { startDate, endDate };
  }, [filter, customDateRange]);


  const completedAppointmentsRevenue = useMemo(() =>
    appointments
      .filter(app => app.status === 'Done' && app.cost)
      .map(app => ({
        id: `app-${app.id}`,
        source: 'Patient Appointment',
        amount: parseFloat(app.cost),
        notes: `Appointment: ${app.notes || 'Treatment'} for ${getPatientName(app.patientId)}`,
        date: app.date,
        patientId: app.patientId,
      })),
    [appointments, getPatientName]
  );

  const allRevenueSources = useMemo(() => [
      ...completedAppointmentsRevenue,
      ...revenueEntries.map(r => ({ ...r, notes: r.notes || (r.patientId ? `Payment from ${getPatientName(r.patientId)}` : 'Misc. Revenue') }))
  ], [completedAppointmentsRevenue, revenueEntries, getPatientName]);


  const filteredRevenue = useMemo(() => filterEntriesByDateRange(allRevenueSources, currentFilterStartDate, currentFilterEndDate), [allRevenueSources, currentFilterStartDate, currentFilterEndDate]);
  const filteredExpenses = useMemo(() => filterEntriesByDateRange(expenseEntries, currentFilterStartDate, currentFilterEndDate), [expenseEntries, currentFilterStartDate, currentFilterEndDate]);

  const totalRevenue = useMemo(() => filteredRevenue.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0), [filteredRevenue]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0), [filteredExpenses]);
  const netProfit = totalRevenue - totalExpenses;

  const handleRevenueSubmit = async (e) => {
    e.preventDefault();
    if (!currentRevenueEntry.amount || !currentRevenueEntry.date) {
      toast({ title: "Missing Fields", description: "Amount and Date are required.", variant: "destructive" });
      return;
    }
    try {
      const newEntry = await api.addRevenueEntry({ ...currentRevenueEntry, amount: parseFloat(currentRevenueEntry.amount) });
      setRevenueEntries(prev => [...prev, newEntry]);
      toast({ title: "Revenue Added", description: "New revenue entry recorded." });
      setIsRevenueFormOpen(false);
      setCurrentRevenueEntry({ source: 'Patient', amount: '', notes: '', date: new Date().toISOString().split('T')[0], patientId: '' });
    } catch (error) {
      console.error("Error adding revenue entry:", error);
      toast({ title: "Error", description: "Failed to add revenue entry.", variant: "destructive" });
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!currentExpenseEntry.amount || !currentExpenseEntry.date || !currentExpenseEntry.type) {
      toast({ title: "Missing Fields", description: "Type, Amount and Date are required.", variant: "destructive" });
      return;
    }
    try {
      const newEntry = await api.addExpenseEntry({ ...currentExpenseEntry, amount: parseFloat(currentExpenseEntry.amount) });
      setExpenseEntries(prev => [...prev, newEntry]);
      toast({ title: "Expense Added", description: "New expense entry recorded." });
      setIsExpenseFormOpen(false);
      setCurrentExpenseEntry({ type: 'Others', amount: '', notes: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Error adding expense entry:", error);
      toast({ title: "Error", description: "Failed to add expense entry.", variant: "destructive" });
    }
  };

  const quickAddExpense = (type, defaultNotePrefix = "") => {
    setCurrentExpenseEntry({ type, amount: '', notes: defaultNotePrefix, date: new Date().toISOString().split('T')[0] });
    setIsExpenseFormOpen(true);
  };
  
  const colorMap = {
    'text-green-500': 'border-green-500',
    'text-red-500': 'border-red-500',
    'text-blue-500': 'border-blue-500',
  };

  const financeSummary = [
    { title: 'Total Revenue', value: isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `₹${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50', detailsKey: 'revenue' },
    { title: 'Total Expenses', value: isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `₹${totalExpenses.toFixed(2)}`, icon: TrendingDown, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/50', detailsKey: 'expenses' },
    { title: 'Net Profit', value: isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `₹${netProfit.toFixed(2)}`, icon: DollarSign, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/50', detailsKey: 'profit' },
  ];

  const handleDateClickForDetails = (date) => {
    setSelectedDateForDetails(date);
    setViewingDetailsFor('dailySummary');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Clinic Financial Overview
        </h1>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50">
              <Filter className="h-4 w-4 mr-2 opacity-50" />
              <SelectValue placeholder="Select filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="This Week">This Week</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="This Quarter">This Quarter</SelectItem>
              <SelectItem value="This Year">This Year</SelectItem>
              <SelectItem value="Custom Date Range">Custom Date Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filter === 'Custom Date Range' && (
        <Card className="dark:bg-slate-800/70">
          <CardHeader>
            <CardTitle className="text-foreground dark:text-slate-200">Custom Date Range</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div>
              <Label htmlFor="fromDate" className="dark:text-slate-300">From</Label>
              <Input type="date" id="fromDate" value={customDateRange.from} onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50" />
            </div>
            <div>
              <Label htmlFor="toDate" className="dark:text-slate-300">To</Label>
              <Input type="date" id="toDate" value={customDateRange.to} onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {financeSummary.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={`overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-out border-l-4 dark:bg-slate-800/70 ${colorMap[item.color] || 'border-transparent'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-300">{item.title}</CardTitle>
                <div className={`p-2 rounded-full ${item.bgColor}`}>
                  {isLoading ? <Loader2 className={`h-5 w-5 animate-spin ${item.color}`} /> : <item.icon className={`h-5 w-5 ${item.color}`} />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                  {item.value}
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-3 flex justify-between items-center">
                <Button size="sm" variant="ghost" className="text-xs justify-start text-muted-foreground hover:text-primary dark:text-slate-400 dark:hover:text-sky-400" onClick={() => item.detailsKey === 'revenue' ? setIsRevenueFormOpen(true) : setIsExpenseFormOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Add Entry
                </Button>
                <Button size="sm" variant="ghost" className="text-xs justify-start text-muted-foreground hover:text-primary dark:text-slate-400 dark:hover:text-sky-400" onClick={() => { setSelectedDateForDetails(null); setViewingDetailsFor(item.detailsKey); }}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> View Details
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* --- FORMS AND MODALS --- */}
      <Dialog open={isRevenueFormOpen} onOpenChange={setIsRevenueFormOpen}>
        <DialogContent className="sm:max-w-[425px] glassmorphic dark:bg-slate-800">
          <DialogHeader><DialogTitle className="text-primary dark:text-sky-400">New Revenue Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleRevenueSubmit} className="space-y-4 py-4">
            <div><Label htmlFor="rev-source" className="dark:text-slate-300">Source</Label>
              <Select name="source" value={currentRevenueEntry.source} onValueChange={(val) => setCurrentRevenueEntry(p => ({ ...p, source: val, patientId: '' }))}>
                <SelectTrigger id="rev-source" className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent><SelectItem value="Patient">Patient Payment</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
              </Select>
            </div>
            {currentRevenueEntry.source === 'Patient' && (
              <div><Label htmlFor="rev-patient" className="dark:text-slate-300">Patient (Optional)</Label>
                <Select name="patientId" value={currentRevenueEntry.patientId} onValueChange={(val) => setCurrentRevenueEntry(p => ({ ...p, patientId: val }))}>
                  <SelectTrigger id="rev-patient" className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label htmlFor="rev-amount" className="dark:text-slate-300">Amount (₹)</Label><Input id="rev-amount" type="number" step="0.01" value={currentRevenueEntry.amount} onChange={(e) => setCurrentRevenueEntry(p => ({ ...p, amount: e.target.value }))} required className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" /></div>
            <div><Label htmlFor="rev-notes" className="dark:text-slate-300">Notes</Label><Textarea id="rev-notes" value={currentRevenueEntry.notes} onChange={(e) => setCurrentRevenueEntry(p => ({ ...p, notes: e.target.value }))} placeholder="e.g., Advance payment, cleaning" className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" /></div>
            <div><Label htmlFor="rev-date" className="dark:text-slate-300">Date</Label><Input id="rev-date" type="date" value={currentRevenueEntry.date} onChange={(e) => setCurrentRevenueEntry(p => ({ ...p, date: e.target.value }))} required className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" /></div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancel</Button></DialogClose>
              <Button type="submit">Add Revenue</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
        <DialogContent className="sm:max-w-[425px] glassmorphic dark:bg-slate-800">
          <DialogHeader><DialogTitle className="text-primary dark:text-sky-400">New Expense Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleExpenseSubmit} className="space-y-4 py-4">
            <div><Label htmlFor="exp-type" className="dark:text-slate-300">Type</Label>
              <Select name="type" value={currentExpenseEntry.type} onValueChange={(val) => setCurrentExpenseEntry(p => ({ ...p, type: val }))}>
                <SelectTrigger id="exp-type" className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staff Salary">Staff Salary</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="exp-amount" className="dark:text-slate-300">Amount (₹)</Label><Input id="exp-amount" type="number" step="0.01" value={currentExpenseEntry.amount} onChange={(e) => setCurrentExpenseEntry(p => ({ ...p, amount: e.target.value }))} required className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" /></div>
            <div><Label htmlFor="exp-notes" className="dark:text-slate-300">Notes</Label><Textarea id="exp-notes" value={currentExpenseEntry.notes} onChange={(e) => setCurrentExpenseEntry(p => ({ ...p, notes: e.target.value }))} placeholder="e.g., April Salary – Dr. Patel" className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" /></div>
            <div><Label htmlFor="exp-date" className="dark:text-slate-300">Date</Label><Input id="exp-date" type="date" value={currentExpenseEntry.date} onChange={(e) => setCurrentExpenseEntry(p => ({ ...p, date: e.target.value }))} required className="dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" /></div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancel</Button></DialogClose>
              <Button type="submit">Add Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FinanceDetailsModal
        isOpen={!!viewingDetailsFor}
        onOpenChange={() => { setViewingDetailsFor(null); setSelectedDateForDetails(null); }}
        viewingDetailsFor={viewingDetailsFor}
        selectedDateForDetails={selectedDateForDetails}
        filterPeriodText={filter}
        allRevenueSources={allRevenueSources}
        expenseEntries={expenseEntries}
        getPatientName={getPatientName}
        totalRevenueForPeriod={totalRevenue}
        totalExpensesForPeriod={totalExpenses}
        netProfitForPeriod={netProfit}
        appointments={appointments}
      />

      <Card className="dark:bg-slate-800/70">
        <CardHeader>
          <CardTitle className="text-foreground dark:text-slate-200">Quick Expense Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Button variant="outline" onClick={() => quickAddExpense('Staff Salary', 'Monthly Staff Salary')} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Add Staff Salary</Button>
          <Button variant="outline" onClick={() => quickAddExpense('Equipment', 'New Equipment Purchase: ')} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Add Equipment Cost</Button>
          <Button variant="outline" onClick={() => quickAddExpense('Rent', 'Monthly Rent')} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Add Rent</Button>
          <Button variant="outline" onClick={() => quickAddExpense('Supplies', 'Dental supplies order')} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Add Supplies Cost</Button>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Card className="p-8 text-center dark:bg-slate-800/70">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <CardTitle className="text-muted-foreground">Loading financial data...</CardTitle>
        </Card>
      ) : (
        <>
          <FinanceCalendar
            revenueEntries={allRevenueSources}
            expenseEntries={expenseEntries}
            appointments={appointments}
            onDateClick={handleDateClickForDetails}
          />

          <FinanceChart 
            revenueData={allRevenueSources} 
            expenseData={expenseEntries} 
            filterType={filter} 
            dateRange={currentFilterStartDate && currentFilterEndDate ? { start: currentFilterStartDate, end: currentFilterEndDate } : null} 
          />
        </>
      )}
    </motion.div>
  );
};

export default FinancePage;