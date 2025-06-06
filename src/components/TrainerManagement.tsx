
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TrainerManagement = () => {
  const [newTrainer, setNewTrainer] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch trainers
  const { data: trainers, isLoading: loadingTrainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          trainer_skills (
            skill_id,
            skills (id, name, code)
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch skills
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
    mutationFn: async (trainerData: typeof newTrainer) => {
      const { error } = await supabase
        .from('trainers')
        .insert({
          name: trainerData.name,
          email: trainerData.email,
          phone_number: trainerData.phoneNumber,
          user_id: '00000000-0000-0000-0000-000000000000' // Placeholder - would need proper auth integration
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Trainer Added",
        description: "Trainer has been added successfully.",
      });
      setNewTrainer({ name: '', email: '', phoneNumber: '' });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add trainer",
        variant: "destructive",
      });
    },
  });

  // Assign skill mutation
  const assignSkillMutation = useMutation({
    mutationFn: async ({ trainerId, skillId }: { trainerId: string; skillId: string }) => {
      const { error } = await supabase
        .from('trainer_skills')
        .insert({
          trainer_id: trainerId,
          skill_id: skillId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Skill Assigned",
        description: "Skill has been assigned to trainer successfully.",
      });
      setSelectedTrainerId('');
      setSelectedSkillId('');
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign skill",
        variant: "destructive",
      });
    },
  });

  // Remove skill assignment mutation
  const removeSkillMutation = useMutation({
    mutationFn: async ({ trainerId, skillId }: { trainerId: string; skillId: string }) => {
      const { error } = await supabase
        .from('trainer_skills')
        .delete()
        .eq('trainer_id', trainerId)
        .eq('skill_id', skillId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Skill Removed",
        description: "Skill assignment has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove skill assignment",
        variant: "destructive",
      });
    },
  });

  const handleAddTrainer = () => {
    if (!newTrainer.name || !newTrainer.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }
    addTrainerMutation.mutate(newTrainer);
  };

  const handleAssignSkill = () => {
    if (!selectedTrainerId || !selectedSkillId) {
      toast({
        title: "Error",
        description: "Please select both trainer and skill",
        variant: "destructive",
      });
      return;
    }
    assignSkillMutation.mutate({ trainerId: selectedTrainerId, skillId: selectedSkillId });
  };

  return (
    <div className="space-y-6">
      {/* Add New Trainer */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add New Trainer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="trainerName">Name *</Label>
              <Input
                id="trainerName"
                value={newTrainer.name}
                onChange={(e) => setNewTrainer(prev => ({ ...prev, name: e.target.value }))}
                className="border-amber-200 focus:border-amber-500"
              />
            </div>
            <div>
              <Label htmlFor="trainerEmail">Email *</Label>
              <Input
                id="trainerEmail"
                type="email"
                value={newTrainer.email}
                onChange={(e) => setNewTrainer(prev => ({ ...prev, email: e.target.value }))}
                className="border-amber-200 focus:border-amber-500"
              />
            </div>
            <div>
              <Label htmlFor="trainerPhone">Phone Number</Label>
              <Input
                id="trainerPhone"
                value={newTrainer.phoneNumber}
                onChange={(e) => setNewTrainer(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="border-amber-200 focus:border-amber-500"
              />
            </div>
          </div>
          <Button 
            onClick={handleAddTrainer}
            disabled={addTrainerMutation.isPending}
            className="mt-4 bg-amber-700 hover:bg-amber-800"
          >
            {addTrainerMutation.isPending ? 'Adding...' : 'Add Trainer'}
          </Button>
        </CardContent>
      </Card>

      {/* Assign Skills to Trainers */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">Assign Skills to Trainers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Select Trainer</Label>
              <Select value={selectedTrainerId} onValueChange={setSelectedTrainerId}>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Choose trainer" />
                </SelectTrigger>
                <SelectContent>
                  {trainers?.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Skill</Label>
              <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Choose skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills?.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAssignSkill}
                disabled={assignSkillMutation.isPending}
                className="bg-amber-700 hover:bg-amber-800"
              >
                Assign Skill
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trainers List */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Trainers & Their Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTrainers ? (
            <div className="text-center py-8">Loading trainers...</div>
          ) : !trainers?.length ? (
            <div className="text-center py-8 text-gray-500">No trainers found.</div>
          ) : (
            <div className="space-y-4">
              {trainers.map((trainer) => (
                <div key={trainer.id} className="border border-amber-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-amber-800">{trainer.name}</h3>
                      <p className="text-sm text-gray-600">{trainer.email}</p>
                      {trainer.phone_number && (
                        <p className="text-sm text-gray-600">{trainer.phone_number}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Assigned Skills:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {trainer.trainer_skills?.map((ts: any) => (
                        <Badge 
                          key={ts.skill_id} 
                          className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                        >
                          {ts.skills.name}
                          <button
                            onClick={() => removeSkillMutation.mutate({ 
                              trainerId: trainer.id, 
                              skillId: ts.skill_id 
                            })}
                            className="ml-2 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {(!trainer.trainer_skills || trainer.trainer_skills.length === 0) && (
                        <span className="text-gray-500 text-sm">No skills assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerManagement;
