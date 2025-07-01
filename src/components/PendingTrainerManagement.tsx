
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, X, UserPlus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PendingTrainerManagement = () => {
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending trainers
  const { data: pendingTrainers, isLoading } = useQuery({
    queryKey: ['pending-trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_trainers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Approve trainer mutation
  const approveTrainerMutation = useMutation({
    mutationFn: async (pendingTrainer: any) => {
      // First, add to trainers table
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .insert({
          name: pendingTrainer.name,
          email: pendingTrainer.email,
          phone_number: pendingTrainer.phone_number,
          user_id: null
        })
        .select()
        .single();

      if (trainerError) throw trainerError;

      // Update pending status
      const { error: updateError } = await supabase
        .from('pending_trainers')
        .update({ status: 'approved' })
        .eq('id', pendingTrainer.id);

      if (updateError) throw updateError;

      return trainerData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-trainers'] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast({
        title: "Trainer Approved",
        description: "Trainer has been approved and added to the system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve trainer",
        variant: "destructive",
      });
    },
  });

  // Reject trainer mutation
  const rejectTrainerMutation = useMutation({
    mutationFn: async (trainerId: string) => {
      const { error } = await supabase
        .from('pending_trainers')
        .update({ status: 'rejected' })
        .eq('id', trainerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-trainers'] });
      toast({
        title: "Trainer Rejected",
        description: "Trainer application has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject trainer",
        variant: "destructive",
      });
    },
  });

  const handleViewTrainer = (trainer: any) => {
    setSelectedTrainer(trainer);
    setIsViewDialogOpen(true);
  };

  return (
    <>
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Pending Trainer Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading pending applications...</div>
          ) : pendingTrainers?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="h-12 w-12 mx-auto mb-4" />
              <p>No pending trainer applications.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTrainers?.map((trainer) => (
                  <TableRow key={trainer.id}>
                    <TableCell className="font-medium">{trainer.name}</TableCell>
                    <TableCell>{trainer.email}</TableCell>
                    <TableCell>{trainer.phone_number || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(trainer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          trainer.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : trainer.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {trainer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {trainer.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTrainer(trainer)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveTrainerMutation.mutate(trainer)}
                            disabled={approveTrainerMutation.isPending}
                            title="Approve trainer"
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectTrainerMutation.mutate(trainer.id)}
                            disabled={rejectTrainerMutation.isPending}
                            title="Reject trainer"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Trainer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trainer Application Details</DialogTitle>
          </DialogHeader>
          {selectedTrainer && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Name:</label>
                <p>{selectedTrainer.name}</p>
              </div>
              <div>
                <label className="font-semibold">Email:</label>
                <p>{selectedTrainer.email}</p>
              </div>
              <div>
                <label className="font-semibold">Phone:</label>
                <p>{selectedTrainer.phone_number || 'Not provided'}</p>
              </div>
              <div>
                <label className="font-semibold">Applied on:</label>
                <p>{new Date(selectedTrainer.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="font-semibold">Status:</label>
                <Badge className="ml-2">
                  {selectedTrainer.status}
                </Badge>
              </div>
              {selectedTrainer.status === 'pending' && (
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => {
                      approveTrainerMutation.mutate(selectedTrainer);
                      setIsViewDialogOpen(false);
                    }}
                    disabled={approveTrainerMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      rejectTrainerMutation.mutate(selectedTrainer.id);
                      setIsViewDialogOpen(false);
                    }}
                    disabled={rejectTrainerMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingTrainerManagement;
