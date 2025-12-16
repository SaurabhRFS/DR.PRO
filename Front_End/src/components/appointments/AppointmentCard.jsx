import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Briefcase as BriefcaseMedical, DollarSign, Edit, Trash2, MoreHorizontal, CheckCircle, XCircle, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import AppointmentStatusBadge from '@/components/appointments/AppointmentStatusBadge';

const AppointmentCard = ({ appointment, patientName, onEdit, onDelete, onStatusChange, index }) => {
  const cardBorderColor = () => {
    switch (appointment.status) {
      case 'Done': return 'hsl(var(--accent))';
      case 'Cancelled':
      case 'Missed': return 'hsl(var(--destructive))';
      default: return 'hsl(var(--primary))';
    }
  };

  // Combine legacy single file and new multiple files for display
  const extraImages = [
      ...(appointment.fileUrls || []),
      appointment.additionalFileUrl
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-shadow border-l-4 h-full flex flex-col" style={{ borderColor: cardBorderColor() }}>
        {/* Header - NO CHANGE */}
        <CardHeader className="flex flex-row justify-between items-start p-4 pb-2">
          <div>
            <CardTitle className="text-lg hover:text-primary">
              <Link to={`/patients/${appointment.patientId}`}>{patientName}</Link>
            </CardTitle>
            <CardDescription className="text-sm">
              <BriefcaseMedical className="inline h-4 w-4 mr-1.5 text-muted-foreground" />
              {appointment.notes || "General Checkup"}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(appointment)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Details
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => onStatusChange(appointment, 'Done')}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Mark as Done
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(appointment, 'Cancelled')}>
                <XCircle className="mr-2 h-4 w-4 text-red-600" /> Cancel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(appointment, 'Missed')}>
                <AlertCircle className="mr-2 h-4 w-4 text-orange-600" /> Mark as Missed
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(appointment)} className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm flex-grow">
          <div className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            {new Date(appointment.date).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            {appointment.time || "--:--"}
          </div>
          <div className="flex items-center col-span-2 sm:col-span-1">
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          {appointment.cost && (
            <div className="flex items-center text-green-600 font-medium">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              ₹{parseFloat(appointment.cost).toFixed(2)}
            </div>
          )}

          {/* --- Images Section (Updated for Multiple) --- */}
          {(appointment.prescriptionUrl || extraImages.length > 0) && (
            <div className="col-span-2 sm:col-span-3 mt-3 pt-3 border-t border-dashed flex flex-wrap gap-3">
              
              {/* Prescription (Single - specific icon) */}
              {appointment.prescriptionUrl && (
                <a href={appointment.prescriptionUrl} target="_blank" rel="noopener noreferrer" className="group relative block">
                   <div className="h-14 w-14 rounded-md overflow-hidden border bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <img 
                        src={appointment.prescriptionUrl} 
                        alt="Prescription" 
                        className="h-full w-full object-cover group-hover:opacity-80 transition-opacity"
                        onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} 
                      />
                      <FileText className="h-6 w-6 text-muted-foreground hidden" />
                   </div>
                   <span className="text-[10px] text-muted-foreground mt-1 block text-center truncate w-14">Rx</span>
                </a>
              )}
              
              {/* Extra Images (Multiple) */}
              {extraImages.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative block">
                   <div className="h-14 w-14 rounded-md overflow-hidden border bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <img 
                        src={url} 
                        alt="Extra" 
                        className="h-full w-full object-cover group-hover:opacity-80 transition-opacity"
                        onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                      />
                      <ImageIcon className="h-6 w-6 text-muted-foreground hidden" />
                   </div>
                   <span className="text-[10px] text-muted-foreground mt-1 block text-center truncate w-14">Img {i+1}</span>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AppointmentCard;