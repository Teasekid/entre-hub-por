
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Application {
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
  departments: {
    name: string;
    code: string;
  };
  skills?: {
    name: string;
    code: string;
  };
}

interface ApplicationsListProps {
  applications: Application[];
  isLoading: boolean;
  onViewApplication: (application: Application) => void;
}

const ApplicationsList = ({ applications, isLoading, onViewApplication }: ApplicationsListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSkillName = (application: Application) => {
    if (application.skills?.name) {
      return application.skills.name;
    }
    // Fallback for old applications
    return application.skill_applied?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Unknown Skill';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading applications...</div>;
  }

  if (!applications.length) {
    return <div className="text-center py-8 text-gray-500">No applications found.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Matric Number</TableHead>
            <TableHead>Skill Applied</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell className="font-medium">{application.student_name}</TableCell>
              <TableCell>
                {application.departments.name} ({application.departments.code})
              </TableCell>
              <TableCell>{application.matric_number}</TableCell>
              <TableCell>{formatSkillName(application)}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(application.status)}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(application.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewApplication(application)}
                  className="border-green-700 text-green-700 hover:bg-green-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ApplicationsList;
