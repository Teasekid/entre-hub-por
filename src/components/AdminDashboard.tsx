
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Download, Eye, Check, X, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApplicationsList from './ApplicationsList';
import ApplicationDetails from './ApplicationDetails';

interface AdminDashboardProps {
  admin: any;
}

const AdminDashboard = ({ admin }: AdminDashboardProps) => {
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_applications')
        .select(`
          *,
          departments (name, code)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Get statistics
  const stats = applications ? {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  } : { total: 0, pending: 0, accepted: 0, rejected: 0 };

  // Filter applications by skill
  const filteredApplications = applications?.filter(app => 
    selectedSkill === 'all' || app.skill_applied === selectedSkill
  ) || [];

  // Group applications by skill for download
  const applicationsBySkill = applications?.reduce((acc, app) => {
    if (!acc[app.skill_applied]) {
      acc[app.skill_applied] = [];
    }
    acc[app.skill_applied].push(app);
    return acc;
  }, {} as Record<string, any[]>) || {};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged Out",
      description: "Successfully logged out of admin dashboard.",
    });
  };

  const downloadCSV = (skillType: string = 'all') => {
    const dataToDownload = skillType === 'all' ? applications : applicationsBySkill[skillType] || [];
    
    if (!dataToDownload?.length) {
      toast({
        title: "No Data",
        description: "No applications found for download.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Name', 'Email', 'Phone', 'Department', 'Matric Number', 
      'Level', 'Skill Applied', 'Status', 'Application Date'
    ];

    const csvContent = [
      headers.join(','),
      ...dataToDownload.map(app => [
        app.student_name,
        app.student_email,
        app.phone_number,
        app.departments?.name || '',
        app.matric_number,
        app.level_of_study,
        app.skill_applied.replace('_', ' '),
        app.status,
        new Date(app.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_${skillType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: `Applications exported successfully.`,
    });
  };

  const skillOptions = [
    { value: 'all', label: 'All Skills' },
    { value: 'digital_marketing', label: 'Digital Marketing' },
    { value: 'business_planning', label: 'Business Planning' },
    { value: 'financial_management', label: 'Financial Management' },
    { value: 'e_commerce', label: 'E-Commerce' },
    { value: 'product_development', label: 'Product Development' },
    { value: 'sales_techniques', label: 'Sales Techniques' },
    { value: 'leadership_skills', label: 'Leadership Skills' },
    { value: 'project_management', label: 'Project Management' }
  ];

  if (selectedApplication) {
    return (
      <ApplicationDetails
        application={selectedApplication}
        onBack={() => setSelectedApplication(null)}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ['applications'] });
          setSelectedApplication(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Admin Dashboard</h1>
            <p className="text-green-600">Welcome back, {admin.name}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-green-700 text-green-700">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-green-800">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Accepted</p>
                  <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
                </div>
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <X className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-green-800">Student Applications</CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => downloadCSV('all')}
                  variant="outline"
                  className="border-green-700 text-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedSkill} onValueChange={setSelectedSkill} className="w-full">
              <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-6">
                {skillOptions.slice(0, 5).map((option) => (
                  <TabsTrigger key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="mb-4 flex flex-wrap gap-2">
                {skillOptions.slice(5).map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedSkill === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSkill(option.value)}
                    className={selectedSkill === option.value ? "bg-green-700" : "border-green-700 text-green-700"}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {selectedSkill !== 'all' && (
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-green-800">
                    {skillOptions.find(s => s.value === selectedSkill)?.label} Applications
                  </h3>
                  <Button 
                    onClick={() => downloadCSV(selectedSkill)}
                    variant="outline"
                    size="sm"
                    className="border-green-700 text-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}

              <ApplicationsList
                applications={filteredApplications}
                isLoading={isLoading}
                onViewApplication={setSelectedApplication}
              />
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
