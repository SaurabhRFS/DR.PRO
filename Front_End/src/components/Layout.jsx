
import React from 'react';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { Toaster } from '@/components/ui/toaster';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-900">
      <Navbar /> {/* Keep for larger screens or as a header */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8" 
      >
        {children}
      </motion.main>
      <footer className="hidden md:block py-6 text-center text-sm text-muted-foreground border-t border-border/50">
        © {new Date().getFullYear()} DentistPro. All rights reserved.
        Powered by Hostinger Horizons.
      </footer>
      <BottomNav /> {/* For mobile navigation */}
      <Toaster />
    </div>
  );
};

export default Layout;
