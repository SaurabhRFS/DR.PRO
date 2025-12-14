
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Landmark, CalendarDays, Outdent as Tooth } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Appointments', href: '/appointments', icon: CalendarDays },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Finance', href: '/finance', icon: Landmark },
];

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-primary to-purple-600 shadow-lg sticky top-0 z-50 hidden md:block">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <Tooth className="h-10 w-10 text-white" />
            </motion.div>
            <span className="text-2xl font-bold text-white tracking-tight">
              DentistPro
            </span>
          </Link>
          <div className="flex items-center space-x-2">
            {navItems.map((item) => (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={item.href}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 flex items-center',
                    location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-purple-100 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
