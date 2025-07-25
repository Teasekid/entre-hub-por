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
      console.log("Verifying trainer with email:", trimmedEmail);
      
      // Check if trainer exists in pending_trainers table (case-insensitive)
      const { data: pendingTrainer, error } = await supabase
        .from('pending_trainers')
        .select('*')
        .ilike('email', trimmedEmail)
        .eq('status', 'pending')
        .maybeSingle();

      console.log("Pending trainer verification result:", { pendingTrainer, error });

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      if (pendingTrainer) {
        console.log("Pending trainer found, proceeding to password setup");
        setTrainerFound(true);
        setTrainerData(pendingTrainer);
        toast({
          title: "Email Verified",
          description: "Please set up your password to complete registration.",
        });
      } else {
        console.log("No pending trainer found with email:", trimmedEmail);
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

      // Move trainer from pending_trainers to trainers table
      if (authData.user) {
        // Create trainer record in trainers table
        const { data: newTrainer, error: trainerError } = await supabase
          .from('trainers')
          .insert({
            name: trainerData.name,
            email: trainerData.email,
            phone_number: trainerData.phone_number,
            user_id: authData.user.id
          })
          .select()
          .single();

        if (trainerError) {
          throw trainerError;
        }

        // Update pending trainer status to approved (optional, for record keeping)
        const { error: updateError } = await supabase
          .from('pending_trainers')
          .update({ status: 'approved' })
          .eq('id', trainerData.id);

        if (updateError) {
          console.error("Failed to update pending trainer status:", updateError);
          // Don't throw error here as the main registration was successful
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
