
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ApplicationsList from "@/components/ApplicationsList";
import { supabase } from "@/integrations/supabase/client";

type Department = {
  name: string;
  code: string;
};

type Skill = {
  name: string;
  code: string;
};

type Application = {
  id: string;
  student_name: string;
  student_email: string;
  phone_number: string;
  matric_number: string;
  level_of_study: string;
  skill_applied?: string;
  skill_id?: string;
  status: string;
  created_at: string;
  departments: Department;
  skills?: Skill;
};

interface StudentsPageProps {
  onBack: () => void;
}

const StudentsPage = ({ onBack }: StudentsPageProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchApplications() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("student_applications")
        .select(`
          id,
          student_name,
          student_email,
          phone_number,
          matric_number,
          level_of_study,
          skill_applied,
          skill_id,
          status,
          created_at,
          departments (
            name, code
          ),
          skills (
            name, code
          )
        `)
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        console.error("Error fetching applications:", error);
        setApplications([]);
      } else {
        setApplications(
          (data || []).map((x) => ({
            ...x,
            departments: x.departments ?? { name: "", code: "" },
            skills: x.skills ?? undefined,
          }))
        );
      }
      setIsLoading(false);
    }
    fetchApplications();
    return () => {
      mounted = false;
    };
  }, []);

  function handleViewApplication(application: Application) {
    alert(`Viewing application for: ${application.student_name}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      <div className="container mx-auto px-3 py-6">
        <div className="flex items-center mb-6">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            className="mr-4 text-amber-700 hover:text-amber-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-amber-800">
            Student Applications
          </h1>
        </div>
        <ApplicationsList
          applications={applications}
          isLoading={isLoading}
          onViewApplication={handleViewApplication}
        />
      </div>
    </div>
  );
};

export default StudentsPage;
