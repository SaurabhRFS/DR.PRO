import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Phone, Hash } from 'lucide-react'; // Added Hash icon
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const PatientPageHeader = ({ patient }) => {
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
      <CardHeader className="bg-gradient-to-br from-primary/10 to-purple-500/5 p-4 sm:p-6 dark:from-primary/20 dark:to-purple-500/10 dark:bg-slate-850 border-b">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white dark:border-slate-700 shadow-lg">
            <AvatarImage src={patient.avatarUrl || `https://avatar.vercel.sh/${patient.name}.png?size=96`} alt={patient.name} />
            <AvatarFallback className="text-2xl sm:text-3xl bg-muted dark:bg-slate-600 dark:text-slate-200">{getInitials(patient.name)}</AvatarFallback>
          </Avatar>
          
          <div className="text-center sm:text-left flex-grow space-y-2">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground dark:text-slate-100 drop-shadow-sm">
              {patient.name}
            </CardTitle>
            
            {/* UPDATED: Displays Phone | Patient ID */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-base sm:text-lg text-muted-foreground font-medium dark:text-slate-300">
               
               {/* Phone Number */}
               <div className="flex items-center gap-1">
                 <Phone className="h-4 w-4" />
                 <span>{patient.phone || 'No phone'}</span>
               </div>

               {/* Separator (Desktop) */}
               <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>

               {/* HACK: Display 'email' field as 'Patient ID' */}
               {patient.email ? (
                <div className="flex items-center gap-1 text-primary font-bold">
                    <Hash className="h-4 w-4" />
                    <span>Patient ID: {patient.email}</span>
                </div>
               ) : (
                <div className="flex items-center gap-1 text-muted-foreground/60 italic">
                    <Hash className="h-4 w-4" />
                    <span>No ID Assigned</span>
                </div>
               )}
            </div>

          </div>

          <div className="flex items-center gap-2 mt-3 sm:mt-0 self-center sm:self-auto">
            <Button 
              onClick={() => navigate(`/patients/${patient.id}/edit`)} 
              size="default" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 shadow-sm"
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </div>
        </div>
      </CardHeader>
    </>
  );
};

export default PatientPageHeader;







// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Pencil } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// const PatientPageHeader = ({ patient }) => {
//   const navigate = useNavigate();
//   if (!patient) return null;

//   const getInitials = (name) => {
//     if (!name) return 'P';
//     const names = name.split(' ');
//     if (names.length > 1) {
//       return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
//     }
//     return names[0]?.[0]?.toUpperCase() || 'P';
//   };

//   return (
//     <>
//       <CardHeader className="bg-gradient-to-br from-primary/10 to-purple-500/5 p-4 sm:p-6 dark:from-primary/20 dark:to-purple-500/10 dark:bg-slate-850 border-b">
//         <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
//           <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white dark:border-slate-700 shadow-lg">
//             <AvatarImage src={patient.avatarUrl || `https://avatar.vercel.sh/${patient.name}.png?size=96`} alt={patient.name} />
//             <AvatarFallback className="text-2xl sm:text-3xl bg-muted dark:bg-slate-600 dark:text-slate-200">{getInitials(patient.name)}</AvatarFallback>
//           </Avatar>
          
//           <div className="text-center sm:text-left flex-grow space-y-1">
//             <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground dark:text-slate-100 drop-shadow-sm">
//               {patient.name}
//             </CardTitle>
            
//             {/* --- RESTORED EMAIL DISPLAY (Removed ID logic) --- */}
//             <CardDescription className="text-base sm:text-lg text-muted-foreground font-medium dark:text-slate-300">
//               {patient.email || 'No email provided'}
//             </CardDescription>
//             {/* ------------------------------------------------ */}

//           </div>

//           <div className="flex items-center gap-2 mt-3 sm:mt-0 self-center sm:self-auto">
//             <Button 
//               onClick={() => navigate(`/patients/${patient.id}/edit`)} 
//               size="default" 
//               className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 shadow-sm"
//             >
//               <Pencil className="mr-2 h-4 w-4" /> Edit Profile
//             </Button>
            
//           </div>
//         </div>
//       </CardHeader>
//     </>
//   );
// };

// export default PatientPageHeader;