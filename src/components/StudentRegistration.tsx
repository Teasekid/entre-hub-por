
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
}

const StudentRegistration = ({ onBack }: StudentRegistrationProps) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    phoneNumber: '',
    departmentId: '',
    matricNumber: '',
    levelOfStudy: '',
    skillApplied: '' as 'digital_marketing' | 'business_planning' | 'financial_management' | 'e_commerce' | 'product_development' | 'sales_techniques' | 'leadership_skills' | 'project_management' | '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch departments
  const { data: departments, isLoading: departmentsLoading } = useQuery({
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

  const skillOptions = [
    { value: 'digital_marketing', label: 'Digital Marketing' },
    { value: 'business_planning', label: 'Business Planning' },
    { value: 'financial_management', label: 'Financial Management' },
    { value: 'e_commerce', label: 'E-Commerce' },
    { value: 'product_development', label: 'Product Development' },
    { value: 'sales_techniques', label: 'Sales Techniques' },
    { value: 'leadership_skills', label: 'Leadership Skills' },
    { value: 'project_management', label: 'Project Management' }
  ];

  const levelOptions = [
    '100 Level', '200 Level', '300 Level', '400 Level', '500 Level', 'Postgraduate'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          skill_applied: formData.skillApplied,
          esp_receipt_url: receiptUrl,
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully. You will be notified of the status via email.",
      });

      // Reset form
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="mb-6 text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-green-800 text-center">
              Entrepreneurship Skills Application
            </CardTitle>
            <p className="text-center text-gray-600">
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
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    required
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="studentEmail">Email Address *</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    required
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="matricNumber">Matric Number *</Label>
                  <Input
                    id="matricNumber"
                    value={formData.matricNumber}
                    onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
                    required
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select 
                    value={formData.departmentId} 
                    onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                  >
                    <SelectTrigger className="border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsLoading ? (
                        <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                      ) : (
                        departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">Level of Study *</Label>
                  <Select 
                    value={formData.levelOfStudy} 
                    onValueChange={(value) => setFormData({ ...formData, levelOfStudy: value })}
                  >
                    <SelectTrigger className="border-green-200 focus:border-green-500">
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
                <Select 
                  value={formData.skillApplied} 
                  onValueChange={(value: 'digital_marketing' | 'business_planning' | 'financial_management' | 'e_commerce' | 'product_development' | 'sales_techniques' | 'leadership_skills' | 'project_management') => 
                    setFormData({ ...formData, skillApplied: value })}
                >
                  <SelectTrigger className="border-green-200 focus:border-green-500">
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillOptions.map((skill) => (
                      <SelectItem key={skill.value} value={skill.value}>
                        {skill.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="receipt">ESP Receipt (Optional)</Label>
                <div className="border-2 border-dashed border-green-200 rounded-lg p-6 text-center">
                  <input
                    id="receipt"
                    type="file"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  <Label htmlFor="receipt" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">
                      {receiptFile ? receiptFile.name : "Click to upload ESP receipt"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports: JPG, PNG, PDF (Max: 5MB)
                    </p>
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-700 hover:bg-green-800"
                disabled={isSubmitting}
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
