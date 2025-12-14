
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FinanceDetailsModal = ({
  isOpen,
  onOpenChange,
  viewingDetailsFor,
  selectedDateForDetails,
  filterPeriodText,
  allRevenueSources,
  expenseEntries,
  getPatientName,
  totalRevenueForPeriod,
  totalExpensesForPeriod,
  netProfitForPeriod
}) => {

  const renderContent = () => {
    let title = '';
    let data = [];
    let description = `Showing entries for the selected period (${filterPeriodText}).`;

    if (selectedDateForDetails) {
      const dateStr = selectedDateForDetails.toISOString().split('T')[0];
      description = `Details for ${selectedDateForDetails.toLocaleDateString()}`;
      
      const dailyRev = allRevenueSources.filter(entry => entry.date === dateStr);
      const dailyExp = expenseEntries.filter(entry => entry.date === dateStr);
      const dailyTotalRev = dailyRev.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
      const dailyTotalExp = dailyExp.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
      const dailyNetProfit = dailyTotalRev - dailyTotalExp;

      if (viewingDetailsFor === 'dailySummary') {
        title = 'Daily Financial Summary';
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-primary dark:text-sky-400">{title}</DialogTitle>
              <DialogDescription className="dark:text-slate-300">{description}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                <p>Total Revenue: <span className="font-semibold text-green-500">₹{dailyTotalRev.toFixed(2)}</span></p>
                <p>Total Expenses: <span className="font-semibold text-red-500">₹{dailyTotalExp.toFixed(2)}</span></p>
                <p className="text-lg mt-1">Net Profit: <span className="font-bold text-blue-500">₹{dailyNetProfit.toFixed(2)}</span></p>
              </div>
              
              <hr className="my-3 dark:border-slate-600"/>
              
              <div>
                <h4 className="text-md font-semibold mb-1 dark:text-slate-200">Revenue Entries:</h4>
                {dailyRev.length > 0 ? (
                  <ul className="space-y-1.5 text-sm">
                    {dailyRev.map(item => (
                      <li key={`rev-${item.id}`} className="p-2 border-b dark:border-slate-600/70 flex justify-between">
                        <span className="dark:text-slate-300 flex-1 truncate pr-2">{item.notes || (item.patientId ? getPatientName(item.patientId) : item.source)}</span>
                        <span className="text-green-500 font-medium whitespace-nowrap">+ ₹{item.amount.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-muted-foreground dark:text-slate-400">No revenue entries for this day.</p>}
              </div>

              <div className="mt-3">
                <h4 className="text-md font-semibold mb-1 dark:text-slate-200">Expense Entries:</h4>
                {dailyExp.length > 0 ? (
                  <ul className="space-y-1.5 text-sm">
                  {dailyExp.map(item => (
                    <li key={`exp-${item.id}`} className="p-2 border-b dark:border-slate-600/70 flex justify-between">
                      <span className="dark:text-slate-300 flex-1 truncate pr-2">{item.notes || item.type}</span>
                      <span className="text-red-500 font-medium whitespace-nowrap">- ₹{item.amount.toFixed(2)}</span>
                    </li>
                  ))}
                  </ul>
                ) : <p className="text-xs text-muted-foreground dark:text-slate-400">No expense entries for this day.</p>}
              </div>
            </div>
          </>
        );
      }
    } else { // Period summary
        if (viewingDetailsFor === 'revenue') {
          title = 'Total Revenue Details';
          data = allRevenueSources.filter(entry => { // Re-filter based on period for accuracy
            const entryDate = new Date(entry.date);
            const { startDate, endDate } = getDateRangeForFilter(filterPeriodText, {}); // Assuming customDateRange is not needed here or passed if it is
            return entryDate >= startDate && entryDate <= endDate;
          });
        } else if (viewingDetailsFor === 'expenses') {
          title = 'Total Expense Details';
           data = expenseEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const { startDate, endDate } = getDateRangeForFilter(filterPeriodText, {});
            return entryDate >= startDate && entryDate <= endDate;
          });
        } else if (viewingDetailsFor === 'profit') {
          title = 'Net Profit Calculation';
          description = `Summary for the selected period (${filterPeriodText}).`;
          return (
            <> 
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-primary dark:text-sky-400">{title}</DialogTitle>
                <DialogDescription className="dark:text-slate-300">{description}</DialogDescription>
              </DialogHeader>
              <div className="py-4 text-center space-y-1">
                <p className="text-lg">Total Revenue: <span className="font-semibold text-green-500">₹{totalRevenueForPeriod.toFixed(2)}</span></p>
                <p className="text-lg">Total Expenses: <span className="font-semibold text-red-500">₹{totalExpensesForPeriod.toFixed(2)}</span></p>
                <p className="text-xl font-bold mt-2">Net Profit: <span className="text-blue-500">₹{netProfitForPeriod.toFixed(2)}</span></p>
                <p className="text-xs mt-3 text-muted-foreground dark:text-slate-400">View individual revenue and expense entries by clicking their respective summary cards.</p>
              </div>
            </>
          );
        }
    }

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-primary dark:text-sky-400">{title}</DialogTitle>
          <DialogDescription className="dark:text-slate-300">{description}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto py-4">
          {data.length === 0 ? <p className="text-muted-foreground text-center dark:text-slate-400">No entries for this period.</p> : (
            <ul className="space-y-2">
              {data.map(item => (
                <li key={item.id} className="p-3 rounded-md border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium dark:text-slate-200 flex-1 truncate pr-2">{item.notes || item.type || (item.source === 'Patient Appointment' ? `Appt: ${getPatientName(item.patientId)}` : item.source)}</span>
                    <span className={cn("font-semibold whitespace-nowrap", viewingDetailsFor === 'expenses' ? 'text-red-500' : 'text-green-500')}>
                      {viewingDetailsFor === 'expenses' ? '-' : '+'}₹{item.amount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    );
  };
  
  // Helper function, needs to be consistent with FinancePage's getDateRangeForFilter
  const getDateRangeForFilter = (dateFilter, customRange) => {
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (dateFilter) {
      case 'Today': break;
      case 'This Week':
        const currentDay = now.getDay();
        const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0,0,0,0);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23,59,59,999);
        break;
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0,0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23,59,59,999);
        break;
      case 'This Quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1, 0,0,0,0);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23,59,59,999);
        break;
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1, 0,0,0,0);
        endDate = new Date(now.getFullYear(), 11, 31, 23,59,59,999);
        break;
      case 'Custom Date Range':
        if (customRange.from && customRange.to) {
          startDate = new Date(customRange.from); startDate.setHours(0,0,0,0);
          endDate = new Date(customRange.to); endDate.setHours(23,59,59,999);
        } else { return { startDate: null, endDate: null }; }
        break;
      default: return { startDate: null, endDate: null };
    }
    return { startDate, endDate };
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glassmorphic dark:bg-slate-800">
        {renderContent()}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinanceDetailsModal;
