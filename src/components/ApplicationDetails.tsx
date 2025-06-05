
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface Application {
  id: string;
  student_name: string;
  student_email: string;
  phone_number: string;
  matric_number: string;
  level_of_study: string;
  skill_applied: string;
  status: 'pending' | 'accepted' | 'rejected';
  esp_receipt_url?: string;
  admin_notes?: string;
  created_at: string;
  departments: {
    name: string;
    code: string;
  };
}

interface ApplicationDetailsProps {
  application: Application;
  onBack: () => void;
  onUpdate: () => void;
}

const ApplicationDetails = ({ application, onBack, onUpdate }: ApplicationDetailsProps) => {
  const [adminNotes, setAdminNotes] = useState(application.admin_notes || '');
  const { toast } = useToast();

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: 'pending' | 'accepted' | 'rejected'; notes: string }) => {
      const { error } = await supabase
        .from('student_applications')
        .update({
          status: status,
          admin_notes: notes,
        })
        .eq('id', application.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Application Updated",
        description: "The application status has been updated successfully.",
      });
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update application",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (status: 'pending' | 'accepted' | 'rejected') => {
    updateApplicationMutation.mutate({ status, notes: adminNotes });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSkillName = (skill: string) => {
    return skill.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const downloadReceipt = async () => {
    if (!application.esp_receipt_url) return;

    try {
      const { data, error } = await supabase.storage
        .from('esp-receipts')
        .download(application.esp_receipt_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${application.matric_number}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download receipt",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="mb-6 text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="max-w-4xl">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-green-800">
                  Application Details
                </CardTitle>
                <p className="text-green-600 mt-2">
                  {application.student_name} - {application.matric_number}
                </p>
              </div>
              <Badge className={getStatusColor(application.status)}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Student Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {application.student_name}</p>
                    <p><strong>Email:</strong> {application.student_email}</p>
                    <p><strong>Phone:</strong> {application.phone_number}</p>
                    <p><strong>Department:</strong> {application.departments.name} ({application.departments.code})</p>
                    <p><strong>Matric Number:</strong> {application.matric_number}</p>
                    <p><strong>Level:</strong> {application.level_of_study}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Application Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Skill Applied:</strong> {formatSkillName(application.skill_applied)}</p>
                    <p><strong>Application Date:</strong> {new Date(application.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">ESP Receipt</h3>
                  {application.esp_receipt_url ? (
                    <Button 
                      onClick={downloadReceipt}
                      variant="outline"
                      className="border-green-700 text-green-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  ) : (
                    <p className="text-gray-500 text-sm">No receipt uploaded</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Admin Notes</h3>
                  <Textarea
                    placeholder="Add notes about this application..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="border-green-200 focus:border-green-500"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-green-800 mb-4">Update Application Status</h3>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleStatusUpdate('accepted')}
                  disabled={updateApplicationMutation.isPending}
                  className="bg-green-700 hover:bg-green-800"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updateApplicationMutation.isPending}
                  variant="destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('pending')}
                  disabled={updateApplicationMutation.isPending}
                  variant="outline"
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                >
                  Mark as Pending
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationDetails;
