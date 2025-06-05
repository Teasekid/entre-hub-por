
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';

interface StudentRegistrationProps {
  onBack: () => void;
}

const StudentRegistration = ({ onBack }: StudentRegistrationProps) => {
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    phone_number: '',
    department_id: '',
    matric_number: '',
    level_of_study: '',
    skill_applied: ''
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  // Fetch departments
  const { data: departments } = useQuery({
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

  const submitApplication = useMutation({
    mutationFn: async () => {
      let receiptUrl = null;

      // Upload receipt if provided
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${formData.matric_number}_${Date.now()}.${fileExt}`;
        
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
          ...formData,
          esp_receipt_url: receiptUrl
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted Successfully!",
        description: "Your application has been received and is under review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
      console.error('Error submitting application:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitApplication.mutate();
  };

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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">Application Submitted!</h3>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in our entrepreneurship program. 
              We will review your application and notify you of the outcome.
            </p>
            <Button onClick={onBack} className="bg-green-700 hover:bg-green-800">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-8">
      <div className="container mx-auto px-4">
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
              Entrepreneurship Skills Application Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="student_name">Full Name *</Label>
                  <Input
                    id="student_name"
                    value={formData.student_name}
                    onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                    required
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="student_email">Email Address *</Label>
                  <Input
                    id="student_email"
                    type="email"
                    value={formData.student_email}
                    onChange={(e) => setFormData({...formData, student_email: e.target.value})}
                    required
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    required
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="matric_number">Matriculation Number *</Label>
                  <Input
                    id="matric_number"
                    value={formData.matric_number}
                    onChange={(e) => setFormData({...formData, matric_number: e.target.value})}
                    required
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department_id} onValueChange={(value) => setFormData({...formData, department_id: value})}>
                    <SelectTrigger className="border-green-200 focus:border-green-500">
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
                  <Label htmlFor="level_of_study">Level of Study *</Label>
                  <Select value={formData.level_of_study} onValueChange={(value) => setFormData({...formData, level_of_study: value})}>
                    <SelectTrigger className="border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100L">100 Level</SelectItem>
                      <SelectItem value="200L">200 Level</SelectItem>
                      <SelectItem value="300L">300 Level</SelectItem>
                      <SelectItem value="400L">400 Level</SelectItem>
                      <SelectItem value="500L">500 Level</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="skill_applied">Skill Program *</Label>
                <Select value={formData.skill_applied} onValueChange={(value) => setFormData({...formData, skill_applied: value})}>
                  <SelectTrigger className="border-green-200 focus:border-green-500">
                    <SelectValue placeholder="Select skill program to apply for" />
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
                <div className="mt-2">
                  <Input
                    id="receipt"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="border-green-200 focus:border-green-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload your ESP receipt (PDF, JPG, or PNG format)
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-700 hover:bg-green-800"
                disabled={submitApplication.isPending}
              >
                {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentRegistration;
