
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingActionCardsProps {
  onStudent: () => void;
  onTrainer: () => void;
  onAdmin: () => void;
}

const LandingActionCards: React.FC<LandingActionCardsProps> = ({
  onStudent,
  onTrainer,
  onAdmin,
}) => (
  <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
    {/* Student Registration */}
    <Card className="border-amber-200 hover:border-amber-300 transition-colors cursor-pointer"
      onClick={onStudent}>
      <CardHeader className="text-center">
        <GraduationCap className="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <CardTitle className="text-amber-800">Student Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-amber-700 text-center mb-4">
          Register for entrepreneurship training programs
        </p>
        <Button className="w-full bg-amber-700 hover:bg-amber-800">
          Register Now
        </Button>
      </CardContent>
    </Card>
    {/* Trainer Portal */}
    <Card className="border-amber-200 hover:border-amber-300 transition-colors cursor-pointer"
      onClick={onTrainer}>
      <CardHeader className="text-center">
        <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <CardTitle className="text-amber-800">Trainer Portal</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-amber-700 text-center mb-4">
          Access your trainer dashboard and manage students
        </p>
        <Button className="w-full bg-amber-700 hover:bg-amber-800">
          Trainer Login
        </Button>
      </CardContent>
    </Card>
    {/* Admin Portal */}
    <Card className="border-amber-200 hover:border-amber-300 transition-colors cursor-pointer"
      onClick={onAdmin}>
      <CardHeader className="text-center">
        <Shield className="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <CardTitle className="text-amber-800">Admin Portal</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-amber-700 text-center mb-4">
          Manage applications, trainers, and system settings
        </p>
        <Button className="w-full bg-amber-700 hover:bg-amber-800">
          Admin Login
        </Button>
      </CardContent>
    </Card>
    {/* Trainer Signup */}
    <div className="max-w-4xl mx-auto mt-8 md:col-span-3">
      <Card className="border-amber-200 hover:border-amber-300 transition-colors cursor-pointer"
        onClick={() => window.location.href = "/trainer-signup"}>
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <CardTitle className="text-amber-800">Become a Trainer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700 text-center mb-4">
            Are you an expert? Sign up to train students in entrepreneurship.
          </p>
          <Button className="w-full bg-amber-700 hover:bg-amber-800">
            Trainer Signup
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default LandingActionCards;
