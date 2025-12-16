
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCircle, Outdent as Tooth } from 'lucide-react';
import PatientProfileTab from '@/components/patient/PatientProfileTab';
import PatientDentalRecordsTab from '@/components/patient/PatientDentalRecordsTab';

const PatientDetailTabs = ({ patient, patientId, dentalRecords, onAddDentalRecord, onEditDentalRecord, onDeleteDentalRecord }) => {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-muted/30 dark:bg-slate-900/60 dark:border-slate-700">
        <TabsTrigger value="profile" className="py-2.5 sm:py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none dark:text-slate-300 dark:data-[state=active]:text-sky-400 dark:data-[state=active]:border-sky-400">
          <UserCircle className="mr-1.5 h-4 w-4" /> Profile
        </TabsTrigger>
        <TabsTrigger value="dentalRecords" className="py-2.5 sm:py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none dark:text-slate-300 dark:data-[state=active]:text-sky-400 dark:data-[state=active]:border-sky-400">
          <Tooth className="mr-1.5 h-4 w-4" /> Dental
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="dark:bg-slate-800/30">
        <PatientProfileTab patient={patient} />
      </TabsContent>

      <TabsContent value="dentalRecords" className="dark:bg-slate-800/30">
        <PatientDentalRecordsTab 
          patientId={patientId}
          dentalRecords={dentalRecords}
          onRecordAdd={onAddDentalRecord}
          onRecordEdit={onEditDentalRecord}
          onRecordDelete={onDeleteDentalRecord}
        />
      </TabsContent>
    </Tabs>
  );
};

export default PatientDetailTabs;










// import React from 'react';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { UserCircle, Outdent as Tooth } from 'lucide-react';
// import PatientProfileTab from '@/components/patient/PatientProfileTab';
// import PatientDentalRecordsTab from '@/components/patient/PatientDentalRecordsTab';

// const PatientDetailTabs = ({ 
//   patient, 
//   patientId, 
//   dentalRecords, 
//   onAddDentalRecord, 
//   onEditDentalRecord, 
//   onDeleteDentalRecord,
//   onStatusChange // <--- ACCEPT THE PROP
// }) => {
//   return (
//     <Tabs defaultValue="profile" className="w-full">
//       <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-muted/30 dark:bg-slate-900/60 dark:border-slate-700">
//         <TabsTrigger value="profile" className="py-2.5 sm:py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none dark:text-slate-300 dark:data-[state=active]:text-sky-400 dark:data-[state=active]:border-sky-400">
//           <UserCircle className="mr-1.5 h-4 w-4" /> Profile
//         </TabsTrigger>
//         <TabsTrigger value="dentalRecords" className="py-2.5 sm:py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none dark:text-slate-300 dark:data-[state=active]:text-sky-400 dark:data-[state=active]:border-sky-400">
//           <Tooth className="mr-1.5 h-4 w-4" /> Dental
//         </TabsTrigger>
//       </TabsList>

//       <TabsContent value="profile" className="dark:bg-slate-800/30">
//         <PatientProfileTab patient={patient} />
//       </TabsContent>

//       <TabsContent value="dentalRecords" className="dark:bg-slate-800/30">
//         <PatientDentalRecordsTab 
//           patientId={patientId}
//           dentalRecords={dentalRecords}
//           onRecordAdd={onAddDentalRecord}
//           onRecordEdit={onEditDentalRecord}
//           onRecordDelete={onDeleteDentalRecord}
//           onStatusChange={onStatusChange} // <--- PASS IT DOWN
//         />
//       </TabsContent>
//     </Tabs>
//   );
// };

// export default PatientDetailTabs;