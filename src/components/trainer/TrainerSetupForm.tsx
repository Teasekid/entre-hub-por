
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrainerSetupFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onGoToLogin: () => void;
}

export function TrainerSetupForm({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  isLoading,
  onGoToLogin,
}: TrainerSetupFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="border-amber-200 focus:border-amber-500"
          placeholder="Enter your email address"
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
        {isLoading ? 'Setting Up...' : 'Create Account'}
      </Button>
      <Button 
        type="button" 
        variant="outline"
        className="w-full"
        onClick={onGoToLogin}
      >
        Already have a password? Login
      </Button>
    </form>
  );
}
