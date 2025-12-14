import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building, Save, ArrowLeft, Upload, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios'; // Make sure you have 'axios' installed

// UI Components (ensure these paths are correct for your project structure)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

// API Base URL from your .env file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Initial empty states for before data is loaded ---
const initialProfileState = { name: '', email: '', phone: '', avatarUrl: '', clinicName: '' };
const initialClinicState = { name: '', logoUrl: '', openingHours: '', contactInfo: '' };

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { toast } = useToast();

  // --- State for data, files, loading, and errors ---
  const [doctorProfile, setDoctorProfile] = useState(initialProfileState);
  const [clinicSettings, setClinicSettings] = useState(initialClinicState);
  
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [clinicLogoFile, setClinicLogoFile] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingClinic, setIsSavingClinic] = useState(false);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState(tab || 'profile');

  // --- Fetch initial data from the API ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Assuming endpoints like /api/profile and /api/clinic-settings
        const [profileRes, clinicRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/profile`),
          axios.get(`${API_BASE_URL}/clinic-settings`)
        ]);
        setDoctorProfile(profileRes.data || initialProfileState);
        setClinicSettings(clinicRes.data || initialClinicState);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        setError("Could not load settings from the server. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // Runs once on component mount

  // This useEffect ensures the active tab updates if the URL param changes
  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  // --- Input handlers ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setDoctorProfile(prev => ({ ...prev, [name]: value }));
  };
  
  const handleClinicSettingsChange = (e) => {
    const { name, value } = e.target;
    setClinicSettings(prev => ({ ...prev, [name]: value }));
  };

  // --- Image handlers now also store the file object for upload ---
  const handleProfileAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileAvatarFile(file); // Store the file for upload
      const reader = new FileReader();
      reader.onloadend = () => {
        // Set preview URL
        setDoctorProfile(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClinicLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClinicLogoFile(file); // Store the file for upload
      const reader = new FileReader();
      reader.onloadend = () => {
        // Set preview URL
        setClinicSettings(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Save handlers to submit data to the API ---
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const formData = new FormData();
    
    // Append all profile fields, excluding the temporary avatarUrl
    Object.keys(doctorProfile).forEach(key => {
        if (key !== 'avatarUrl') formData.append(key, doctorProfile[key]);
    });
    // Append the new avatar file if it exists
    if (profileAvatarFile) {
      formData.append('avatar', profileAvatarFile);
    }

    try {
      // Use PUT (or POST) to update the profile
      const response = await axios.put(`${API_BASE_URL}/profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Update state with response from server, which may include new avatar URL
      setDoctorProfile(response.data); 
      setProfileAvatarFile(null); // Clear the file after successful upload
      toast({ title: "Profile Updated", description: "Your personal information has been saved." });
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast({ title: "Error", description: "Could not save your profile.", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveClinicSettings = async () => {
    setIsSavingClinic(true);
    const formData = new FormData();

    // Append all clinic settings fields, excluding the temporary logoUrl
    Object.keys(clinicSettings).forEach(key => {
        if (key !== 'logoUrl') formData.append(key, clinicSettings[key]);
    });
    // Append the new logo file if it exists
    if (clinicLogoFile) {
      formData.append('logo', clinicLogoFile);
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/clinic-settings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setClinicSettings(response.data);
      setClinicLogoFile(null);
      
      // Update doctor's profile if clinic name changes
      // This is important if doctorProfile.clinicName is meant to always reflect clinicSettings.name
      if (doctorProfile.clinicName !== response.data.name) {
        setDoctorProfile(prev => ({ ...prev, clinicName: response.data.name }));
      }
      toast({ title: "Clinic Settings Updated", description: "Clinic information has been saved." });
    } catch (err) {
      console.error("Failed to save clinic settings:", err);
      toast({ title: "Error", description: "Could not save clinic settings.", variant: "destructive" });
    } finally {
      setIsSavingClinic(false);
    }
  };
  
  // Helper to get initials for avatar fallback
  const getInitials = (nameStr) => {
    if (!nameStr) return '?';
    const names = nameStr.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : (names[0]?.[0]?.toUpperCase() || '?');
  };
  
  // Determine if any saving operation is in progress
  const isSaving = isSavingProfile || isSavingClinic;

  // --- UI for Loading and Error states ---
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
        <h3 className="text-xl font-semibold mb-2">An Error Occurred</h3>
        <p>{error}</p>
      </div>
    );
  }

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
          {/* Tabs component to switch between Profile and Clinic settings */}
          <Tabs value={activeTab} onValueChange={(v) => !isSaving && setActiveTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-muted/30 dark:bg-slate-900/60 dark:border-slate-700">
              <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />My Profile</TabsTrigger>
              <TabsTrigger value="clinic"><Building className="mr-2 h-4 w-4" />Clinic Settings</TabsTrigger>
            </TabsList>

            {/* Content for My Profile tab */}
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

            {/* Content for Clinic Settings tab */}
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