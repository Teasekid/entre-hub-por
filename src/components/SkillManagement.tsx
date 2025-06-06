
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SkillManagement = () => {
  const [newSkill, setNewSkill] = useState({
    name: '',
    code: '',
    description: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch skills
  const { data: skills, isLoading } = useQuery({
    queryKey: ['all-skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async (skillData: typeof newSkill) => {
      const { error } = await supabase
        .from('skills')
        .insert({
          name: skillData.name,
          code: skillData.code.toLowerCase().replace(/\s+/g, '_'),
          description: skillData.description || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Skill Added",
        description: "Skill has been added successfully.",
      });
      setNewSkill({ name: '', code: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['all-skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add skill",
        variant: "destructive",
      });
    },
  });

  // Toggle skill status mutation
  const toggleSkillMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('skills')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Skill Updated",
        description: "Skill status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['all-skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update skill",
        variant: "destructive",
      });
    },
  });

  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Skill Deleted",
        description: "Skill has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['all-skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete skill",
        variant: "destructive",
      });
    },
  });

  const handleAddSkill = () => {
    if (!newSkill.name || !newSkill.code) {
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive",
      });
      return;
    }
    addSkillMutation.mutate(newSkill);
  };

  return (
    <div className="space-y-6">
      {/* Add New Skill */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add New Skill
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="skillName">Skill Name *</Label>
              <Input
                id="skillName"
                value={newSkill.name}
                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                className="border-amber-200 focus:border-amber-500"
                placeholder="e.g., Digital Marketing"
              />
            </div>
            <div>
              <Label htmlFor="skillCode">Skill Code *</Label>
              <Input
                id="skillCode"
                value={newSkill.code}
                onChange={(e) => setNewSkill(prev => ({ ...prev, code: e.target.value }))}
                className="border-amber-200 focus:border-amber-500"
                placeholder="e.g., digital_marketing"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="skillDescription">Description</Label>
            <Textarea
              id="skillDescription"
              value={newSkill.description}
              onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
              className="border-amber-200 focus:border-amber-500"
              placeholder="Brief description of the skill..."
              rows={3}
            />
          </div>
          <Button 
            onClick={handleAddSkill}
            disabled={addSkillMutation.isPending}
            className="mt-4 bg-amber-700 hover:bg-amber-800"
          >
            {addSkillMutation.isPending ? 'Adding...' : 'Add Skill'}
          </Button>
        </CardContent>
      </Card>

      {/* Skills List */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Manage Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading skills...</div>
          ) : !skills?.length ? (
            <div className="text-center py-8 text-gray-500">No skills found.</div>
          ) : (
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.id} className="border border-amber-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-amber-800">{skill.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {skill.code}
                        </Badge>
                        <Badge className={skill.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {skill.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {skill.description && (
                        <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={skill.is_active}
                            onCheckedChange={(checked) => 
                              toggleSkillMutation.mutate({ id: skill.id, isActive: checked })
                            }
                          />
                          <Label className="text-sm">Active</Label>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSkillMutation.mutate(skill.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
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

export default SkillManagement;
