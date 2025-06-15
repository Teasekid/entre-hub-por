
import React, { useEffect, useState } from "react";
import TrainerManagement from "./TrainerManagement";
import SkillManagement from "./SkillManagement";
import ReportsAndAnalytics from "./ReportsAndAnalytics";
import ApplicationsList from "./ApplicationsList";
import AdminRoleManagement from "./AdminRoleManagement";
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

const AdminDashboard = ({ admin }: { admin: any }) => {
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
        setApplications([]);
      } else {
        // Assign departments and skills as required (flatten if needed)
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
    // Handle view application: this stub can be extended further
    alert(`Viewing application for: ${application.student_name}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      <div className="container mx-auto px-3 py-6">
        <h1 className="text-3xl font-bold text-amber-800 mb-4">
          Admin Dashboard
        </h1>
        <ApplicationsList
          applications={applications}
          isLoading={isLoading}
          onViewApplication={handleViewApplication}
        />
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
