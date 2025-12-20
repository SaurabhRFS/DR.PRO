import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// Added 'Fingerprint' for the cool ID icon
import { UserCircle, Phone, MapPin, Calendar, Stethoscope, ShieldAlert, Pill, VenetianMask, Fingerprint } from 'lucide-react';

const DetailItem = ({ icon: Icon, label, value, className = '', isTextArea = false, iconColor = 'text-primary dark:text-sky-400' }) => (
  <motion.div 
    className={`flex items-start space-x-3 py-2 ${className}`}
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Icon className={`h-5 w-5 ${iconColor} mt-1 flex-shrink-0`} />
    <div>
      <p className="text-sm font-medium text-muted-foreground dark:text-slate-400">{label}</p>
      {isTextArea ? (
        <p className="text-md text-foreground whitespace-pre-wrap dark:text-slate-200">{value || 'N/A'}</p>
      ) : (
        <p className="text-md text-foreground dark:text-slate-200">{value || 'N/A'}</p>
      )}
    </div>
  </motion.div>
);

const PatientProfileTab = ({ patient }) => {
  const [age, setAge] = useState('');

  useEffect(() => {
    if (patient && patient.dob) {
      const birthDate = new Date(patient.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge >= 0 ? `${calculatedAge} years` : '');
    } else {
      setAge('');
    }
  }, [patient]);

  if (!patient) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ delay: 0.1, duration: 0.4 }}
      className="p-4 md:p-6 space-y-6"
    >
      <section>
        <h3 className="text-xl font-semibold mb-3 text-primary border-b pb-2 dark:text-sky-400 dark:border-slate-700">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          <DetailItem icon={Calendar} label="Date of Birth" value={patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'} />
          <DetailItem icon={UserCircle} label="Age" value={age || 'N/A'} />
          <DetailItem icon={VenetianMask} label="Gender" value={patient.gender} />
          <DetailItem icon={Phone} label="Phone Number" value={patient.phone} />
          {patient.alternatePhone && <DetailItem icon={Phone} label="Alternate Phone" value={patient.alternatePhone} />}
          
          {/* UPDATED: Email Address replaced with Patient ID + Cool Fingerprint Icon */}
          <DetailItem 
            icon={Fingerprint} 
            label="Patient ID" 
            value={patient.email} 
            className="md:col-span-2"
            iconColor="text-orange-500" 
          />
          
          <DetailItem icon={MapPin} label="Address" value={patient.address} className="md:col-span-2"/>
        </div>
      </section>
      
      <section>
        <h3 className="text-xl font-semibold mb-3 text-primary border-b pb-2 dark:text-sky-400 dark:border-slate-700">Medical Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-x-6 gap-y-1">
          <DetailItem 
            icon={Stethoscope} 
            label="Medical History" 
            value={patient.medicalHistory} 
            className="md:col-span-2"
            isTextArea={true}
          />
          <DetailItem 
            icon={ShieldAlert} 
            label="Allergies" 
            value={patient.allergies} 
            className="md:col-span-2"
            isTextArea={true}
            iconColor="text-red-500"
          />
          <DetailItem 
            icon={Pill} 
            label="Current Medications" 
            value={patient.currentMedications} 
            className="md:col-span-2"
            isTextArea={true}
            iconColor="text-blue-500"
          />
        </div>
      </section>
    </motion.div>
  );
};

export default PatientProfileTab;