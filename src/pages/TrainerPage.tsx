
import { useState, useEffect } from 'react';
import TrainerLogin from '@/components/TrainerLogin';
import TrainerDashboard from '@/components/TrainerDashboard';
import { supabase } from '@/integrations/supabase/client';

const TrainerPage = () => {
  const [trainer, setTrainer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if trainer is already logged in
    const checkTrainerAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if this user is a trainer
        const { data: trainerData } = await supabase
          .from('trainers')
          .select('*')
          .eq('email', session.user.email)
          .single();
        
        if (trainerData) {
          setTrainer(trainerData);
        }
      }
      setIsLoading(false);
    };

    checkTrainerAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setTrainer(null);
        } else if (session?.user) {
          const { data: trainerData } = await supabase
            .from('trainers')
            .select('*')
            .eq('email', session.user.email)
            .single();
          
          if (trainerData) {
            setTrainer(trainerData);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleBack = () => {
    window.location.href = '/';
  };

  const handleLoginSuccess = (trainerData: any) => {
    setTrainer(trainerData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (trainer) {
    return <TrainerDashboard trainer={trainer} />;
  }

  return (
    <TrainerLogin 
      onBack={handleBack}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};

export default TrainerPage;
