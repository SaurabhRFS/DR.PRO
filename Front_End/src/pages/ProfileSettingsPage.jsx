import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building, Save, ArrowLeft, Upload, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Initial state with empty strings to prevent React "null value" warnings
const initialProfileState = { name: '', email: '', phone: '', avatarUrl: '', clinicName: '' };
const initialClinicState = { name: '', logoUrl: '', openingHours: '', contactInfo: '' };

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { toast } = useToast();

  const [doctorProfile, setDoctorProfile] = useState(initialProfileState);
  const [clinicSettings, setClinicSettings] = useState(initialClinicState);
  
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [clinicLogoFile, setClinicLogoFile] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingClinic, setIsSavingClinic] = useState(false);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState(tab || 'profile');

  // --- Helper to sanitize data (Turn nulls into empty strings) ---
  const sanitizeProfile = (data) => ({
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    avatarUrl: data.avatarUrl || '',
    clinicName: data.clinicName || ''
  });

  const sanitizeClinic = (data) => ({
    name: data.name || '',
    logoUrl: data.logoUrl || '',
    openingHours: data.openingHours || '',
    contactInfo: data.contactInfo || ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profileRes, clinicRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/profile`),
          axios.get(`${API_BASE_URL}/clinic-settings`)
        ]);
        // Sanitize data before setting state
        setDoctorProfile(profileRes.data ? sanitizeProfile(profileRes.data) : initialProfileState);
        setClinicSettings(clinicRes.data ? sanitizeClinic(clinicRes.data) : initialClinicState);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        // Don't block UI on 500 error, just let user try to save fresh data
        toast({ title: "Notice", description: "Could not load existing settings. You can start fresh.", variant: "default" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]); 

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

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

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const formData = new FormData();
    
    Object.keys(doctorProfile).forEach(key => {
        // Only append if value exists and is not the temporary avatarUrl
        if (key !== 'avatarUrl' && doctorProfile[key] !== null) {
            formData.append(key, doctorProfile[key]);
        }
    });

    if (profileAvatarFile) {
      formData.append('avatar', profileAvatarFile);
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDoctorProfile(sanitizeProfile(response.data)); 
      setProfileAvatarFile(null); 
      toast({ title: "Profile Updated", description: "Your personal information has been saved." });
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast({ title: "Error", description: "Could not save your profile. Check Backend Console.", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveClinicSettings = async () => {
    setIsSavingClinic(true);
    const formData = new FormData();

    Object.keys(clinicSettings).forEach(key => {
        if (key !== 'logoUrl' && clinicSettings[key] !== null) {
            formData.append(key, clinicSettings[key]);
        }
    });

    if (clinicLogoFile) {
      formData.append('logo', clinicLogoFile);
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/clinic-settings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setClinicSettings(sanitizeClinic(response.data));
      setClinicLogoFile(null);
      
      if (doctorProfile.clinicName !== response.data.name) {
        setDoctorProfile(prev => ({ ...prev, clinicName: response.data.name || '' }));
      }
      toast({ title: "Clinic Settings Updated", description: "Clinic information has been saved." });
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

  // NOTE: Removed Error Blocking UI. Even if fetch fails, show the form so user can try to Create new data.
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-start mb-6">
        <Button variant="outline" onClick={() => navigate('/')} disabled={isSaving}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="shadow-xl border-t-4 border-primary dark:bg-slate-800/70 dark:border-primary">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Profile & Settings</CardTitle>
          <CardDescription>Manage your personal and clinic information.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(v) => !isSaving && setActiveTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-muted/30 dark:bg-slate-900/60 dark:border-slate-700">
              <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />My Profile</TabsTrigger>
              <TabsTrigger value="clinic"><Building className="mr-2 h-4 w-4" />Clinic Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="p-6 space-y-6">
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-24 w-24 border-2 border-primary/30"><AvatarImage src={doctorProfile.avatarUrl} /><AvatarFallback>{getInitials(doctorProfile.name)}</AvatarFallback></Avatar>
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('profileAvatarUpload').click()} disabled={isSaving}><Upload className="mr-2 h-4 w-4" />Change Photo</Button>
                <Input type="file" id="profileAvatarUpload" accept="image/*" onChange={handleProfileAvatarChange} className="hidden" />
              </div>
              <div className="space-y-4">
                <div><Label htmlFor="profileName">Full Name</Label><Input id="profileName" name="name" value={doctorProfile.name} onChange={handleProfileChange} disabled={isSaving} /></div>
                <div><Label htmlFor="profileEmail">Email Address</Label><Input id="profileEmail" name="email" type="email" value={doctorProfile.email} onChange={handleProfileChange} disabled={isSaving} /></div>
                <div><Label htmlFor="profilePhone">Contact Number</Label><Input id="profilePhone" name="phone" type="tel" value={doctorProfile.phone} onChange={handleProfileChange} disabled={isSaving} /></div>
                <div><Label htmlFor="profileClinicName">Clinic Name (Display)</Label><Input id="profileClinicName" name="clinicName" value={doctorProfile.clinicName} onChange={handleProfileChange} disabled={isSaving} /></div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSavingProfile || isLoading} className="w-full sm:w-auto">
                {isSavingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Profile</>}
              </Button>
            </TabsContent>

            <TabsContent value="clinic" className="p-6 space-y-6">
                <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-24 w-24 border-2 border-primary/30 rounded-md"><AvatarImage src={clinicSettings.logoUrl} className="object-contain" /><AvatarFallback className="rounded-md">{getInitials(clinicSettings.name)}</AvatarFallback></Avatar>
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('clinicLogoUpload').click()} disabled={isSaving}><Upload className="mr-2 h-4 w-4" />Change Logo</Button>
                <Input type="file" id="clinicLogoUpload" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
              </div>
              <div className="space-y-4">
                <div><Label htmlFor="clinicName">Clinic Name</Label><Input id="clinicName" name="name" value={clinicSettings.name} onChange={handleClinicSettingsChange} disabled={isSaving} /></div>
                <div><Label htmlFor="clinicHours">Opening Hours</Label><Textarea id="clinicHours" name="openingHours" value={clinicSettings.openingHours} onChange={handleClinicSettingsChange} rows={3} disabled={isSaving} /></div>
                <div><Label htmlFor="clinicContact">Clinic Contact Info</Label><Input id="clinicContact" name="contactInfo" value={clinicSettings.contactInfo} onChange={handleClinicSettingsChange} disabled={isSaving} /></div>
              </div>
              <Button onClick={handleSaveClinicSettings} disabled={isSavingClinic || isLoading} className="w-full sm:w-auto">
                {isSavingClinic ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Clinic Settings</>}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileSettingsPage;