
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const PatientPageHeader = ({ patient, onOpenDeleteDialog, isDeleteDialogOpen, onCloseDeleteDialog, onDeleteConfirm }) => {
  const navigate = useNavigate();
  if (!patient) return null;

  const getInitials = (name) => {
    if (!name) return 'P';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0]?.[0]?.toUpperCase() || 'P';
  };

  return (
    <>
      <CardHeader className="bg-gradient-to-br from-primary/10 to-purple-500/5 p-4 sm:p-6 dark:from-primary/20 dark:to-purple-500/10 dark:bg-slate-850">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white dark:border-slate-700 shadow-lg">
            <AvatarImage src={patient.avatarUrl || `https://avatar.vercel.sh/${patient.name}.png?size=96`} alt={patient.name} />
            <AvatarFallback className="text-2xl sm:text-3xl bg-muted dark:bg-slate-600 dark:text-slate-200">{getInitials(patient.name)}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left flex-grow">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground dark:text-slate-100 drop-shadow-md">{patient.name}</CardTitle>
            <CardDescription className="text-base sm:text-lg text-primary-foreground/80 dark:text-slate-300">{patient.email || 'No email provided'}</CardDescription>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0 self-center sm:self-auto">
            <Button 
              onClick={() => navigate(`/patients/${patient.id}/edit`)} 
              size="default" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-sky-500 dark:hover:bg-sky-600 dark:text-white px-4 py-2 text-sm"
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={onCloseDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="default" onClick={onOpenDeleteDialog} className="px-4 py-2 text-sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glassmorphic dark:bg-slate-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="dark:text-slate-100">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="dark:text-slate-300">
                    This action cannot be undone. This will permanently delete the patient record for <span className="font-semibold">{patient.name}</span> and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={onCloseDeleteDialog} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete patient
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
    </>
  );
};

export default PatientPageHeader;
