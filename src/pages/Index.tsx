
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Award } from "lucide-react";
import StudentRegistration from '@/components/StudentRegistration';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [currentView, setCurrentView] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is logged in as admin
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: adminData } = useQuery({
    queryKey: ['admin', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  if (session && adminData) {
    return <AdminDashboard admin={adminData} />;
  }

  if (currentView === 'register') {
    return <StudentRegistration onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'admin') {
    return <AdminLogin onBack={() => setCurrentView('home')} onLoginSuccess={() => setIsAdmin(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <GraduationCap className="h-16 w-16 text-green-700 mr-4" />
            <div>
              <h1 className="text-4xl font-bold text-green-800 mb-2">
                Federal University of Lafia
              </h1>
              <h2 className="text-2xl font-semibold text-green-600">
                Entrepreneurship Department
              </h2>
            </div>
          </div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Join our entrepreneurship skills development program and unlock your potential 
            in various business areas. Apply now to enhance your entrepreneurial journey.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="hover:shadow-lg transition-shadow border-green-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Student Registration</CardTitle>
              <CardDescription>
                Apply for entrepreneurship skills training programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setCurrentView('register')}
                className="w-full bg-green-700 hover:bg-green-800 text-white"
                size="lg"
              >
                Apply Now
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-green-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Award className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Admin Dashboard</CardTitle>
              <CardDescription>
                Manage applications and student records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setCurrentView('admin')}
                variant="outline"
                className="w-full border-green-700 text-green-700 hover:bg-green-50"
                size="lg"
              >
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Available Skills */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-green-800 text-center mb-8">
            Available Skills Training Programs
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Digital Marketing',
              'Business Planning',
              'Financial Management',
              'E-Commerce',
              'Product Development',
              'Sales Techniques',
              'Leadership Skills',
              'Project Management'
            ].map((skill) => (
              <Card key={skill} className="border-green-200">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-green-700">{skill}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
