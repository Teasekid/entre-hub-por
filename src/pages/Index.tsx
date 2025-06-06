
import { useState, useEffect } from 'react';
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

  // Check if user is logged in as admin
  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: adminData, refetch: refetchAdmin } = useQuery({
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

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          refetchSession();
          refetchAdmin();
        } else if (event === 'SIGNED_OUT') {
          refetchSession();
          refetchAdmin();
          setCurrentView('home');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [refetchSession, refetchAdmin]);

  const handleLoginSuccess = () => {
    refetchSession();
    refetchAdmin();
  };

  const handleRegistrationComplete = () => {
    setCurrentView('home');
  };

  // If user is authenticated and is an admin, show dashboard
  if (session && adminData) {
    return <AdminDashboard admin={adminData} />;
  }

  if (currentView === 'register') {
    return <StudentRegistration onBack={() => setCurrentView('home')} onComplete={handleRegistrationComplete} />;
  }

  if (currentView === 'admin') {
    return <AdminLogin onBack={() => setCurrentView('home')} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <img 
              src="/lovable-uploads/ef7a18a8-dc00-4835-8d69-d99332d25737.png" 
              alt="Federal University of Lafia Logo" 
              className="h-24 w-24 mr-6"
            />
            <div>
              <h1 className="text-4xl font-bold text-amber-800 mb-2">
                Federal University of Lafia
              </h1>
              <h2 className="text-2xl font-semibold text-amber-700">
                Entrepreneurship Department
              </h2>
            </div>
          </div>
          <div className="bg-amber-700 text-white py-2 px-6 rounded-lg inline-block mb-4">
            <p className="text-lg font-semibold">Integrity, Innovation, Excellence</p>
          </div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Join our entrepreneurship skills development program and unlock your potential 
            in various business areas. Apply now to enhance your entrepreneurial journey.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow border-amber-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-amber-700" />
              </div>
              <CardTitle className="text-amber-800">Student Registration</CardTitle>
              <CardDescription>
                Apply for entrepreneurship skills training programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setCurrentView('register')}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white"
                size="lg"
              >
                Apply Now
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-amber-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Award className="h-12 w-12 text-amber-700" />
              </div>
              <CardTitle className="text-amber-800">Admin Dashboard</CardTitle>
              <CardDescription>
                Manage applications and student records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setCurrentView('admin')}
                variant="outline"
                className="w-full border-amber-700 text-amber-700 hover:bg-amber-50"
                size="lg"
              >
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
