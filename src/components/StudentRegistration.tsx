
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface StudentRegistrationProps {
  onBack: () => void;
  onComplete: () => void;
}

const StudentRegistration = ({ onBack, onComplete }: StudentRegistrationProps) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    phoneNumber: '',
    departmentId: '',
    matricNumber: '',
    levelOfStudy: '',
    skillApplied: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch departments
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch skills
  const { data: skills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.skillApplied) {
      toast({
        title: "Error",
        description: "Please select a skill to apply for",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      let receiptUrl = null;

      // Upload receipt if provided
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${formData.matricNumber}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('esp-receipts')
          .upload(fileName, receiptFile);

        if (uploadError) throw uploadError;
        receiptUrl = fileName;
      }

      // Submit application
      const { error } = await supabase
        .from('student_applications')
        .insert({
          student_name: formData.studentName,
          student_email: formData.studentEmail,
          phone_number: formData.phoneNumber,
          department_id: formData.departmentId,
          matric_number: formData.matricNumber,
          level_of_study: formData.levelOfStudy,
          skill_id: formData.skillApplied,
          esp_receipt_url: receiptUrl,
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully and is pending review.",
      });

      // Reset form and go back to home
      setFormData({
        studentName: '',
        studentEmail: '',
        phoneNumber: '',
        departmentId: '',
        matricNumber: '',
        levelOfStudy: '',
        skillApplied: '',
      });
      setReceiptFile(null);
      
      // Call onComplete to go back to home page
      onComplete();

    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const levelOptions = [
    '100 Level',
    '200 Level',
    '300 Level',
    '400 Level',
    '500 Level',
    'Postgraduate'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="mb-6 text-amber-700 hover:text-amber-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="max-w-2xl mx-auto border-amber-200">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/ef7a18a8-dc00-4835-8d69-d99332d25737.png" 
                alt="Federal University of Lafia Logo" 
                className="h-16 w-16"
              />
            </div>
            <CardTitle className="text-2xl text-amber-800 text-center">
              Entrepreneurship Skills Application
            </CardTitle>
            <p className="text-center text-amber-700">
              Federal University of Lafia - Entrepreneurship Department
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentName">Full Name *</Label>
                  <Input
                    id="studentName"
                    value={formData.studentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                    required
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
                <div>
                  <Label htmlFor="studentEmail">Email Address *</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentEmail: e.target.value }))}
                    required
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    required
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
                <div>
                  <Label htmlFor="matricNumber">Matric Number *</Label>
                  <Input
                    id="matricNumber"
                    value={formData.matricNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, matricNumber: e.target.value }))}
                    required
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.departmentId} onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}>
                    <SelectTrigger className="border-amber-200 focus:border-amber-500">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">Level of Study *</Label>
                  <Select value={formData.levelOfStudy} onValueChange={(value) => setFormData(prev => ({ ...prev, levelOfStudy: value }))}>
                    <SelectTrigger className="border-amber-200 focus:border-amber-500">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="skill">Skill to Apply For *</Label>
                <Select value={formData.skillApplied} onValueChange={(value) => setFormData(prev => ({ ...prev, skillApplied: value }))}>
                  <SelectTrigger className="border-amber-200 focus:border-amber-500">
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills?.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="receipt">ESP Receipt (Optional)</Label>
                <div className="mt-2">
                  <Input
                    id="receipt"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="border-amber-200 focus:border-amber-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload your ESP receipt (PDF, JPG, or PNG format)
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-amber-700 hover:bg-amber-800"
                disabled={isSubmitting || isLoadingDepartments || isLoadingSkills}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentRegistration;
