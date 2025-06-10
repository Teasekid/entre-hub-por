import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, UserCheck, Key, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TrainerManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [newTrainer, setNewTrainer] = useState({
    name: '',
    email: '',
    phone_number: '',
    skills: [] as string[]
  });
  const [setupToken, setSetupToken] = useState<string>('');
  const [showTokenDialog, setShowTokenDialog] = useState(false);
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
          ),
          trainer_auth (
            password_set,
            setup_token,
            token_expires_at
          )
        `)
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

  // Add trainer mutation
  const addTrainerMutation = useMutation({
    mutationFn: async () => {
      // First create trainer with user_id set to null
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .insert({
          name: newTrainer.name,
          email: newTrainer.email,
          phone_number: newTrainer.phone_number,
          user_id: null // Set to null instead of generating UUID
        })
        .select()
        .single();

      if (trainerError) throw trainerError;

      // Then assign skills
      if (newTrainer.skills.length > 0) {
        const skillAssignments = newTrainer.skills.map(skillId => ({
          trainer_id: trainerData.id,
          skill_id: skillId
        }));

        const { error: skillsError } = await supabase
          .from('trainer_skills')
          .insert(skillAssignments);

        if (skillsError) throw skillsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      setIsAddDialogOpen(false);
      setNewTrainer({ name: '', email: '', phone_number: '', skills: [] });
      toast({
        title: "Success",
        description: "Trainer added successfully.",
      });
    },
    onError: (error: any) => {
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

  // Generate setup token mutation
  const generateTokenMutation = useMutation({
    mutationFn: async (trainerEmail: string) => {
      const { data, error } = await supabase.rpc('generate_trainer_setup_token', {
        trainer_email: trainerEmail
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (token: string) => {
      setSetupToken(token);
      setShowTokenDialog(true);
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast({
        title: "Setup Token Generated",
        description: "Setup token has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate setup token",
        variant: "destructive",
      });
    },
  });

  const copyTokenToClipboard = () => {
    const setupUrl = `${window.location.origin}/?mode=trainer&token=${setupToken}`;
    navigator.clipboard.writeText(setupUrl);
    toast({
      title: "Copied to Clipboard",
      description: "Setup URL has been copied to clipboard.",
    });
  };

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
    <>
      <Card className="border-amber-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-amber-800">Trainer Management</CardTitle>
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
                  <div>
                    <Label>Assign Skills</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {skills?.map((skill) => (
                        <div key={skill.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill.id}
                            checked={newTrainer.skills.includes(skill.id)}
                            onCheckedChange={() => handleSkillToggle(skill.id)}
                          />
                          <Label htmlFor={skill.id} className="text-sm">
                            {skill.name}
                          </Label>
                        </div>
                      ))}
                    </div>
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
              <p>No trainers found. Add the first trainer to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned Skills</TableHead>
                  <TableHead>Password Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers?.map((trainer) => {
                  const authInfo = trainer.trainer_auth?.[0];
                  const hasPassword = authInfo?.password_set;
                  const hasValidToken = authInfo?.setup_token && 
                    authInfo?.token_expires_at && 
                    new Date(authInfo.token_expires_at) > new Date();
                  
                  return (
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
                        {hasPassword ? (
                          <Badge className="bg-green-100 text-green-800">Password Set</Badge>
                        ) : hasValidToken ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Token Generated</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">No Password</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateTokenMutation.mutate(trainer.email)}
                            disabled={generateTokenMutation.isPending}
                            title="Generate setup token"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTrainer(trainer);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTrainerMutation.mutate(trainer.id)}
                            disabled={deleteTrainerMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Setup Token Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trainer Setup Token Generated</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Send this URL to the trainer to set up their password:
            </p>
            <div className="flex space-x-2">
              <Input
                value={`${window.location.origin}/?mode=trainer&token=${setupToken}`}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyTokenToClipboard} size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              This token will expire in 7 days.
            </p>
            <Button onClick={() => setShowTokenDialog(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrainerManagement;
