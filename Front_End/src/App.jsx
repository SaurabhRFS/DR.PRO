
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import PatientsListPage from '@/pages/PatientsListPage';
import PatientFormPage from '@/pages/PatientFormPage';
import PatientDetailPage from '@/pages/PatientDetailPage';
import FinancePage from '@/pages/FinancePage';
import AppointmentsPage from '@/pages/AppointmentsPage';
import ProfileSettingsPage from '@/pages/ProfileSettingsPage';
import FinanceCalendar from "@/components/finance/FinanceCalendar";
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedRoute = ({ element }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="w-full" 
  >
    {element}
  </motion.div>
);

function App() {
  return (
    <Router>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<AnimatedRoute element={<DashboardPage />} />} />
            <Route path="/appointments" element={<AnimatedRoute element={<AppointmentsPage />} />} />
            <Route path="/patients" element={<AnimatedRoute element={<PatientsListPage />} />} />
            <Route path="/patients/new" element={<AnimatedRoute element={<PatientFormPage />} />} />
            <Route path="/patients/:patientId" element={<AnimatedRoute element={<PatientDetailPage />} />} />
            <Route path="/patients/:patientId/edit" element={<AnimatedRoute element={<PatientFormPage />} />} />
            <Route path="/finance" element={<AnimatedRoute element={<FinancePage />} />} />
            <Route path="/calendar" element={<FinanceCalendar />} />
            <Route path="/profile-settings/:tab?" element={<AnimatedRoute element={<ProfileSettingsPage />} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </Router>
  );
}

export default App;
