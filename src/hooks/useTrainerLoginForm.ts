
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

// Simplified trainer login/setup flow without tokens
export function useTrainerLoginForm(onLoginSuccess: (trainer: any) => void) {
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const trimmedEmail = email.trim().toLowerCase();
    
    try {
      console.log("Attempting login with email:", trimmedEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: trimmedEmail, 
        password 
      });
      
      if (error) throw error;
      
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .select('*')
        .ilike('email', trimmedEmail)
        .single();

      console.log("Trainer lookup result:", { trainerData, trainerError });
      
      if (trainerError || !trainerData) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Trainer account not found.');
      }

      // Update trainer record with user_id if not set
      if (!trainerData.user_id && data.user) {
        const { error: updateError } = await supabase
          .from('trainers')
          .update({ user_id: data.user.id })
          .eq('id', trainerData.id);
        
        if (updateError) {
          console.error('Failed to update trainer user_id:', updateError);
        }
      }
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${trainerData.name}!`,
      });
      onLoginSuccess(trainerData);
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Setup password handler - now checks pending_trainers table
  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();
      console.log("Setting up password for trainer with email:", trimmedEmail);
      
      // First, check if trainer exists in pending_trainers table (exact match and case-insensitive)
      console.log("Querying pending_trainers table for:", trimmedEmail);
      
      const { data: pendingTrainerData, error: pendingTrainerError } = await supabase
        .from('pending_trainers')
        .select('*')
        .eq('status', 'pending');

      console.log("All pending trainers:", pendingTrainerData);
      
      // Find matching trainer manually to debug the issue
      const matchingTrainer = pendingTrainerData?.find(trainer => 
        trainer.email.toLowerCase().trim() === trimmedEmail
      );
      
      console.log("Matching trainer found:", matchingTrainer);

      if (pendingTrainerError) {
        console.error("Pending trainer query error:", pendingTrainerError);
        throw new Error('Database error occurred while verifying trainer.');
      }

      if (!matchingTrainer) {
        console.log("No matching pending trainer found");
        
        // Check if trainer already exists in trainers table
        const { data: existingTrainer } = await supabase
          .from('trainers')
          .select('*')
          .ilike('email', trimmedEmail)
          .maybeSingle();

        console.log("Existing trainer check:", existingTrainer);

        if (existingTrainer) {
          toast({
            title: "Account Already Exists",
            description: "This trainer already has an account. Please try logging in instead.",
            variant: "destructive",
          });
          setMode('login');
          setIsLoading(false);
          return;
        }

        toast({
          title: "Trainer Not Found",
          description: "No pending trainer found with this email. Please contact your administrator.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Sign up user in Supabase Auth using the stored email from database
      console.log("Creating auth user for:", matchingTrainer.email);
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: matchingTrainer.email, // Use the email from the database to ensure consistency
        password: password,
        options: { 
          data: { name: matchingTrainer.name },
          emailRedirectTo: `${window.location.origin}/trainer`
        }
      });

      console.log("Auth signup result:", { authData, signUpError });

      if (signUpError) {
        if (
          signUpError.message?.toLowerCase().includes('already registered') ||
          signUpError.message?.toLowerCase().includes('user already exists')
        ) {
          toast({
            title: "User Already Registered",
            description: "A user with this email has already registered. Please try logging in instead.",
            variant: "destructive",
          });
          setMode('login');
          setIsLoading(false);
          return;
        } else {
          throw signUpError;
        }
      }

      // Move trainer from pending_trainers to trainers table
      if (authData.user) {
        console.log("Creating trainer record for user:", authData.user.id);
        
        const { data: newTrainer, error: createTrainerError } = await supabase
          .from('trainers')
          .insert({
            name: matchingTrainer.name,
            email: matchingTrainer.email,
            phone_number: matchingTrainer.phone_number,
            user_id: authData.user.id
          })
          .select()
          .single();
        
        console.log("Trainer creation result:", { newTrainer, createTrainerError });
        
        if (createTrainerError) {
          console.error("Trainer creation failed:", createTrainerError);
          throw createTrainerError;
        }

        // Update pending trainer status to approved
        const { error: updatePendingError } = await supabase
          .from('pending_trainers')
          .update({ status: 'approved' })
          .eq('id', matchingTrainer.id);

        if (updatePendingError) {
          console.error("Failed to update pending trainer status:", updatePendingError);
          // Don't throw error as the main setup was successful
        }

        toast({
          title: "Account Created Successfully",
          description: "You can now log in with your new password.",
        });
        onLoginSuccess(newTrainer);
      }
    } catch (error: any) {
      console.error("[TrainerLogin][ERROR] Setup password error:", error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to set up password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mode,
    setMode,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    handleLogin,
    handleSetupPassword,
  };
}
