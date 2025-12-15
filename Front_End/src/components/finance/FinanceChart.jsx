import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';

const FinanceChart = ({ revenueData, expenseData, filterType, dateRange }) => {
  
  // --- 1. UNIVERSAL DATE PARSER (The Fix) ---
  // Handles both String "2024-12-25" and Array [2024, 12, 25] formats
  const parseUniversalDate = (dateInput) => {
    if (!dateInput) return null;

    // Case A: It's an array [2024, 12, 25] (Spring Boot Default)
    if (Array.isArray(dateInput)) {
      const [year, month, day] = dateInput;
      // Note: Javascript months are 0-indexed (0=Jan, 11=Dec), but Java is 1-indexed.
      return new Date(year, month - 1, day);
    }

    // Case B: It's a string "2024-12-25"
    return new Date(dateInput);
  };

  const chartData = useMemo(() => {
    // 2. Determine Date Range
    let startDate, endDate;
    const now = new Date();

    if (dateRange?.start && dateRange?.end) {
      startDate = new Date(dateRange.start);
      endDate = new Date(dateRange.end);
    } else {
      // Defaults if no range provided
      if (filterType === 'Today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
      } else if (filterType === 'This Week') {
        const currentDay = now.getDay(); 
        const diffToMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
        startDate = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6);
      } else if (filterType === 'This Year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
      } else { 
        // Default: This Month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }

    // Normalize boundaries to remove time (00:00:00)
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const isWithinRange = (d) => {
      if (!d || isNaN(d)) return false;
      return d >= startDate && d <= endDate;
    };

    // 3. Logic to Group Data (Daily vs Monthly)
    const diffDays = (endDate - startDate) / (1000 * 3600 * 24);
    const groupByDay = 
      filterType === 'Today' || 
      filterType === 'This Week' || 
      filterType === 'This Month' || 
      diffDays <= 32; // Smart check: if range is small, show days.

    const getGroupKey = (d) => {
      // Format as YYYY-MM-DD for daily, YYYY-MM for monthly
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return groupByDay ? `${year}-${month}-${day}` : `${year}-${month}`;
    };

    const aggregated = {};

    const processEntries = (entries, type) => {
      if (!entries) return;
      
      entries.forEach(entry => {
        // Use our Robust Parser
        const dateObj = parseUniversalDate(entry.date);
        
        if (!dateObj || !isWithinRange(dateObj)) return;
        
        const key = getGroupKey(dateObj);
        if (!aggregated[key]) aggregated[key] = { revenue: 0, expenses: 0 };
        
        aggregated[key][type] += parseFloat(entry.amount || 0);
      });
    };

    processEntries(revenueData, 'revenue');
    processEntries(expenseData, 'expenses');

    return Object.entries(aggregated)
      .map(([label, data]) => ({ label, ...data }))
      .sort((a, b) => a.label.localeCompare(b.label));

  }, [revenueData, expenseData, filterType, dateRange]);

  const maxAmount = Math.max(1, ...chartData.map(d => Math.max(d.revenue, d.expenses)));

  return (
    <Card className="dark:bg-slate-800/70 mt-6">
      <CardHeader>
        <CardTitle className="text-foreground dark:text-slate-200">Financial Trends</CardTitle>
        <CardDescription className="dark:text-slate-400">
          Revenue vs Expenses ({filterType})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center bg-muted/30 dark:bg-slate-700/30 rounded-md border border-dashed">
            <div className="text-center text-muted-foreground dark:text-slate-400">
              <BarChart2 className="h-12 w-12 mx-auto mb-3 text-primary/50" />
              <p>No data found for this period.</p>
              <p className="text-xs mt-1 opacity-70">Try changing the filter to "This Year" or adding a Payment.</p>
            </div>
          </div>
        ) : (
          <div className="h-[250px] w-full flex items-end space-x-2 sm:space-x-4 p-4 bg-muted/20 dark:bg-slate-700/20 rounded-md overflow-x-auto">
            {chartData.map((data, index) => (
              <div key={index} className="flex-1 min-w-[30px] sm:min-w-[40px] flex flex-col items-center justify-end group relative h-full">
                
                {/* Hover Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-xs p-2 rounded shadow-xl z-20 whitespace-nowrap">
                  <span className="font-bold border-b border-slate-700 pb-1 mb-1">{data.label}</span>
                  <span className="text-green-400">Rev: ₹{data.revenue.toFixed(2)}</span>
                  <span className="text-red-400">Exp: ₹{data.expenses.toFixed(2)}</span>
                </div>

                <div className="flex w-full h-full items-end justify-center gap-1">
                  {/* Revenue Bar */}
                  <div
                    className="bg-green-500 dark:bg-green-400 w-1/2 rounded-t-sm transition-all duration-500 hover:opacity-80"
                    style={{ height: `${(data.revenue / maxAmount) * 100}%` }}
                  ></div>
                  {/* Expense Bar */}
                  <div
                    className="bg-red-500 dark:bg-red-400 w-1/2 rounded-t-sm transition-all duration-500 hover:opacity-80"
                    style={{ height: `${(data.expenses / maxAmount) * 100}%` }}
                  ></div>
                </div>
                
                {/* Label (Shows Day if Daily, Month if Monthly) */}
                <p className="text-[10px] mt-2 text-muted-foreground dark:text-slate-400 truncate w-full text-center">
                   {data.label.split('-').slice(1).join('/')} 
                </p>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-center items-center space-x-6 mt-6 text-sm">
            <div className="flex items-center">
              <span className="h-3 w-3 rounded-full bg-green-500 dark:bg-green-400 mr-2"></span>
              <span className="text-muted-foreground dark:text-slate-300">Revenue</span>
            </div>
            <div className="flex items-center">
              <span className="h-3 w-3 rounded-full bg-red-500 dark:bg-red-400 mr-2"></span>
              <span className="text-muted-foreground dark:text-slate-300">Expenses</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinanceChart;