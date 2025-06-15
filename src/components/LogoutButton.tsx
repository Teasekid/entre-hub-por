
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const LogoutButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    // Listen auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate("/");
  };

  if (!isLoggedIn) return null;

  return (
    <div className="absolute right-4 top-4 z-50">
      <Button
        variant="outline"
        className="flex items-center gap-2 text-amber-800 border-amber-300 hover:bg-amber-50"
        onClick={handleLogout}
        aria-label="Logout"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
    </div>
  );
};

export default LogoutButton;
