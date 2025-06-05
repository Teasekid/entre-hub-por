
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, X, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface ApplicationDetailsProps {
  application: any;
  onBack: () => void;
  onUpdate: () => void;
}

const ApplicationDetails = ({ application, onBack, onUpdate }: ApplicationDetailsProps) => {
  const [adminNotes, setAdminNotes] = useState(application.admin_notes || '');
  const { toast } = useToast();

  const updateApplication = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const { error } = await supabase
        .from('student_applications')
        .update({
          status,
          admin_notes: notes !== undefined ? notes : adminNotes,
        })
        .eq('id', application.id);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Application Updated",
        description: `Application has been ${status}.`,
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive",
      });
      console.error('Error updating application:', error);
    },
  });

  const downloadReceipt = async () => {
    if (!application.esp_receipt_url) {
      toast({
        title: "No Receipt",
        description: "No ESP receipt uploaded for this application.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('esp-receipts')
        .download(application.esp_receipt_url);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${application.matric_number}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: "ESP receipt downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download ESP receipt.",
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

  const formatSkillName = (skill: string) => {
    return skill.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-8">
      <div className="container mx-auto px-4">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="mb-6 text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Application Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-green-800">
                      {application.student_name}
                    </CardTitle>
                    <p className="text-gray-600">{application.student_email}</p>
                  </div>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Phone Number</Label>
                    <p>{application.phone_number}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Matric Number</Label>
                    <p>{application.matric_number}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Department</Label>
                    <p>{application.departments.name} ({application.departments.code})</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Level of Study</Label>
                    <p>{application.level_of_study}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Skill Applied For</Label>
                    <p>{formatSkillName(application.skill_applied)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Application Date</Label>
                    <p>{new Date(application.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {application.esp_receipt_url && (
                  <div>
                    <Label className="font-semibold">ESP Receipt</Label>
                    <div className="mt-2">
                      <Button
                        onClick={downloadReceipt}
                        variant="outline"
                        className="border-green-700 text-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admin_notes">Admin Notes</Label>
                  <Textarea
                    id="admin_notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                    className="mt-2 border-green-200 focus:border-green-500"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => updateApplication.mutate({ status: 'accepted' })}
                    className="w-full bg-green-700 hover:bg-green-800"
                    disabled={updateApplication.isPending || application.status === 'accepted'}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept Application
                  </Button>

                  <Button
                    onClick={() => updateApplication.mutate({ status: 'rejected' })}
                    variant="destructive"
                    className="w-full"
                    disabled={updateApplication.isPending || application.status === 'rejected'}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>

                  <Button
                    onClick={() => updateApplication.mutate({ status: application.status, notes: adminNotes })}
                    variant="outline"
                    className="w-full border-green-700 text-green-700"
                    disabled={updateApplication.isPending}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Save Notes Only
                  </Button>
                </div>

                {application.admin_notes && application.admin_notes !== adminNotes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <Label className="font-semibold text-sm">Previous Notes:</Label>
                    <p className="text-sm text-gray-600 mt-1">{application.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;
