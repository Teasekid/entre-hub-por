
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TrainerSignup = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [trainerFound, setTrainerFound] = useState(false);
  const [trainerData, setTrainerData] = useState<any>(null);

  async function handleEmailVerification(e: React.FormEvent) {
    e.preventDefault();
    setIsVerifying(true);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      console.log("Checking for trainer with email:", trimmedEmail);
      
      // Check if trainer exists in trainers table (case-insensitive)
      const { data: trainer, error } = await supabase
        .from('trainers')
        .select('*')
        .ilike('email', trimmedEmail)
        .maybeSingle();

      console.log("Trainer query result:", { trainer, error });

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      if (trainer) {
        // Check if trainer already has a user account
        if (trainer.user_id) {
          toast({
            title: "Account Already Exists",
            description: "You already have an account. Please login instead.",
            variant: "destructive",
          });
        } else {
          setTrainerFound(true);
          setTrainerData(trainer);
          toast({
            title: "Email Verified",
            description: "Please set up your password to complete registration.",
          });
        }
      } else {
        toast({
          title: "Email Not Found",
          description: "Your email is not in our trainer database. Please contact the admin to be added as a trainer.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Email verification error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify email",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleRegistration(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);

    try {
      // Sign up user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trainerData.email,
        password: password,
        options: { 
          data: { name: trainerData.name },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Update trainer record with user_id
      if (authData.user) {
        const { error: updateError } = await supabase
          .from('trainers')
          .update({ user_id: authData.user.id })
          .eq('id', trainerData.id);
        
        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully. Please check your email for verification.",
        });

        // Redirect to home after successful registration
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
      <Card className="max-w-lg w-full border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">
            {trainerFound ? "Set Up Your Password" : "Trainer Registration"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!trainerFound ? (
            <form onSubmit={handleEmailVerification} className="space-y-4">
              <Input
                required
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Button
                className="w-full bg-amber-700"
                type="submit"
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>
              <Button
                variant="ghost"
                className="w-full mt-2"
                type="button"
                onClick={() => (window.location.href = "/")}
              >
                Back to Home
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-amber-700">Welcome, {trainerData.name}!</p>
                <p className="text-sm text-gray-600">Please create your password to complete registration.</p>
              </div>
              <Input
                required
                type="password"
                placeholder="Create Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Input
                required
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <Button
                className="w-full bg-amber-700"
                type="submit"
                disabled={isRegistering}
              >
                {isRegistering ? "Creating Account..." : "Create Account"}
              </Button>
              <Button
                variant="ghost"
                className="w-full mt-2"
                type="button"
                onClick={() => {
                  setTrainerFound(false);
                  setTrainerData(null);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                Back to Email Verification
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerSignup;
