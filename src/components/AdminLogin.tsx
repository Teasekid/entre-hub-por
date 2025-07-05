
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface AdminLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const AdminLogin = ({ onBack, onLoginSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Starting admin login process...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Auth error:', error);
        throw error;
      }

      console.log('Auth successful, user ID:', data.user.id);
      console.log('User email:', data.user.email);

      // Check if user is an admin
      console.log('Checking admin privileges...');
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();

      console.log('Admin query result:', { adminData, adminError });

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin query error:', adminError);
        await supabase.auth.signOut();
        throw new Error('Database error while checking admin privileges.');
      }

      if (!adminData) {
        console.log('No admin record found, checking user_roles...');
        
        // Check if user has admin role in user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        console.log('Role query result:', { roleData, roleError });

        if (roleError && roleError.code !== 'PGRST116') {
          console.error('Role query error:', roleError);
          await supabase.auth.signOut();
          throw new Error('Database error while checking user roles.');
        }

        if (!roleData) {
          await supabase.auth.signOut();
          throw new Error('Access denied. Admin privileges required.');
        }

        // User has admin role but no admin record, try to create one
        console.log('User has admin role, attempting to create admin record...');
        
        // Use the service role to create the admin record directly
        const { data: newAdminData, error: createError } = await supabase
          .from('admins')
          .insert({
            user_id: data.user.id,
            name: data.user.email?.split('@')[0] || 'Admin User',
            email: data.user.email || email
          })
          .select()
          .maybeSingle();

        console.log('Admin creation result:', { newAdminData, createError });

        if (createError) {
          console.error('Failed to create admin record:', createError);
          await supabase.auth.signOut();
          throw new Error(`Failed to create admin record: ${createError.message}`);
        }

        if (newAdminData) {
          console.log('Admin record created successfully:', newAdminData);
          toast({
            title: "Login Successful",
            description: `Welcome, ${newAdminData.name}!`,
          });
          onLoginSuccess();
          return;
        }
      }

      console.log('Admin login successful:', adminData);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${adminData.name}!`,
      });
      
      onLoginSuccess();
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
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
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent>
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
