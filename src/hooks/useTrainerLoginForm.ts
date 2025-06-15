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
      const token = extractSetupToken(tokenFromURL);
      setSetupToken(token);
      setMode('setup');
      console.log(`[TrainerLogin] Token from URL param (mount):`, token);
    }
  }, []);

  // When switching mode, autofill/reset appropriate fields
  useEffect(() => {
    if (mode === 'setup') {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromURL = urlParams.get('token');
      if (tokenFromURL) {
        const token = extractSetupToken(tokenFromURL);
        setSetupToken(token);
        console.log(`[TrainerLogin] Token from URL param (mode switch):`, token);
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

  // Setup password handler - ENHANCED LOGIC: checks token first, then adds to Auth users
  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const cleanedToken = extractSetupToken(setupToken?.trim());
    console.log("[TrainerLogin] Cleaned setup token on submit:", cleanedToken);

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
      // Step 1: Check for token existence in trainer_auth table before anything else
      const { data: trainerAuth, error: authError } = await supabase
        .from('trainer_auth')
        .select('*, trainers (*)')
        .eq('setup_token', cleanedToken)
        .gt('token_expires_at', new Date().toISOString())
        .maybeSingle();

      if (authError) {
        throw new Error('Database error occurred while verifying setup token.');
      }
      if (!trainerAuth) {
        // Detailed diagnostics for devs:
        const { data: allRows } = await supabase.from("trainer_auth").select("*");
        const foundTokenRow = allRows?.find((row: any) => row.setup_token === cleanedToken);
        if (foundTokenRow) {
          console.warn("[TrainerLogin][DEBUG] Found token in auth table but token_expires_at may be expired:", foundTokenRow);
        } else {
          console.warn("[TrainerLogin][DEBUG] Token not present at all in auth table:", cleanedToken);
        }
        toast({
          title: "Invalid or Expired Token",
          description: "This setup token is invalid or has expired. Please request a new one from admin.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Auth row found, get linked trainer
      const trainerData = trainerAuth.trainers;
      if (!trainerData) {
        toast({
          title: "Trainer not found",
          description: "No trainer found for this setup token. Please contact your administrator.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Step 3: Try to sign up user in Supabase Auth (always try; if already exists, catch and handle)
      // Always provide trainer's email (from DB) and the password from user input
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trainerData.email,
        password: password,
        options: { data: { name: trainerData.name } }
      });

      if (signUpError) {
        // User might already exist in Supabase Auth
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

      // Step 4: Mark password as set in trainer_auth (link Supabase Auth user id to trainer_auth entry)
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
      } else {
        // Fallback: this should almost never happen if signUp succeeded
        toast({
          title: "Unexpected Error",
          description: "Sign up succeeded but no user was returned. Please try logging in.",
          variant: "destructive",
        });
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
    setupToken,
    setSetupToken,
    isLoading,
    handleLogin,
    handleSetupPassword,
  };
}
