
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LogOut } from "lucide-react";
import TrainerManagement from "./TrainerManagement";
import SkillManagement from "./SkillManagement";
import ReportsAndAnalytics from "./ReportsAndAnalytics";
import AdminRoleManagement from "./AdminRoleManagement";
import PendingTrainerManagement from "./PendingTrainerManagement";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = ({ admin, onNavigateToStudents }: { admin: any; onNavigateToStudents: () => void }) => {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged Out",
        description: "Successfully logged out of admin dashboard.",
      });
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      <div className="container mx-auto px-3 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/ef7a18a8-dc00-4835-8d69-d99332d25737.png" 
              alt="Federal University of Lafia Logo" 
              className="h-12 w-12 mr-4"
            />
            <div>
              <h1 className="text-3xl font-bold text-amber-800">Admin Dashboard</h1>
              <p className="text-amber-700">Welcome, {admin.name}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-amber-700 text-amber-700">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-amber-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={onNavigateToStudents}>
            <CardHeader>
              <CardTitle className="text-amber-800 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Student Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View and manage student applications</p>
            </CardContent>
          </Card>
        </div>

        <PendingTrainerManagement />
        <div className="my-8" />
        <TrainerManagement />
        <div className="my-8" />
        <SkillManagement />
        <div className="my-8" />
        <ReportsAndAnalytics />
        <AdminRoleManagement />
      </div>
    </div>
  );
};

export default AdminDashboard;
