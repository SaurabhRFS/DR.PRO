import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building, Save, ArrowLeft, Upload, Loader2, AlertTriangle, Camera } from 'lucide-react';
import axios from 'axios';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Initial States ---
const initialProfileState = { name: '', email: '', phone: '', avatarUrl: '', clinicName: '' };
const initialClinicState = { name: '', logoUrl: '', openingHours: '', contactInfo: '' };

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { toast } = useToast();

  // --- State ---
  const [doctorProfile, setDoctorProfile] = useState(initialProfileState);
  const [clinicSettings, setClinicSettings] = useState(initialClinicState);
  
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [clinicLogoFile, setClinicLogoFile] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingClinic, setIsSavingClinic] = useState(false);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState(tab || 'profile');

  // --- Camera State ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profileRes, clinicRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/profile`),
          axios.get(`${API_BASE_URL}/clinic-settings`)
        ]);
        setDoctorProfile(profileRes.data || initialProfileState);
        setClinicSettings(clinicRes.data || initialClinicState);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        setError("Could not load settings. Ensure backend is running.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  // --- Input Handlers ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setDoctorProfile(prev => ({ ...prev, [name]: value }));
  };
  
  const handleClinicSettingsChange = (e) => {
    const { name, value } = e.target;
    setClinicSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDoctorProfile(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClinicLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClinicLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setClinicSettings(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera Error:", err);
      toast({ title: "Camera Error", description: "Could not access camera. Check permissions.", variant: "destructive" });
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `profile_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
        setProfileAvatarFile(file);
        setDoctorProfile(prev => ({ ...prev, avatarUrl: URL.createObjectURL(file) }));
        toast({ title: "Photo Captured", description: "Image set as profile picture." });
        stopCamera();
      }, 'image/jpeg');
    }
  };

  // --- Save Handlers ---
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const formData = new FormData();
    Object.keys(doctorProfile).forEach(key => {
        if (key !== 'avatarUrl') formData.append(key, doctorProfile[key]);
    });
    if (profileAvatarFile) {
      formData.append('avatar', profileAvatarFile);
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDoctorProfile(response.data); 
      setProfileAvatarFile(null);
      toast({ title: "Success", description: "Profile updated successfully." });
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast({ title: "Error", description: "Could not save profile.", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveClinicSettings = async () => {
    setIsSavingClinic(true);
    const formData = new FormData();
    Object.keys(clinicSettings).forEach(key => {
        if (key !== 'logoUrl') formData.append(key, clinicSettings[key]);
    });
    if (clinicLogoFile) {
      formData.append('logo', clinicLogoFile);
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/clinic-settings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setClinicSettings(response.data);
      setClinicLogoFile(null);
      if (doctorProfile.clinicName !== response.data.name) {
        setDoctorProfile(prev => ({ ...prev, clinicName: response.data.name }));
      }
      toast({ title: "Success", description: "Clinic settings saved." });
    } catch (err) {
      console.error("Failed to save clinic settings:", err);
      toast({ title: "Error", description: "Could not save clinic settings.", variant: "destructive" });
    } finally {
      setIsSavingClinic(false);
    }
  };
  
  const getInitials = (nameStr) => {
    if (!nameStr) return '?';
    const names = nameStr.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : (names[0]?.[0]?.toUpperCase() || '?');
  };
  
  const isSaving = isSavingProfile || isSavingClinic;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-xl text-muted-foreground">Loading Settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive bg-red-50 dark:bg-red-900/20 rounded-lg">
        <AlertTriangle size={48} className="mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/')} disabled={isSaving}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </div>

      <Card className="shadow-lg border-t-4 border-primary dark:bg-slate-800/80">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Settings & Profile</CardTitle>
          <CardDescription>Manage your account and clinic details.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(v) => !isSaving && setActiveTab(v)} className="w-full">
            <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-muted/50 p-0">
              <TabsTrigger value="profile" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <User className="mr-2 h-4 w-4" /> My Profile
              </TabsTrigger>
              <TabsTrigger value="clinic" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <Building className="mr-2 h-4 w-4" /> Clinic Info
              </TabsTrigger>
            </TabsList>

            {/* --- PROFILE TAB --- */}
            <TabsContent value="profile" className="p-6 space-y-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-700 shadow-md">
                        <AvatarImage src={doctorProfile.avatarUrl} className="object-cover"/>
                        <AvatarFallback className="text-3xl bg-primary/10 text-primary">{getInitials(doctorProfile.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('profileAvatarUpload').click()} disabled={isSaving}>
                            <Upload className="mr-2 h-4 w-4" /> Upload
                        </Button>
                        <Input type="file" id="profileAvatarUpload" accept="image/*" onChange={handleProfileAvatarChange} className="hidden" />
                        
                        {/* CAMERA BUTTON */}
                        <Button type="button" variant="secondary" size="sm" onClick={startCamera} disabled={isSaving}>
                            <Camera className="mr-2 h-4 w-4" /> Camera
                        </Button>
                    </div>
                </div>

                <div className="flex-1 space-y-4 w-full">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input name="name" value={doctorProfile.name} onChange={handleProfileChange} disabled={isSaving} placeholder="Dr. Name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input name="email" type="email" value={doctorProfile.email} onChange={handleProfileChange} disabled={isSaving} />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input name="phone" value={doctorProfile.phone} onChange={handleProfileChange} disabled={isSaving} />
                    </div>
                    <div className="space-y-2">
                        <Label>Clinic Name (Display)</Label>
                        <Input name="clinicName" value={doctorProfile.clinicName} onChange={handleProfileChange} disabled={isSaving} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                 <Button onClick={handleSaveProfile} disabled={isSavingProfile || isLoading} className="min-w-[150px]">
                    {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                 </Button>
              </div>
            </TabsContent>

            {/* --- CLINIC TAB --- */}
            <TabsContent value="clinic" className="p-6 space-y-8">
              <div className="flex flex-col sm:flex-row gap-6">
                 <div className="flex flex-col items-center gap-3">
                    <div className="h-32 w-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/20 overflow-hidden">
                        {clinicSettings.logoUrl ? (
                            <img src={clinicSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Building className="h-12 w-12 text-muted-foreground/50" />
                        )}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('clinicLogoUpload').click()} disabled={isSaving}>
                        <Upload className="mr-2 h-4 w-4" /> Upload Logo
                    </Button>
                    <Input type="file" id="clinicLogoUpload" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
                 </div>

                 <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                        <Label>Clinic Name</Label>
                        <Input name="name" value={clinicSettings.name} onChange={handleClinicSettingsChange} disabled={isSaving} />
                    </div>
                    <div className="space-y-2">
                        <Label>Contact Info</Label>
                        <Input name="contactInfo" value={clinicSettings.contactInfo} onChange={handleClinicSettingsChange} disabled={isSaving} placeholder="Phone, Email, etc." />
                    </div>
                    <div className="space-y-2">
                        <Label>Opening Hours</Label>
                        <Textarea name="openingHours" value={clinicSettings.openingHours} onChange={handleClinicSettingsChange} rows={3} disabled={isSaving} placeholder="Mon-Fri: 9am - 5pm..." />
                    </div>
                 </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveClinicSettings} disabled={isSavingClinic || isLoading} className="min-w-[150px]">
                    {isSavingClinic ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Settings
                  </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* --- CAMERA DIALOG --- */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="sm:max-w-md bg-black border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5"/> Take Photo</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
             <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
             <canvas ref={canvasRef} className="hidden" />
          </div>
          <DialogFooter className="flex justify-between gap-2">
             <Button variant="ghost" onClick={stopCamera} className="text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
             <Button onClick={capturePhoto} className="bg-white text-black hover:bg-slate-200"><Camera className="mr-2 h-4 w-4"/> Capture</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProfileSettingsPage;













// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { User, Building, Save, ArrowLeft, Upload, Loader2, AlertTriangle } from 'lucide-react';
// import axios from 'axios';

// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { useToast } from '@/components/ui/use-toast';

// // --- FINAL POLISH: SAFETY FALLBACK FOR API URL ---
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// const initialProfileState = { name: '', email: '', phone: '', avatarUrl: '', clinicName: '' };
// const initialClinicState = { name: '', logoUrl: '', openingHours: '', contactInfo: '' };

// const ProfileSettingsPage = () => {
//   const navigate = useNavigate();
//   const { tab } = useParams();
//   const { toast } = useToast();

//   const [doctorProfile, setDoctorProfile] = useState(initialProfileState);
//   const [clinicSettings, setClinicSettings] = useState(initialClinicState);
  
//   const [profileAvatarFile, setProfileAvatarFile] = useState(null);
//   const [clinicLogoFile, setClinicLogoFile] = useState(null);

//   const [isLoading, setIsLoading] = useState(true);
//   const [isSavingProfile, setIsSavingProfile] = useState(false);
//   const [isSavingClinic, setIsSavingClinic] = useState(false);
  
//   const [activeTab, setActiveTab] = useState(tab || 'profile');

//   const sanitizeProfile = (data) => ({
//     name: data.name || '',
//     email: data.email || '',
//     phone: data.phone || '',
//     avatarUrl: data.avatarUrl || '',
//     clinicName: data.clinicName || ''
//   });

//   const sanitizeClinic = (data) => ({
//     name: data.name || '',
//     logoUrl: data.logoUrl || '',
//     openingHours: data.openingHours || '',
//     contactInfo: data.contactInfo || ''
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       setIsLoading(true);
//       try {
//         const [profileRes, clinicRes] = await Promise.all([
//           axios.get(`${API_BASE_URL}/profile`),
//           axios.get(`${API_BASE_URL}/clinic-settings`)
//         ]);
//         setDoctorProfile(profileRes.data ? sanitizeProfile(profileRes.data) : initialProfileState);
//         setClinicSettings(clinicRes.data ? sanitizeClinic(clinicRes.data) : initialClinicState);
//       } catch (err) {
//         console.error("Failed to fetch settings:", err);
//         toast({ title: "Notice", description: "Could not load settings. You can create new ones.", variant: "default" });
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchData();
//   }, [toast]); 

//   useEffect(() => {
//     if (tab) setActiveTab(tab);
//   }, [tab]);

//   const handleProfileChange = (e) => {
//     const { name, value } = e.target;
//     setDoctorProfile(prev => ({ ...prev, [name]: value }));
//   };
  
//   const handleClinicSettingsChange = (e) => {
//     const { name, value } = e.target;
//     setClinicSettings(prev => ({ ...prev, [name]: value }));
//   };

//   const handleProfileAvatarChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setProfileAvatarFile(file);
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setDoctorProfile(prev => ({ ...prev, avatarUrl: reader.result }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleClinicLogoChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setClinicLogoFile(file);
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setClinicSettings(prev => ({ ...prev, logoUrl: reader.result }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSaveProfile = async () => {
//     setIsSavingProfile(true);
//     const formData = new FormData();
//     Object.keys(doctorProfile).forEach(key => {
//         if (key !== 'avatarUrl' && doctorProfile[key] !== null) {
//             formData.append(key, doctorProfile[key]);
//         }
//     });
//     if (profileAvatarFile) formData.append('avatar', profileAvatarFile);

//     try {
//       const response = await axios.put(`${API_BASE_URL}/profile`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       setDoctorProfile(sanitizeProfile(response.data)); 
//       setProfileAvatarFile(null); 
//       toast({ title: "Profile Updated", description: "Your personal information has been saved." });
//     } catch (err) {
//       console.error("Failed to save profile:", err);
//       toast({ title: "Error", description: "Could not save profile.", variant: "destructive" });
//     } finally {
//       setIsSavingProfile(false);
//     }
//   };

//   const handleSaveClinicSettings = async () => {
//     setIsSavingClinic(true);
//     const formData = new FormData();
//     Object.keys(clinicSettings).forEach(key => {
//         if (key !== 'logoUrl' && clinicSettings[key] !== null) {
//             formData.append(key, clinicSettings[key]);
//         }
//     });
//     if (clinicLogoFile) formData.append('logo', clinicLogoFile);

//     try {
//       const response = await axios.put(`${API_BASE_URL}/clinic-settings`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       setClinicSettings(sanitizeClinic(response.data));
//       setClinicLogoFile(null);
      
//       if (doctorProfile.clinicName !== response.data.name) {
//         setDoctorProfile(prev => ({ ...prev, clinicName: response.data.name || '' }));
//       }
//       toast({ title: "Clinic Settings Updated", description: "Clinic information has been saved." });
//     } catch (err) {
//       console.error("Failed to save clinic settings:", err);
//       toast({ title: "Error", description: "Could not save clinic settings.", variant: "destructive" });
//     } finally {
//       setIsSavingClinic(false);
//     }
//   };
  
//   const getInitials = (nameStr) => {
//     if (!nameStr) return '?';
//     const names = nameStr.split(' ');
//     return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : (names[0]?.[0]?.toUpperCase() || '?');
//   };
  
//   const isSaving = isSavingProfile || isSavingClinic;

//   if (isLoading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-primary h-12 w-12"/></div>;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="max-w-3xl mx-auto"
//     >
//       <div className="flex items-center justify-start mb-6">
//         <Button variant="outline" onClick={() => navigate('/')} disabled={isSaving} className="dark:text-slate-300 dark:border-slate-600">
//           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
//         </Button>
//       </div>

//       <Card className="shadow-xl border-t-4 border-primary dark:bg-slate-800/70 dark:border-primary">
//         <CardHeader>
//           <CardTitle className="text-2xl sm:text-3xl font-bold dark:text-slate-100">Profile & Settings</CardTitle>
//           <CardDescription className="dark:text-slate-400">Manage your personal and clinic information.</CardDescription>
//         </CardHeader>
//         <CardContent className="p-0">
//           <Tabs value={activeTab} onValueChange={(v) => !isSaving && setActiveTab(v)} className="w-full">
//             <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-muted/30 dark:bg-slate-900/60 dark:border-slate-700">
//               <TabsTrigger value="profile" className="dark:data-[state=active]:bg-slate-800 dark:text-slate-300"><User className="mr-2 h-4 w-4" />My Profile</TabsTrigger>
//               <TabsTrigger value="clinic" className="dark:data-[state=active]:bg-slate-800 dark:text-slate-300"><Building className="mr-2 h-4 w-4" />Clinic Settings</TabsTrigger>
//             </TabsList>

//             <TabsContent value="profile" className="p-6 space-y-6">
//               <div className="flex flex-col items-center space-y-3">
//                 <Avatar className="h-24 w-24 border-2 border-primary/30"><AvatarImage src={doctorProfile.avatarUrl} /><AvatarFallback>{getInitials(doctorProfile.name)}</AvatarFallback></Avatar>
//                 <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('profileAvatarUpload').click()} disabled={isSaving}><Upload className="mr-2 h-4 w-4" />Change Photo</Button>
//                 <Input type="file" id="profileAvatarUpload" accept="image/*" onChange={handleProfileAvatarChange} className="hidden" />
//               </div>
//               <div className="space-y-4">
//                 <div><Label className="dark:text-slate-300">Full Name</Label><Input name="name" value={doctorProfile.name} onChange={handleProfileChange} disabled={isSaving} className="dark:bg-slate-700 dark:text-slate-100" /></div>
//                 <div><Label className="dark:text-slate-300">Email Address</Label><Input name="email" type="email" value={doctorProfile.email} onChange={handleProfileChange} disabled={isSaving} className="dark:bg-slate-700 dark:text-slate-100" /></div>
//                 <div><Label className="dark:text-slate-300">Contact Number</Label><Input name="phone" type="tel" value={doctorProfile.phone} onChange={handleProfileChange} disabled={isSaving} className="dark:bg-slate-700 dark:text-slate-100" /></div>
//                 <div><Label className="dark:text-slate-300">Clinic Name (Display)</Label><Input name="clinicName" value={doctorProfile.clinicName} onChange={handleProfileChange} disabled={isSaving} className="dark:bg-slate-700 dark:text-slate-100" /></div>
//               </div>
//               <Button onClick={handleSaveProfile} disabled={isSavingProfile || isLoading} className="w-full sm:w-auto">
//                 {isSavingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Profile</>}
//               </Button>
//             </TabsContent>

//             <TabsContent value="clinic" className="p-6 space-y-6">
//                 <div className="flex flex-col items-center space-y-3">
//                 <Avatar className="h-24 w-24 border-2 border-primary/30 rounded-md"><AvatarImage src={clinicSettings.logoUrl} className="object-contain" /><AvatarFallback className="rounded-md">{getInitials(clinicSettings.name)}</AvatarFallback></Avatar>
//                 <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('clinicLogoUpload').click()} disabled={isSaving}><Upload className="mr-2 h-4 w-4" />Change Logo</Button>
//                 <Input type="file" id="clinicLogoUpload" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
//               </div>
//               <div className="space-y-4">
//                 <div><Label className="dark:text-slate-300">Clinic Name</Label><Input name="name" value={clinicSettings.name} onChange={handleClinicSettingsChange} disabled={isSaving} className="dark:bg-slate-700 dark:text-slate-100" /></div>
//                 <div><Label className="dark:text-slate-300">Opening Hours</Label><Textarea name="openingHours" value={clinicSettings.openingHours} onChange={handleClinicSettingsChange} rows={3} disabled={isSaving} className="dark:bg-slate-700 dark:text-slate-100" /></div>
//                 <div><Label className="dark:text-slate-300">Clinic Contact Info</Label><Input name="contactInfo" value={clinicSettings.contactInfo} onChange={handleClinicSettingsChange} disabled={isSaving} className="dark:bg-slate-700 dark:text-slate-100" /></div>
//               </div>
//               <Button onClick={handleSaveClinicSettings} disabled={isSavingClinic || isLoading} className="w-full sm:w-auto">
//                 {isSavingClinic ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Clinic Settings</>}
//               </Button>
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>
//     </motion.div>
//   );
// };

// export default ProfileSettingsPage;