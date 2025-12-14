
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, FileText, Trash2, Image } from 'lucide-react';


const PatientPrescriptionsTab = ({ patientId, prescriptions, onEdit, onDelete }) => {

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="p-4 md:p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-primary border-b pb-2 flex-grow flex items-center dark:text-sky-400 dark:border-slate-700">
          <Pill className="mr-2 h-5 w-5" /> Prescription Records
        </h3>
        {/* Add Prescription button is now in PatientDetailPage header */}
      </div>

      {(!prescriptions || prescriptions.length === 0) ? (
        <p className="text-muted-foreground text-center py-8 dark:text-slate-400">No prescription records found for this patient.</p>
      ) : (
        <div className="space-y-4">
          {prescriptions.sort((a,b) => new Date(b.date) - new Date(a.date)).map((rx, index) => (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow bg-white/50 dark:bg-slate-800/50 border dark:border-slate-700">
                <CardHeader className="flex flex-row justify-between items-start pb-2 pt-3 px-4">
                  <div>
                    <CardTitle className="text-md sm:text-lg text-primary dark:text-sky-400">{rx.fileName || 'Prescription Note'}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm dark:text-slate-400">
                      {new Date(rx.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {/* Edit might be complex for files, for now just delete */}
                    {/* <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 p-1.5 h-auto dark:text-blue-400 dark:hover:bg-blue-500/10" onClick={() => onEdit(rx)}>
                        <FileText className="h-4 w-4" />
                    </Button> */}
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1.5 h-auto dark:text-red-400 dark:hover:bg-red-500/10" onClick={() => onDelete(rx.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {rx.text && <p className="text-sm text-muted-foreground dark:text-slate-300"><strong>Details:</strong> {rx.text}</p>}
                  {rx.fileUrl && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-slate-300"><strong>Attachment:</strong></p>
                      {rx.fileUrl.startsWith('data:image') ? (
                        <img-replace src={rx.fileUrl} alt={rx.fileName || 'Prescription Image'} className="mt-1 rounded-md max-h-48 object-contain border dark:border-slate-600" />
                      ) : (
                        <a href={rx.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline dark:text-sky-400 flex items-center">
                          <FileText className="h-4 w-4 mr-1" /> {rx.fileName || 'View File'}
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PatientPrescriptionsTab;
