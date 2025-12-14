
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, CalendarDays, Users, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Appointments', href: '/appointments', icon: CalendarDays },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Finance', href: '/finance', icon: Landmark },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-t border-border/50 shadow-top-lg z-50 md:hidden">
      <div className="container mx-auto h-full">
        <ul className="flex justify-around items-center h-full">
          {navItems.map((item) => (
            <li key={item.name} className="flex-1">
              <Link
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center h-full text-xs font-medium transition-colors duration-150 relative pt-1 pb-1',
                  location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary/80'
                )}
              >
                <motion.div
                  animate={location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href)) ? { scale: [1, 1.2, 1], y: [0, -2, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <item.icon className="h-6 w-6 mb-0.5" />
                </motion.div>
                <span>{item.name}</span>
                {(location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))) && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full"
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default BottomNav;
