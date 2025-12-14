
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, FileUp, FileImage, FileText as FileIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';

const PatientFilesTab = ({ patientId }) => {
  const [files, setFiles] = useLocalStorage(`patientFiles_${patientId}`, []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState({ name: '', type: '', date: new Date().toISOString().split('T')[0], description: '' });
  const { toast } = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentFile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentFile(prev => ({ ...prev, name: file.name, type: file.type || 'Unknown' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentFile.name) {
      toast({ title: "Missing File Name", description: "Please provide a file name or upload a file.", variant: "destructive" });
      return;
    }
    const newFile = { ...currentFile, id: Date.now().toString() };
    setFiles(prev => [newFile, ...prev]);
    toast({ title: "File Record Added", description: `Record for ${newFile.name} saved.` });
    setIsFormOpen(false);
    setCurrentFile({ name: '', type: '', date: new Date().toISOString().split('T')[0], description: '' });
  };

  const handleDelete = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    toast({ title: "File Record Deleted", description: "File record removed.", variant: "destructive" });
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-5 w-5 text-purple-500" />;
    if (fileType === 'application/pdf') return <FileIcon className="h-5 w-5 text-red-500" />;
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="p-4 md:p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-primary border-b pb-2 flex-grow flex items-center">
          <FileUp className="mr-2 h-5 w-5" /> Patient Files
        </h3>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setCurrentFile({ name: '', type: '', date: new Date().toISOString().split('T')[0], description: '' });
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)} className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-500/90 hover:to-cyan-600/90 text-white">
              <PlusCircle className="mr-2 h-4 w-4" /> Add File Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] glassmorphic">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">Add New File Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="file-upload-input">Upload File (optional simulation)</Label>
                <Input id="file-upload-input" type="file" onChange={handleFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                <p className="text-xs text-muted-foreground mt-1">This simulates file upload. Only file name and type are stored.</p>
              </div>
              <div>
                <Label htmlFor="file-name">File Name (if not uploaded)</Label>
                <Input id="file-name" name="name" placeholder="e.g., X-Ray_Scan_2024.jpg" value={currentFile.name} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="file-date">Date</Label>
                <Input id="file-date" name="date" type="date" value={currentFile.date} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="file-description">Description (optional)</Label>
                <Input id="file-description" name="description" placeholder="e.g., Left molar X-ray" value={currentFile.description} onChange={handleInputChange} />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save File Record</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {files.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No files uploaded or recorded for this patient.</p>
      ) : (
        <div className="space-y-4">
          {files.sort((a,b) => new Date(b.date) - new Date(a.date)).map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow bg-white/50 dark:bg-slate-800/50 border">
                <CardHeader className="flex flex-row justify-between items-start pb-2 pt-3 px-4">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <CardTitle className="text-md sm:text-lg text-primary">{file.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {new Date(file.date).toLocaleDateString()} {file.description ? `- ${file.description}` : ''}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1.5 h-auto" onClick={() => handleDelete(file.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PatientFilesTab;
