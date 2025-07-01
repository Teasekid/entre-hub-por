
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TrainerSignup = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setIsSigningUp(true);

    try {
      // Check if trainer already exists in trainers table
      const { data: existingTrainer } = await supabase
        .from('trainers')
        .select('email')
        .eq('email', email)
        .single();

      if (existingTrainer) {
        toast({
          title: "Email already exists",
          description: "A trainer with this email already exists. Please use a different email or contact admin.",
          variant: "destructive",
        });
        setIsSigningUp(false);
        return;
      }

      // Check if already pending
      const { data: pendingTrainer } = await supabase
        .from('pending_trainers')
        .select('email')
        .eq('email', email)
        .single();

      if (pendingTrainer) {
        toast({
          title: "Application already submitted",
          description: "Your trainer application is already pending approval. Please wait for admin review.",
          variant: "destructive",
        });
        setIsSigningUp(false);
        return;
      }

      // Add to pending_trainers table
      const { error: insertError } = await supabase
        .from("pending_trainers")
        .insert({
          name,
          email,
          phone_number: phoneNumber,
          status: 'pending'
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      toast({
        title: "Application Submitted!",
        description: "Your trainer application has been submitted for review. An admin will contact you soon.",
      });
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
        <Card className="max-w-lg w-full border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800">Application Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-amber-700">
              Your trainer application has been submitted successfully! An admin will review your application and contact you with further instructions.
            </p>
            <Button className="w-full bg-amber-700" onClick={() => (window.location.href = "/")}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
      <Card className="max-w-lg w-full border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">Apply to Become a Trainer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              required
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Input
              required
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Input
              required
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
            />
            <Button
              className="w-full bg-amber-700"
              type="submit"
              disabled={isSigningUp}
            >
              {isSigningUp ? "Submitting Application..." : "Submit Application"}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerSignup;
