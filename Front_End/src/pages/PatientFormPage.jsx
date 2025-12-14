import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, X, Upload, User, Calendar, Phone, Mail, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PatientFormPage = () => {
  // FIX 1: Matched variable name to App.jsx route ("/patients/:patientId/edit")
  const { patientId } = useParams(); 
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // FIX 2: Check for patientId instead of id
  const isEditMode = !!patientId;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    phone: '',
    alternatePhone: '',
    email: '',
    gender: 'Male',
    address: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    avatarUrl: '' // Added for preview
  });
  
  const [avatarFile, setAvatarFile] = useState(null);

  // Fetch data if in Edit Mode
  useEffect(() => {
    if (isEditMode) {
      const fetchPatient = async () => {
        try {
          // FIX 3: Use patientId in API call
          const response = await axios.get(`${API_BASE_URL}/patients/${patientId}`);
          const p = response.data;
          setFormData({
            name: p.name || '',
            dob: p.dob || '',
            phone: p.phone || '',
            alternatePhone: p.alternatePhone || '',
            email: p.email || '',
            gender: p.gender || 'Male',
            address: p.address || '',
            medicalHistory: p.medicalHistory || '',
            allergies: p.allergies || '',
            currentMedications: p.currentMedications || '',
            avatarUrl: p.avatarUrl || ''
          });
        } catch (error) {
          console.error("Failed to fetch patient", error);
          toast({ title: "Error", description: "Could not load patient details.", variant: "destructive" });
        } finally {
          setIsFetching(false);
        }
      };
      fetchPatient();
    } else {
        setIsFetching(false);
    }
  }, [patientId, isEditMode, toast]); // FIX 4: Updated dependencies

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        // Only append if it's not the avatarUrl string (we send the file instead)
        if (key !== 'avatarUrl') {
            dataToSend.append(key, formData[key]);
        }
      });
      
      if (avatarFile) {
        dataToSend.append('avatar', avatarFile);
      }

      // FIX 5: Use patientId for PUT request
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/patients/${patientId}`, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast({ title: "Success", description: "Patient updated successfully!" });
      } else {
        await axios.post(`${API_BASE_URL}/patients`, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast({ title: "Success", description: "New patient added successfully!" });
      }

      navigate('/patients');

    } catch (error) {
      console.error("Save error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to save patient. Please check the backend connection.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'P';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0]?.[0]?.toUpperCase() || 'P';
  };

  if (isFetching) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditMode ? 'Edit Patient' : 'Register New Patient'}
        </h1>
        <Button variant="ghost" onClick={() => navigate('/patients')}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Basic Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Profile Picture</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32 border-4 border-muted">
                  <AvatarImage src={formData.avatarUrl} className="object-cover" />
                  <AvatarFallback className="text-4xl">{getInitials(formData.name)}</AvatarFallback>
                </Avatar>
                <div className="flex items-center w-full">
                  <Label htmlFor="avatar-upload" className="cursor-pointer w-full">
                    <div className="flex items-center justify-center w-full h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors text-sm font-medium">
                      <Upload className="mr-2 h-4 w-4" /> Upload Photo
                    </div>
                    <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Detailed Form */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic identification details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input name="name" value={formData.name} onChange={handleInputChange} className="pl-9" required placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input name="dob" type="date" value={formData.dob} onChange={handleInputChange} className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={handleSelectChange}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input name="phone" value={formData.phone} onChange={handleInputChange} className="pl-9" required placeholder="+91 98765..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email (Optional)</Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-9" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Alternate Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input name="alternatePhone" value={formData.alternatePhone} onChange={handleInputChange} className="pl-9" placeholder="Optional" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea name="address" value={formData.address} onChange={handleInputChange} className="pl-9 min-h-[80px]" placeholder="Full address..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical Profile</CardTitle>
                <CardDescription>History and current condition.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Medical History</Label>
                  <Textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleInputChange} placeholder="Diabetes, Hypertension, surgeries..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-red-500 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> Allergies</Label>
                    <Input name="allergies" value={formData.allergies} onChange={handleInputChange} placeholder="Penicillin, Peanuts..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Medications</Label>
                    <Input name="currentMedications" value={formData.currentMedications} onChange={handleInputChange} placeholder="Metformin, Aspirin..." />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/patients')}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEditMode ? 'Update Patient' : 'Save Patient'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default PatientFormPage;
