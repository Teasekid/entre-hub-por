
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, TrendingUp, Users, Award } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ReportsAndAnalytics = () => {
  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      // Get applications by skill
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select(`
          name,
          student_applications (
            id,
            status
          )
        `);

      if (skillsError) throw skillsError;

      // Get applications by status
      const { data: statusData, error: statusError } = await supabase
        .from('student_applications')
        .select('status');

      if (statusError) throw statusError;

      // Get applications by department
      const { data: departmentData, error: deptError } = await supabase
        .from('student_applications')
        .select(`
          departments (name)
        `);

      if (deptError) throw deptError;

      // Process data for charts
      const skillsChart = skillsData?.map(skill => ({
        name: skill.name,
        applications: skill.student_applications?.length || 0,
        accepted: skill.student_applications?.filter(app => app.status === 'accepted').length || 0,
        pending: skill.student_applications?.filter(app => app.status === 'pending').length || 0,
        rejected: skill.student_applications?.filter(app => app.status === 'rejected').length || 0,
      })) || [];

      const statusChart = [
        { name: 'Pending', value: statusData?.filter(app => app.status === 'pending').length || 0, color: '#f59e0b' },
        { name: 'Accepted', value: statusData?.filter(app => app.status === 'accepted').length || 0, color: '#10b981' },
        { name: 'Rejected', value: statusData?.filter(app => app.status === 'rejected').length || 0, color: '#ef4444' },
      ];

      const departmentChart = departmentData?.reduce((acc: any, app: any) => {
        const deptName = app.departments?.name || 'Unknown';
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {});

      const departmentChartData = Object.entries(departmentChart || {}).map(([name, count]) => ({
        name,
        applications: count
      }));

      return {
        skills: skillsChart,
        status: statusChart,
        departments: departmentChartData,
        totalApplications: statusData?.length || 0,
        totalSkills: skillsData?.length || 0
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="border-amber-200">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 mx-auto mb-2"></div>
          <p>Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-amber-800">{analyticsData?.totalApplications}</p>
              </div>
              <FileText className="h-8 w-8 text-amber-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Skills</p>
                <p className="text-2xl font-bold text-amber-800">{analyticsData?.totalSkills}</p>
              </div>
              <Award className="h-8 w-8 text-amber-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Acceptance Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData?.totalApplications ? 
                    Math.round((analyticsData.status.find(s => s.name === 'Accepted')?.value || 0) / analyticsData.totalApplications * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {analyticsData?.status.find(s => s.name === 'Pending')?.value || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Applications by Skill */}
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800">Applications by Skill</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.skills}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#d97706" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Application Status Distribution */}
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800">Application Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData?.status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Applications by Department */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">Applications by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.departments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Skill Performance Details */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">Skill Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.skills.map((skill) => (
              <div key={skill.name} className="border border-amber-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-amber-800">{skill.name}</h3>
                  <Badge variant="outline">{skill.applications} total</Badge>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    {skill.accepted} accepted
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {skill.pending} pending
                  </Badge>
                  <Badge className="bg-red-100 text-red-800">
                    {skill.rejected} rejected
                  </Badge>
                </div>
                {skill.applications > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Acceptance rate: {Math.round((skill.accepted / skill.applications) * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAndAnalytics;
