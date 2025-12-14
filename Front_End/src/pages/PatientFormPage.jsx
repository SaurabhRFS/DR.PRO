import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Edit3, Save, X, ArrowLeft, HeartPulse, Pill, ShieldAlert, Camera, Upload } from 'lucide-react';
import axios from 'axios'; // Make sure you have 'axios' installed

// UI Components (ensure these paths are correct for your project structure)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// API Base URL from your .env file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PatientFormPage = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { toast } = useToast();

  const isEditing = Boolean(patientId);

  const [formData, setFormData] = React.useState({
    name: '',
    dob: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    gender: '',
    avatarUrl: '', // For displaying the image preview
    avatarFile: null, // For holding the actual file to upload
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
  });

  const [age, setAge] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Effect to fetch patient data from the API when in "edit" mode
  React.useEffect(() => {
    if (isEditing) {
      const fetchPatient = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`${API_BASE_URL}/patients/${patientId}`);
          const patientData = response.data;
          
          setFormData({
            ...patientData,
            // Format date for the HTML date input and reset file input
            dob: patientData.dob ? new Date(patientData.dob).toISOString().split('T')[0] : '',
            avatarFile: null, 
          });
          
          if (patientData.dob) {
            calculateAge(patientData.dob);
          }

        } catch (error) {
          console.error("Failed to fetch patient:", error);
          toast({
            title: "Error",
            description: "Patient not found or could not be loaded from the server.",
            variant: "destructive",
          });
          navigate('/patients');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPatient();
    }
  }, [isEditing, patientId, navigate, toast]);

  const calculateAge = (dobString) => {
    if (!dobString) {
      setAge('');
      return;
    }
    const birthDate = new Date(dobString);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    setAge(calculatedAge >= 0 ? `${calculatedAge} years` : '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'dob') {
      calculateAge(value);
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Set avatarUrl for instant preview and avatarFile for submission
        setFormData(prev => ({ ...prev, avatarUrl: reader.result, avatarFile: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.dob || !formData.phone) {
        toast({ title: "Missing Fields", description: "Full Name, Date of Birth, and Phone Number are required.", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);

    // Use FormData to correctly handle file uploads
    const submissionData = new FormData();
    
    // Append all form fields to the FormData object
    Object.keys(formData).forEach(key => {
        if (key !== 'avatarUrl' && key !== 'avatarFile' && formData[key] !== null) {
            submissionData.append(key, formData[key]);
        }
    });

    // Append the file if it exists
    if (formData.avatarFile) {
        submissionData.append('avatar', formData.avatarFile);
    }

    try {
      let response;
      if (isEditing) {
        // Use PUT for updating. Your backend must support multipart/form-data on PUT routes.
        // A common alternative if it doesn't is to use POST with a method override.
        response = await axios.put(`${API_BASE_URL}/patients/${patientId}`, submissionData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: "Patient Updated", description: `${response.data.name}'s details have been successfully updated.` });
      } else {
        // Use POST for creating a new patient
        response = await axios.post(`${API_BASE_URL}/patients`, submissionData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: "Patient Added", description: `${response.data.name} has been added to the system.` });
      }
      
      // On success, navigate to the detail page of the created/updated patient
      navigate(`/patients/${response.data.id}`);

    } catch (error) {
      console.error("Failed to save patient:", error);
      const errorMessage = error.response?.data?.message || "An unexpected error occurred on the server.";
      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0]?.[0]?.toUpperCase() || '?';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto p-4"
    >
      <div className="flex items-center justify-start mb-6">
        <Button variant="outline" onClick={() => navigate(isEditing ? `/patients/${patientId}` : '/patients')} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="shadow-xl border-t-4 border-primary dark:bg-slate-800/70 dark:border-primary">
        <CardHeader className="bg-gradient-to-br from-primary/10 to-purple-500/5 dark:from-primary/20 dark:to-purple-500/10">
          <div className="flex items-center space-x-3">
            {isEditing ? <Edit3 className="h-8 w-8 text-primary" /> : <UserPlus className="h-8 w-8 text-primary" />}
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
                {isEditing ? 'Edit Patient Details' : 'Register New Patient'}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                {isEditing ? `Updating information for ${formData.name || '...'}` : 'Fill the details below to add a new patient.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <section>
              <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2 dark:text-sky-400 dark:border-slate-600">Personal Information</h3>
              <div className="flex flex-col items-center mb-6 space-y-3">
                <Avatar className="h-24 w-24 border-2 border-primary/30 dark:border-sky-500/50">
                  <AvatarImage src={formData.avatarUrl} alt={formData.name} />
                  <AvatarFallback className="text-3xl bg-muted dark:bg-slate-700 dark:text-slate-300">{getInitials(formData.name)}</AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('avatarUpload').click()} disabled={isLoading}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Image
                  </Button>
                  <Input type="file" id="avatarUpload" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                  <Button type="button" variant="outline" size="sm" disabled>
                    <Camera className="mr-2 h-4 w-4" /> Take Photo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label htmlFor="name" className="dark:text-slate-300">Full Name <span className="text-red-500">*</span></Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., John Doe" required disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="dob" className="dark:text-slate-300">Date of Birth <span className="text-red-500">*</span></Label>
                  <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} required disabled={isLoading} />
                </div>
                {age && (
                  <div className="md:col-span-2">
                    <Label className="dark:text-slate-300">Age</Label>
                    <Input value={age} readOnly disabled className="bg-muted/50 dark:bg-slate-700/50 dark:text-slate-400" />
                  </div>
                )}
                <div>
                  <Label htmlFor="phone" className="dark:text-slate-300">Phone Number <span className="text-red-500">*</span></Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="e.g., (555) 123-4567" required disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="alternatePhone" className="dark:text-slate-300">Alternate Phone</Label>
                  <Input id="alternatePhone" name="alternatePhone" type="tel" value={formData.alternatePhone} onChange={handleChange} placeholder="e.g., (555) 987-6543" disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="email" className="dark:text-slate-300">Email Address</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="e.g., john.doe@example.com" disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="gender" className="dark:text-slate-300">Gender</Label>
                  <Select name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)} disabled={isLoading}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address" className="dark:text-slate-300">Address</Label>
                  <Textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="e.g., 123 Main St, Anytown, USA" disabled={isLoading} />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2 flex items-center dark:text-sky-400 dark:border-slate-600"><HeartPulse className="mr-2 h-5 w-5"/>Medical Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="medicalHistory" className="dark:text-slate-300">Medical History (Optional)</Label>
                  <Textarea id="medicalHistory" name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} placeholder="Relevant past illnesses, surgeries, conditions..." disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="allergies" className="flex items-center dark:text-slate-300"><ShieldAlert className="mr-2 h-4 w-4 text-red-500"/>Allergies (Optional)</Label>
                  <Textarea id="allergies" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="e.g., Penicillin, Latex, Peanuts" disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="currentMedications" className="flex items-center dark:text-slate-300"><Pill className="mr-2 h-4 w-4 text-blue-500"/>Current Medications (Optional)</Label>
                  <Textarea id="currentMedications" name="currentMedications" value={formData.currentMedications} onChange={handleChange} placeholder="List all current medications and dosages" disabled={isLoading} />
                </div>
              </div>
            </section>

            <div className="flex justify-end space-x-3 pt-4 border-t dark:border-slate-700">
              <Button type="button" variant="outline" onClick={() => navigate(isEditing ? `/patients/${patientId}` : '/patients')} disabled={isLoading}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white">
                {isLoading ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> {isEditing ? 'Save Changes' : 'Add Patient'}</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PatientFormPage;