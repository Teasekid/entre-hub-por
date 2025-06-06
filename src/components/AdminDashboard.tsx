
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Download, Eye, Check, X, Users, FileText, UserCheck, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApplicationsList from './ApplicationsList';
import ApplicationDetails from './ApplicationDetails';
import TrainerManagement from './TrainerManagement';
import SkillManagement from './SkillManagement';

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
          departments (name, code),
          skills (name, code)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch skills for dropdown
  const { data: skills } = useQuery({
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

  // Get statistics
  const stats = applications ? {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  } : { total: 0, pending: 0, accepted: 0, rejected: 0 };

  // Filter applications by skill
  const filteredApplications = applications?.filter(app => 
    selectedSkill === 'all' || app.skill_id === selectedSkill
  ) || [];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged Out",
        description: "Successfully logged out of admin dashboard.",
      });
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const downloadCSV = (skillId: string = 'all') => {
    const dataToDownload = skillId === 'all' ? applications : applications?.filter(app => app.skill_id === skillId) || [];
    
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
        app.skills?.name || app.skill_applied || '',
        app.status,
        new Date(app.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const skillName = skillId === 'all' ? 'all' : skills?.find(s => s.id === skillId)?.name || 'unknown';
    a.download = `applications_${skillName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: `Applications exported successfully.`,
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/ef7a18a8-dc00-4835-8d69-d99332d25737.png" 
              alt="Federal University of Lafia Logo" 
              className="h-12 w-12 mr-4"
            />
            <div>
              <h1 className="text-3xl font-bold text-amber-800">Admin Dashboard</h1>
              <p className="text-amber-700">Welcome back, {admin.name}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-amber-700 text-amber-700">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-amber-800">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-amber-700" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200">
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
          
          <Card className="border-amber-200">
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
          
          <Card className="border-amber-200">
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

        {/* Main Content with Tabs */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="trainers">Trainers</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card className="border-amber-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-amber-800">Student Applications</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => downloadCSV('all')}
                      variant="outline"
                      className="border-amber-700 text-amber-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Filter by Skill
                  </label>
                  <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                    <SelectTrigger className="w-64 border-amber-200">
                      <SelectValue placeholder="Select a skill to filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Skills</SelectItem>
                      {skills?.map((skill) => (
                        <SelectItem key={skill.id} value={skill.id}>
                          {skill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSkill !== 'all' && (
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-amber-800">
                      {skills?.find(s => s.id === selectedSkill)?.name} Applications ({filteredApplications.length})
                    </h3>
                    <Button 
                      onClick={() => downloadCSV(selectedSkill)}
                      variant="outline"
                      size="sm"
                      className="border-amber-700 text-amber-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Filtered
                    </Button>
                  </div>
                )}

                <ApplicationsList
                  applications={filteredApplications}
                  isLoading={isLoading}
                  onViewApplication={setSelectedApplication}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainers">
            <TrainerManagement />
          </TabsContent>

          <TabsContent value="skills">
            <SkillManagement />
          </TabsContent>

          <TabsContent value="reports">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-800">Reports & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Reports and analytics features coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
