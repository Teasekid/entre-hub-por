
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrainerLoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onGoToSetup: () => void;
}

export function TrainerLoginForm({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  isLoading,
  onGoToSetup
}: TrainerLoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        onClick={onGoToSetup}
      >
        First time? Set up password
      </Button>
    </form>
  );
}
