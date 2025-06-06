
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Mail, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import ReceiptViewer from './ReceiptViewer';

interface ApplicationDetailsProps {
  application: any;
  onBack: () => void;
  onUpdate: () => void;
}

const ApplicationDetails = ({ application, onBack, onUpdate }: ApplicationDetailsProps) => {
  const [status, setStatus] = useState(application.status);
  const [adminNotes, setAdminNotes] = useState(application.admin_notes || '');
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const { toast } = useToast();

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ newStatus, notes }: { newStatus: string; notes: string }) => {
      const { error } = await supabase
        .from('student_applications')
        .update({ 
          status: newStatus, 
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      if (error) throw error;

      // Send email notification if status changed
      if (newStatus !== application.status && (newStatus === 'accepted' || newStatus === 'rejected')) {
        const { error: emailError } = await supabase.functions.invoke('send-application-email', {
          body: {
            student_name: application.student_name,
            student_email: application.student_email,
            skill_applied: application.skills?.name || application.skill_applied,
            status: newStatus
          }
        });

        if (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't throw error here as the main update succeeded
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Application Updated",
        description: "Application status and notes have been updated successfully. Email notification sent to student.",
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

  const handleUpdate = () => {
    updateApplicationMutation.mutate({ newStatus: status, notes: adminNotes });
  };

  const downloadReceipt = async () => {
    if (!application.esp_receipt_url) {
      toast({
        title: "No Receipt",
        description: "No ESP receipt was uploaded for this application.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data } = await supabase.storage
        .from('esp-receipts')
        .download(application.esp_receipt_url);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${application.matric_number}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download receipt",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSkillName = (application: any) => {
    if (application.skills?.name) {
      return application.skills.name;
    }
    // Fallback for old applications
    return application.skill_applied?.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Unknown Skill';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="mb-6 text-amber-700 hover:text-amber-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>

        <Card className="max-w-4xl mx-auto border-amber-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-amber-800">
                  Application Details
                </CardTitle>
                <p className="text-amber-700 mt-2">
                  Submitted on {new Date(application.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge className={getStatusColor(application.status)}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Student Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-amber-800 text-lg">Student Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {application.student_name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {application.student_email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {application.phone_number}
                  </div>
                  <div>
                    <span className="font-medium">Matric Number:</span> {application.matric_number}
                  </div>
                  <div>
                    <span className="font-medium">Department:</span> {application.departments?.name} ({application.departments?.code})
                  </div>
                  <div>
                    <span className="font-medium">Level:</span> {application.level_of_study}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-amber-800 text-lg">Application Details</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Skill Applied:</span> {formatSkillName(application)}
                  </div>
                  <div>
                    <span className="font-medium">ESP Receipt:</span>
                    {application.esp_receipt_url ? (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          onClick={() => setShowReceiptViewer(true)}
                          variant="outline" 
                          size="sm" 
                          className="border-amber-700 text-amber-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          onClick={downloadReceipt}
                          variant="outline" 
                          size="sm" 
                          className="border-amber-700 text-amber-700"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-500 ml-2">Not provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-amber-800 text-lg mb-4">Admin Actions</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Application Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="border-amber-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                    className="border-amber-200 focus:border-amber-500"
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleUpdate}
                  disabled={updateApplicationMutation.isPending}
                  className="bg-amber-700 hover:bg-amber-800"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {updateApplicationMutation.isPending ? 'Updating...' : 'Update & Send Email'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Viewer Modal */}
        {showReceiptViewer && (
          <ReceiptViewer
            receiptUrl={application.esp_receipt_url}
            studentName={application.student_name}
            onClose={() => setShowReceiptViewer(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ApplicationDetails;
