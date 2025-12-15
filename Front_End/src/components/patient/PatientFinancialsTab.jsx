import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, DollarSign, Calendar, FileText } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PatientFinancialsTab = ({ patientId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // Fetch all payments for this patient
        const response = await axios.get(`${API_BASE_URL}/finance/patient/${patientId}`);
        setPayments(response.data || []);
      } catch (error) {
        console.error("Failed to load payments", error);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchPayments();
  }, [patientId]);

  const handleDownloadInvoice = (paymentId) => {
    // Open the PDF in a new tab
    window.open(`${API_BASE_URL}/finance/payments/${paymentId}/invoice`, '_blank');
  };

  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6">
      
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Spent</p>
            <h2 className="text-3xl font-bold text-green-700 dark:text-green-400">₹{totalSpent.toFixed(2)}</h2>
          </div>
          <div className="h-12 w-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-green-700 dark:text-green-300" />
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5"/> Payment History
        </h3>
        
        {payments.length === 0 ? (
            <p className="text-muted-foreground">No payments recorded yet.</p>
        ) : (
            payments.map((payment, index) => (
            <motion.div 
                key={payment.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 }}
            >
                <Card className="hover:shadow-md transition-shadow">
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg">₹{payment.amount}</h4>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                {payment.method || 'Cash'}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{payment.description || 'Medical Service'}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" /> {new Date(payment.date).toLocaleDateString()}
                        </div>
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(payment.id)}>
                        <Download className="mr-2 h-4 w-4" /> Receipt
                    </Button>
                </div>
                </Card>
            </motion.div>
            ))
        )}
      </div>
    </motion.div>
  );
};

export default PatientFinancialsTab;