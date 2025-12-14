
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';

const FinanceChart = ({ revenueData, expenseData, filterType, dateRange }) => {
  const aggregateDataByPeriod = (entries, periodType, range) => {
    const aggregated = {};
    const { start, end } = range || {};

    let startDate = start;
    let endDate = end;
    
    if (!startDate || !endDate) { // Fallback if range is not properly defined by filter
        const now = new Date();
        if (periodType === 'Today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = startDate;
        } else if (periodType === 'This Week') {
            const currentDay = now.getDay();
            const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
            startDate = new Date(now.getFullYear(), now.getMonth(), diff);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6);
        } else if (periodType === 'This Year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
        } else { // Default to This Month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
    }
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      // Ensure entryDate is within the startDate and endDate
      const normalizedEntryDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
      if (normalizedEntryDate < startDate || normalizedEntryDate > endDate) {
        return; // Skip entries outside the current filter's range
      }

      let key;
      const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

      if (filterType === 'Today' || filterType === 'This Week' || (filterType === 'Custom Date Range' && diffDays <= 31)) {
        key = entryDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
      } else if (filterType === 'This Month' || filterType === 'This Quarter' || (filterType === 'Custom Date Range' && diffDays <= 366 && startDate.getFullYear() === endDate.getFullYear()) || filterType === 'This Year') {
        key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      } else { // Yearly for multi-year custom ranges
        key = entryDate.getFullYear().toString(); // YYYY
      }
      aggregated[key] = (aggregated[key] || 0) + parseFloat(entry.amount || 0);
    });
    return Object.entries(aggregated).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  };

  const chartRevenue = aggregateDataByPeriod(revenueData, filterType, dateRange);
  const chartExpenses = aggregateDataByPeriod(expenseData, filterType, dateRange);

  const allKeys = [...new Set([...chartRevenue.map(([key]) => key), ...chartExpenses.map(([key]) => key)])].sort();
  
  const chartData = allKeys.map(key => {
    const revenueEntry = chartRevenue.find(([k]) => k === key);
    const expenseEntry = chartExpenses.find(([k]) => k === key);
    return {
      label: key,
      revenue: revenueEntry ? revenueEntry[1] : 0,
      expenses: expenseEntry ? expenseEntry[1] : 0,
    };
  });

  const maxAmount = Math.max(1, ...chartData.map(d => Math.max(d.revenue, d.expenses)));

  return (
    <Card className="dark:bg-slate-800/70">
      <CardHeader>
        <CardTitle className="text-foreground dark:text-slate-200">Financial Trends</CardTitle>
        <CardDescription className="dark:text-slate-400">Revenue vs Expenses for: {filterType}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center bg-muted/30 dark:bg-slate-700/30 rounded-md">
            <div className="text-center text-muted-foreground dark:text-slate-400">
              <BarChart2 className="h-12 w-12 mx-auto mb-3 text-primary/50" />
              <p>No data available for the selected period to display chart.</p>
            </div>
          </div>
        ) : (
          <div className="h-[250px] w-full flex items-end space-x-2 sm:space-x-3 p-2 bg-muted/20 dark:bg-slate-700/20 rounded-md overflow-x-auto">
            {chartData.map((data, index) => (
              <div key={index} className="flex-1 min-w-[40px] sm:min-w-[50px] flex flex-col items-center justify-end group">
                <div className="flex w-full h-full items-end justify-center gap-1">
                  <div
                    className="bg-green-500 dark:bg-green-400 w-1/2 rounded-t-sm transition-all duration-200 group-hover:opacity-75"
                    style={{ height: `${(data.revenue / maxAmount) * 100}%` }}
                    title={`Revenue: ₹${data.revenue.toFixed(2)}`}
                  ></div>
                  <div
                    className="bg-red-500 dark:bg-red-400 w-1/2 rounded-t-sm transition-all duration-200 group-hover:opacity-75"
                    style={{ height: `${(data.expenses / maxAmount) * 100}%` }}
                    title={`Expenses: ₹${data.expenses.toFixed(2)}`}
                  ></div>
                </div>
                <p className="text-xs mt-1 text-muted-foreground dark:text-slate-400 truncate w-full text-center">{data.label}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center items-center space-x-4 mt-4 text-sm">
            <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-green-500 dark:bg-green-400 mr-2"></span>Revenue</div>
            <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-red-500 dark:bg-red-400 mr-2"></span>Expenses</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinanceChart;
