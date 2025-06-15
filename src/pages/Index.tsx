import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Shield } from "lucide-react";
import StudentRegistration from '@/components/StudentRegistration';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import TrainerPage from '@/pages/TrainerPage';
import { supabase } from '@/integrations/supabase/client';
import LogoutButton from "@/components/LogoutButton";

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'student' | 'admin' | 'trainer'>('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check URL parameters for trainer mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'trainer') {
      setCurrentView('trainer');
      setIsLoading(false);
      return;
    }

    // Check if admin is already logged in
    const checkAdminAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (adminData) {
          setIsAdminLoggedIn(true);
          setAdminData(adminData);
          setCurrentView('admin');
        }
      }
      setIsLoading(false);
    };

    checkAdminAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsAdminLoggedIn(false);
          setAdminData(null);
          setCurrentView('home');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAdminLoginSuccess = () => {
    // Refetch admin data after successful login
    const fetchAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (adminData) {
          setAdminData(adminData);
          setIsAdminLoggedIn(true);
          setCurrentView('admin');
        }
      }
    };
    
    fetchAdminData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (currentView === 'trainer') {
    return <TrainerPage />;
  }

  if (currentView === 'admin') {
    if (isAdminLoggedIn && adminData) {
      return <AdminDashboard admin={adminData} />;
    } else {
      return (
        <AdminLogin 
          onBack={() => setCurrentView('home')}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      );
    }
  }

  if (currentView === 'student') {
    return (
      <StudentRegistration 
        onBack={() => setCurrentView('home')} 
        onComplete={() => setCurrentView('home')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 relative">
      <LogoutButton />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/ef7a18a8-dc00-4835-8d69-d99332d25737.png" 
              alt="Federal University of Lafia Logo" 
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-4xl font-bold text-amber-800 mb-4">
            Federal University of Lafia
          </h1>
          <h2 className="text-2xl font-semibold text-amber-700 mb-2">
            Entrepreneurship Skills Program (ESP)
          </h2>
          <p className="text-amber-600 text-lg max-w-2xl mx-auto">
            Empowering students with essential entrepreneurial skills for the future. 
            Register for our comprehensive training programs and unlock your potential.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Student Registration */}
          <Card className="border-amber-200 hover:border-amber-300 transition-colors cursor-pointer"
                onClick={() => setCurrentView('student')}>
            <CardHeader className="text-center">
              <GraduationCap className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <CardTitle className="text-amber-800">Student Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 text-center mb-4">
                Register for entrepreneurship training programs
              </p>
              <Button className="w-full bg-amber-700 hover:bg-amber-800">
                Register Now
              </Button>
            </CardContent>
          </Card>

          {/* Trainer Portal */}
          <Card className="border-amber-200 hover:border-amber-300 transition-colors cursor-pointer"
                onClick={() => setCurrentView('trainer')}>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <CardTitle className="text-amber-800">Trainer Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 text-center mb-4">
                Access your trainer dashboard and manage students
              </p>
              <Button className="w-full bg-amber-700 hover:bg-amber-800">
                Trainer Login
              </Button>
            </CardContent>
          </Card>

          {/* Admin Portal */}
          <Card className="border-amber-200 hover:border-amber-300 transition-colors cursor-pointer"
                onClick={() => setCurrentView('admin')}>
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <CardTitle className="text-amber-800">Admin Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 text-center mb-4">
                Manage applications, trainers, and system settings
              </p>
              <Button className="w-full bg-amber-700 hover:bg-amber-800">
                Admin Login
              </Button>
            </CardContent>
          </Card>

          {/* Trainer Signup */}
          <div className="max-w-4xl mx-auto mt-8">
            <Card className="border-amber-200 hover:border-amber-300 transition-colors cursor-pointer"
                  onClick={() => window.location.href = "/trainer-signup"}>
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <CardTitle className="text-amber-800">Become a Trainer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-700 text-center mb-4">
                  Are you an expert? Sign up to train students in entrepreneurship.
                </p>
                <Button className="w-full bg-amber-700 hover:bg-amber-800">
                  Trainer Signup
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold text-amber-800 mb-8">
            Program Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-amber-100">
              <h4 className="font-semibold text-amber-800 mb-2">Digital Marketing</h4>
              <p className="text-amber-600 text-sm">Learn modern digital marketing strategies and tools</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-amber-100">
              <h4 className="font-semibold text-amber-800 mb-2">Business Planning</h4>
              <p className="text-amber-600 text-sm">Develop comprehensive business plans and strategies</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-amber-100">
              <h4 className="font-semibold text-amber-800 mb-2">Financial Management</h4>
              <p className="text-amber-600 text-sm">Master financial planning and management skills</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-amber-100">
              <h4 className="font-semibold text-amber-800 mb-2">Leadership Skills</h4>
              <p className="text-amber-600 text-slim">Build essential leadership and management capabilities</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-amber-600">
          <p>&copy; 2024 Federal University of Lafia. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
