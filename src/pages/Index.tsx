
import { useState, useEffect } from 'react';
import StudentRegistration from '@/components/StudentRegistration';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import TrainerPage from '@/pages/TrainerPage';
import { supabase } from '@/integrations/supabase/client';
import LogoutButton from "@/components/LogoutButton";
import LandingHeader from "@/components/LandingHeader";
import LandingActionCards from "@/components/LandingActionCards";
import LandingProgramFeatures from "@/components/LandingProgramFeatures";
import LandingFooter from "@/components/LandingFooter";

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
        <LandingHeader />
        <LandingActionCards 
          onStudent={() => setCurrentView('student')}
          onTrainer={() => setCurrentView('trainer')}
          onAdmin={() => setCurrentView('admin')}
        />
        <LandingProgramFeatures />
        <LandingFooter />
      </div>
    </div>
  );
};

export default Index;
