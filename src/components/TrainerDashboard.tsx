
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Download, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface TrainerDashboardProps {
  trainer: any;
}

const TrainerDashboard = ({ trainer }: TrainerDashboardProps) => {
  const { toast } = useToast();

  // Fetch trainer's assigned skills and students
  const { data: trainerData, isLoading } = useQuery({
    queryKey: ['trainer-dashboard', trainer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          trainer_skills (
            skill_id,
            skills (
              id,
              name,
              code,
              student_applications (
                *,
                departments (name, code)
              )
            )
          )
        `)
        .eq('id', trainer.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged Out",
        description: "Successfully logged out of trainer dashboard.",
      });
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const downloadStudentList = (skillName: string, students: any[]) => {
    if (!students?.length) {
      toast({
        title: "No Data",
        description: "No students found for this skill.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Name', 'Email', 'Phone', 'Department', 'Matric Number', 
      'Level', 'Status', 'Application Date'
    ];

    const csvContent = [
      headers.join(','),
      ...students.map(student => [
        student.student_name,
        student.student_email,
        student.phone_number,
        student.departments?.name || '',
        student.matric_number,
        student.level_of_study,
        student.status,
        new Date(student.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skillName.replace(/\s+/g, '_')}_students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: `Student list for ${skillName} exported successfully.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
      <div className="text-center">Loading...</div>
    </div>;
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
              <h1 className="text-3xl font-bold text-amber-800">Trainer Dashboard</h1>
              <p className="text-amber-700">Welcome, {trainer.name}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-amber-700 text-amber-700">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Skills and Students */}
        <div className="space-y-6">
          {trainerData?.trainer_skills?.map((ts: any) => {
            const skill = ts.skills;
            const students = skill.student_applications || [];
            const acceptedStudents = students.filter((s: any) => s.status === 'accepted');
            
            return (
              <Card key={skill.id} className="border-amber-200">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-amber-800">{skill.name}</CardTitle>
                      <p className="text-amber-700">
                        {acceptedStudents.length} accepted students, {students.length} total applications
                      </p>
                    </div>
                    <Button 
                      onClick={() => downloadStudentList(skill.name, acceptedStudents)}
                      variant="outline"
                      className="border-amber-700 text-amber-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download List
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No applications for this skill yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {students.map((student: any) => (
                        <div key={student.id} className="border border-amber-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-amber-800">{student.student_name}</h3>
                              <p className="text-sm text-gray-600">{student.student_email}</p>
                              <p className="text-sm text-gray-600">{student.phone_number}</p>
                              <p className="text-sm text-gray-600">
                                {student.departments?.name} - {student.matric_number}
                              </p>
                              <p className="text-sm text-gray-600">{student.level_of_study}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(student.status)}>
                                {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                              </Badge>
                              <p className="text-sm text-gray-500 mt-2">
                                Applied: {new Date(student.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          
          {(!trainerData?.trainer_skills || trainerData.trainer_skills.length === 0) && (
            <Card className="border-amber-200">
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Skills Assigned</h3>
                <p className="text-gray-500">Contact the administrator to get skills assigned to your account.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
