
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, CheckCheck } from 'lucide-react';

const AppointmentStatusBadge = ({ status }) => {
  let bgColor, textColor, Icon;
  switch (status) {
    case 'Done':
      bgColor = 'bg-green-100 dark:bg-green-900/50';
      textColor = 'text-green-600 dark:text-green-400';
      Icon = CheckCircle;
      break;
    case 'Confirmed':
      bgColor = 'bg-sky-100 dark:bg-sky-900/50';
      textColor = 'text-sky-600 dark:text-sky-400';
      Icon = CheckCheck;
      break;
    case 'Cancelled':
      bgColor = 'bg-red-100 dark:bg-red-900/50';
      textColor = 'text-red-600 dark:text-red-400';
      Icon = XCircle;
      break;
    case 'Missed':
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/50';
      textColor = 'text-yellow-600 dark:text-yellow-400';
      Icon = AlertTriangle;
      break;
    default: // Scheduled / Upcoming
      bgColor = 'bg-blue-100 dark:bg-blue-900/50';
      textColor = 'text-blue-600 dark:text-blue-400';
      Icon = Clock;
  }
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center ${bgColor} ${textColor}`}>
      <Icon className="h-3.5 w-3.5 mr-1.5" />
      {status || 'Scheduled'}
    </span>
  );
};

export default AppointmentStatusBadge;
