
import React from "react";
import TrainerManagement from "./TrainerManagement";
import SkillManagement from "./SkillManagement";
import ReportsAndAnalytics from "./ReportsAndAnalytics";
import ApplicationsList from "./ApplicationsList";
import AdminRoleManagement from "./AdminRoleManagement";

const AdminDashboard = ({ admin }: { admin: any }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      <div className="container mx-auto px-3 py-6">
        <h1 className="text-3xl font-bold text-amber-800 mb-4">
          Admin Dashboard
        </h1>
        <ApplicationsList />
        <div className="my-8" />
        <TrainerManagement />
        <div className="my-8" />
        <SkillManagement />
        <div className="my-8" />
        <ReportsAndAnalytics />
        {/* New: Role Management */}
        <AdminRoleManagement />
      </div>
    </div>
  );
};

export default AdminDashboard;
