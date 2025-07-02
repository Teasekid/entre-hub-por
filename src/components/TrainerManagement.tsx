
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TrainerManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTrainer, setNewTrainer] = useState({
    name: '',
    email: '',
    phone_number: '',
    skills: [] as string[]
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch trainers
  const { data: trainers, isLoading: trainersLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          trainer_skills (
            skill_id,
            skills (name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch pending trainers
  const { data: pendingTrainers, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending_trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_trainers')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch skills for assignment
  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Add trainer mutation - now adds to pending_trainers table
  const addTrainerMutation = useMutation({
    mutationFn: async () => {
      const trimmedEmail = newTrainer.email.trim().toLowerCase();
      console.log("Adding pending trainer with email:", trimmedEmail);
      
      // Check if trainer email already exists in both tables (case-insensitive)
      const [{ data: existingTrainer }, { data: existingPending }] = await Promise.all([
        supabase.from('trainers').select('email').ilike('email', trimmedEmail).maybeSingle(),
        supabase.from('pending_trainers').select('email').ilike('email', trimmedEmail).maybeSingle()
      ]);

      if (existingTrainer || existingPending) {
        throw new Error('A trainer with this email already exists.');
      }

      // Create pending trainer with normalized email
      const { data: pendingTrainerData, error: pendingError } = await supabase
        .from('pending_trainers')
        .insert({
          name: newTrainer.name,
          email: trimmedEmail, // Store email in lowercase
          phone_number: newTrainer.phone_number,
          status: 'pending'
        })
        .select()
        .single();

      if (pendingError) throw pendingError;

      return pendingTrainerData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_trainers'] });
      setIsAddDialogOpen(false);
      setNewTrainer({ name: '', email: '', phone_number: '', skills: [] });
      toast({
        title: "Success",
        description: "Trainer added to pending list. They can now register using their email.",
      });
    },
    onError: (error: any) => {
      console.error("Pending trainer creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add trainer",
        variant: "destructive",
      });
    },
  });

  // Delete trainer mutation
  const deleteTrainerMutation = useMutation({
    mutationFn: async (trainerId: string) => {
      const { error } = await supabase
        .from('trainers')
        .delete()
        .eq('id', trainerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast({
        title: "Success",
        description: "Trainer deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trainer",
        variant: "destructive",
      });
    },
  });

  // Delete pending trainer mutation
  const deletePendingTrainerMutation = useMutation({
    mutationFn: async (pendingTrainerId: string) => {
      const { error } = await supabase
        .from('pending_trainers')
        .delete()
        .eq('id', pendingTrainerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_trainers'] });
      toast({
        title: "Success",
        description: "Pending trainer removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove pending trainer",
        variant: "destructive",
      });
    },
  });

  const handleSkillToggle = (skillId: string) => {
    setNewTrainer(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(id => id !== skillId)
        : [...prev.skills, skillId]
    }));
  };

  const handleAddTrainer = () => {
    if (!newTrainer.name || !newTrainer.email) {
      toast({
        title: "Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }
    addTrainerMutation.mutate();
  };

  return (
    <div className="space-y-8">
      {/* Pending Trainers Section */}
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">Pending Trainer Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLoading ? (
            <div className="text-center py-8">Loading pending trainers...</div>
          ) : pendingTrainers?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="h-12 w-12 mx-auto mb-4" />
              <p>No pending trainer registrations.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTrainers?.map((pendingTrainer) => (
                  <TableRow key={pendingTrainer.id}>
                    <TableCell className="font-medium">{pendingTrainer.name}</TableCell>
                    <TableCell>{pendingTrainer.email}</TableCell>
                    <TableCell>{pendingTrainer.phone_number || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800">Awaiting Registration</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePendingTrainerMutation.mutate(pendingTrainer.id)}
                        disabled={deletePendingTrainerMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Active Trainers Section */}
      <Card className="border-amber-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-amber-800">Active Trainers</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-700 hover:bg-amber-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trainer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Trainer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newTrainer.name}
                      onChange={(e) => setNewTrainer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter trainer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTrainer.email}
                      onChange={(e) => setNewTrainer(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newTrainer.phone_number}
                      onChange={(e) => setNewTrainer(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddTrainer}
                      disabled={addTrainerMutation.isPending}
                      className="bg-amber-700 hover:bg-amber-800"
                    >
                      {addTrainerMutation.isPending ? 'Adding...' : 'Add Trainer'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {trainersLoading ? (
            <div className="text-center py-8">Loading trainers...</div>
          ) : trainers?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="h-12 w-12 mx-auto mb-4" />
              <p>No active trainers found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned Skills</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers?.map((trainer) => (
                  <TableRow key={trainer.id}>
                    <TableCell className="font-medium">{trainer.name}</TableCell>
                    <TableCell>{trainer.email}</TableCell>
                    <TableCell>{trainer.phone_number || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {trainer.trainer_skills?.map((ts: any) => (
                          <Badge key={ts.skill_id} variant="secondary" className="text-xs">
                            {ts.skills?.name}
                          </Badge>
                        )) || <span className="text-gray-500">No skills assigned</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {trainer.user_id ? (
                        <Badge className="bg-green-100 text-green-800">Registered</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">Pending Registration</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTrainerMutation.mutate(trainer.id)}
                        disabled={deleteTrainerMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerManagement;
