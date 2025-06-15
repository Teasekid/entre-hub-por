
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
  const [password, setPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setIsSigningUp(true);

    // 1. Register user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (signUpError) {
      toast({ title: "Signup failed", description: signUpError.message, variant: "destructive" });
      setIsSigningUp(false);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      toast({ title: "Signup error", description: "Account could not be created." });
      setIsSigningUp(false);
      return;
    }

    // 2. Insert into trainers table
    const { error: insertTrainerError } = await supabase.from("trainers").insert({
      user_id: userId,
      name,
      email,
      phone_number: phoneNumber,
    });
    if (insertTrainerError) {
      toast({ title: "Trainer profile creation failed", description: insertTrainerError.message, variant: "destructive" });
      setIsSigningUp(false);
      return;
    }

    // 3. Assign "trainer" role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: "trainer",
    });
    if (roleError) {
      toast({ title: "Role assignment failed", description: roleError.message, variant: "destructive" });
      setIsSigningUp(false);
      return;
    }

    setSuccess(true);
    toast({ title: "Success!", description: "Trainer account created. Please check your email to confirm your account." });
    setIsSigningUp(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
        <Card className="max-w-lg w-full border-amber-200">
          <CardHeader><CardTitle className="text-amber-800">Trainer Signup Successful</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-6 text-amber-700">Registration complete! Check your email and confirm to begin using your trainer account.</p>
            <Button className="w-full bg-amber-700" onClick={() => (window.location.href = "/")}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
      <Card className="max-w-lg w-full border-amber-200">
        <CardHeader><CardTitle className="text-amber-800">Trainer Signup</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input required placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <Input required type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
            <Input required placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
            <Input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
            <Button className="w-full bg-amber-700" type="submit" disabled={isSigningUp}>
              {isSigningUp ? "Signing up..." : "Sign Up"}
            </Button>
            <Button variant="ghost" className="w-full mt-2" type="button" onClick={() => (window.location.href = "/")}>Back to Home</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerSignup;
