
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Briefcase as BriefcaseMedical, DollarSign, Edit, Trash2, MoreHorizontal, AlertOctagon, ChevronUp, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppointmentStatusBadge from '@/components/appointments/AppointmentStatusBadge';

const PriorityIndicator = ({ priority }) => {
  if (!priority) return null;
  let color, Icon;
  switch (priority.toLowerCase()) {
    case 'high':
      color = 'text-red-500';
      Icon = ChevronsUp;
      break;
    case 'medium':
      color = 'text-yellow-500';
      Icon = ChevronUp;
      break;
    case 'low':
      color = 'text-green-500';
      Icon = AlertOctagon; 
      break;
    default:
      return null;
  }
  return (
    <div className={`flex items-center text-xs font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5 mr-1" />
      {priority}
    </div>
  );
};

const AppointmentCard = ({ appointment, patientName, onEdit, onDelete, index }) => {
  const cardBorderColor = () => {
    switch (appointment.status) {
      case 'Done': return 'hsl(var(--accent))';
      case 'Cancelled':
      case 'Missed': return 'hsl(var(--destructive))';
      default: return 'hsl(var(--primary))';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-shadow border-l-4" style={{ borderColor: cardBorderColor() }}>
        <CardHeader className="flex flex-row justify-between items-start p-4 pb-2">
          <div>
            <CardTitle className="text-lg hover:text-primary">
              <Link to={`/patients/${appointment.patientId}`}>{patientName}</Link>
            </CardTitle>
            <CardDescription className="text-sm">
              <BriefcaseMedical className="inline h-4 w-4 mr-1.5 text-muted-foreground" />{appointment.service}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(appointment)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(appointment)} className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            {new Date(appointment.date).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            {appointment.time}
          </div>
          <div className="flex items-center col-span-2 sm:col-span-1">
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          {appointment.cost && (
            <div className="flex items-center text-green-600 font-medium">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              ${parseFloat(appointment.cost).toFixed(2)}
            </div>
          )}
          {appointment.priority && (
             <div className="flex items-center">
                <PriorityIndicator priority={appointment.priority} />
             </div>
          )}
        </CardContent>
        {appointment.notes && (
          <CardFooter className="p-4 pt-0 border-t mt-2">
            <p className="text-xs text-muted-foreground"><strong>Notes:</strong> {appointment.notes}</p>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

export default AppointmentCard;
