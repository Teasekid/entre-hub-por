import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface TrainerLoginProps {
  onBack: () => void;
  onLoginSuccess: (trainer: any) => void;
}

const extractSetupToken = (input: string): string => {
  // Handles ‘token=...’ anywhere in the string (e.g. from pasted URLs), or just the token
  if (!input) return "";
  // Try to get token from a URL or param string
  const urlMatch = input.match(/[?&]token=([a-fA-F0-9]{64})/);
  if (urlMatch) return urlMatch[1];
  // If clean hex
  const hexMatch = input.match(/^[a-fA-F0-9]{64}$/);
  if (hexMatch) return hexMatch[0];
  // Try to find token in the string in case user pastes with extra stuff
  const fallback = input.match(/([a-fA-F0-9]{64})/);
  if (fallback) return fallback[1];
  return input.trim();
};

const TrainerLogin = ({ onBack, onLoginSuccess }: TrainerLoginProps) => {
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Ensure setup token is updated from the URL, but only if present and mode is set up
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromURL = urlParams.get('token');
    if (tokenFromURL) {
      const normalized = extractSetupToken(tokenFromURL);
      setSetupToken(normalized);
      setMode('setup');
    }
  }, []);

  // Helper: when switching to setup mode, if token in URL, autofill it
  useEffect(() => {
    if (mode === 'setup') {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromURL = urlParams.get('token');
      if (tokenFromURL) {
        setSetupToken(extractSetupToken(tokenFromURL));
      }
    } else {
      // Reset all trainer setup fields upon switching back to login
      setSetupToken('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is a trainer
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

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Always normalize before using
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
      // Debug: Log what we're looking up
      console.log('Attempting token verification', { cleanedToken });

      // Step 1: Verify the setup token and get trainer info
      const { data: trainerAuth, error: authError } = await supabase
        .from('trainer_auth')
        .select(`
          *,
          trainers (*)
        `)
        .eq('setup_token', cleanedToken)
        .gt('token_expires_at', new Date().toISOString())
        .maybeSingle();

      console.log('Trainer auth lookup result:', { trainerAuth, authError });

      if (authError) {
        throw new Error('Database error occurred while verifying setup token.');
      }

      if (!trainerAuth) {
        throw new Error('Invalid or expired setup token. Please ensure you are copying the token from the setup email, or ask admin for a new one.');
      }

      const trainerData = trainerAuth.trainers;

      if (!trainerData) {
        throw new Error('Trainer data not found. Please contact your administrator.');
      }

      // Step 2: Create auth user if not already set
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trainerData.email,
        password: password,
        options: {
          data: {
            name: trainerData.name,
          },
          // Optionally, set emailRedirectTo for welcome verification links; currently not used here
        }
      });

      if (signUpError) {
        // Handle "User already registered" gracefully
        if (signUpError.message?.toLowerCase().includes('already registered')) {
          toast({
            title: "User Already Registered",
            description: "A user with this email has already registered. Please try logging in instead.",
            variant: "destructive",
          });
          // Switch to login mode to help the user continue
          setMode('login');
          setIsLoading(false);
          return;
        }
        throw signUpError;
      }

      // Step 3: Mark password as set, clear setup token
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

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Password Set Successfully",
          description: "You can now log in with your new password.",
        });

        // Auto-login the user
        onLoginSuccess(trainerData);
      }
    } catch (error: any) {
      console.error('Setup password error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to set up password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="mb-6 text-amber-700 hover:text-amber-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-amber-200">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/ef7a18a8-dc00-4835-8d69-d99332d25737.png" 
                alt="Federal University of Lafia Logo" 
                className="h-16 w-16"
              />
            </div>
            <CardTitle className="text-2xl text-amber-800 text-center">
              {mode === 'setup' ? 'Set Up Password' : 'Trainer Login'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === 'setup' ? (
              <form onSubmit={handleSetupPassword} className="space-y-4">
                <div>
                  <Label htmlFor="setup-token">Setup Token</Label>
                  <Input
                    id="setup-token"
                    type="text"
                    value={setupToken}
                    onChange={e => setSetupToken(e.target.value.trim())}
                    required
                    className="border-amber-200 focus:border-amber-500"
                    placeholder="Paste your setup token here"
                  />
                </div>
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-amber-700 hover:bg-amber-800"
                  disabled={isLoading}
                >
                  {isLoading ? 'Setting Up...' : 'Set Password'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full"
                  onClick={() => setMode('login')}
                >
                  Already have a password? Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-amber-700 hover:bg-amber-800"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full"
                  onClick={() => setMode('setup')}
                >
                  First time? Set up password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainerLogin;
