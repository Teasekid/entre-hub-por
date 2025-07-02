
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .select('*')
        .ilike('email', email.trim().toLowerCase())
        .single();
      
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

  // Setup password handler - simplified without tokens
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
      console.log("Checking for trainer with email:", trimmedEmail);
      
      // First, check if trainer exists in trainers table (case-insensitive)
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .select('*')
        .ilike('email', trimmedEmail)
        .maybeSingle();

      console.log("Trainer query result:", { trainerData, trainerError });

      if (trainerError) {
        throw new Error('Database error occurred while verifying trainer.');
      }

      if (!trainerData) {
        toast({
          title: "Trainer Not Found",
          description: "No trainer found with this email. Please contact your administrator.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (trainerData.user_id) {
        toast({
          title: "Account Already Exists",
          description: "This trainer already has an account. Please try logging in instead.",
          variant: "destructive",
        });
        setMode('login');
        setIsLoading(false);
        return;
      }

      // Sign up user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trainerData.email,
        password: password,
        options: { 
          data: { name: trainerData.name },
          emailRedirectTo: `${window.location.origin}/trainer`
        }
      });

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

      // Update trainer record with user_id
      if (authData.user) {
        const { error: updateTrainerError } = await supabase
          .from('trainers')
          .update({ user_id: authData.user.id })
          .eq('id', trainerData.id);
        
        if (updateTrainerError) throw updateTrainerError;

        toast({
          title: "Account Created Successfully",
          description: "You can now log in with your new password.",
        });
        onLoginSuccess(trainerData);
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
