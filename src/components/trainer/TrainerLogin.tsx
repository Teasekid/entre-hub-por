
// Main orchestrator for the TrainerLogin flow, now with delegated hooks and forms!
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { TrainerLoginForm } from "./TrainerLoginForm";
import { TrainerSetupForm } from "./TrainerSetupForm";
import { useTrainerLoginForm } from "@/hooks/useTrainerLoginForm";

interface TrainerLoginProps {
  onBack: () => void;
  onLoginSuccess: (trainer: any) => void;
}

const LOGO_SRC = "/lovable-uploads/ef7a18a8-dc00-4835-8d69-d99332d25737.png";

function TrainerLogin({ onBack, onLoginSuccess }: TrainerLoginProps) {
  const {
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
  } = useTrainerLoginForm(onLoginSuccess);

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
                src={LOGO_SRC} 
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
              <TrainerSetupForm
                setupToken={setupToken}
                setSetupToken={setSetupToken}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                onSubmit={handleSetupPassword}
                isLoading={isLoading}
                onGoToLogin={() => setMode('login')}
              />
            ) : (
              <TrainerLoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleLogin}
                isLoading={isLoading}
                onGoToSetup={() => setMode('setup')}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TrainerLogin;
