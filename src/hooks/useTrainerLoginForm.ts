
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { extractSetupToken } from "@/utils/extractSetupToken";

// Encapsulates all state and handlers for the TrainerLogin/Setup flow
export function useTrainerLoginForm(onLoginSuccess: (trainer: any) => void) {
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Ensure setup token is updated from the URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromURL = urlParams.get('token');
    if (tokenFromURL) {
      setSetupToken(extractSetupToken(tokenFromURL));
      setMode('setup');
    }
  }, []);

  // When switching mode, autofill/reset appropriate fields
  useEffect(() => {
    if (mode === 'setup') {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromURL = urlParams.get('token');
      if (tokenFromURL) {
        setSetupToken(extractSetupToken(tokenFromURL));
      }
    } else {
      setSetupToken('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [mode]);

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
        .eq('email', email)
        .single();
      if (trainerError || !trainerData) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Trainer account not found.');
      }
      toast({
        title: "Login Successful",
        description: `Welcome back, ${trainerData.name}!`,
      });
      onLoginSuccess(trainerData);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Setup password handler
  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const cleanedToken = extractSetupToken(setupToken);
    if (!cleanedToken || cleanedToken.length !== 64) {
      toast({
        title: "Setup Token Required",
        description: "Please enter or paste a valid setup token (from your email link).",
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
      const { data: trainerAuth, error: authError } = await supabase
        .from('trainer_auth')
        .select(`*, trainers (*)`)
        .eq('setup_token', cleanedToken)
        .gt('token_expires_at', new Date().toISOString())
        .maybeSingle();
      if (authError) throw new Error('Database error occurred while verifying setup token.');
      if (!trainerAuth) throw new Error('Invalid or expired setup token. Please ensure you are copying the token from the setup email, or ask admin for a new one.');
      const trainerData = trainerAuth.trainers;
      if (!trainerData) throw new Error('Trainer data not found. Please contact your administrator.');
      // sign up (even if user exists, show helpful error)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trainerData.email,
        password: password,
        options: { data: { name: trainerData.name } }
      });
      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already registered')) {
          toast({
            title: "User Already Registered",
            description: "A user with this email has already registered. Please try logging in instead.",
            variant: "destructive",
          });
          setMode('login');
          setIsLoading(false);
          return;
        }
        throw signUpError;
      }
      // Mark as password set
      if (authData.user) {
        const { error: updateError } = await supabase
          .from('trainer_auth')
          .update({
            auth_user_id: authData.user.id,
            password_set: true,
            setup_token: null,
            token_expires_at: null
          })
          .eq('id', trainerAuth.id);
        if (updateError) throw updateError;
        toast({
          title: "Password Set Successfully",
          description: "You can now log in with your new password.",
        });
        onLoginSuccess(trainerData);
      }
    } catch (error: any) {
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
    setupToken,
    setSetupToken,
    isLoading,
    handleLogin,
    handleSetupPassword,
  };
}
