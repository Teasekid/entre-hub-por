
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SkillManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [newSkill, setNewSkill] = useState({
    name: '',
    code: '',
    description: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch skills
  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['skills-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select(`
          *,
          student_applications (count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('skills')
        .insert({
          name: newSkill.name,
          code: newSkill.code,
          description: newSkill.description,
          is_active: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills-management'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setIsAddDialogOpen(false);
      setNewSkill({ name: '', code: '', description: '' });
      toast({
        title: "Success",
        description: "Skill added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add skill",
        variant: "destructive",
      });
    },
  });

  // Update skill mutation
  const updateSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const { error } = await supabase
        .from('skills')
        .update({
          name: selectedSkill.name,
          code: selectedSkill.code,
          description: selectedSkill.description
        })
        .eq('id', skillId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills-management'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setIsEditDialogOpen(false);
      setSelectedSkill(null);
      toast({
        title: "Success",
        description: "Skill updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update skill",
        variant: "destructive",
      });
    },
  });

  // Toggle skill status mutation
  const toggleSkillMutation = useMutation({
    mutationFn: async ({ skillId, is_active }: { skillId: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('skills')
        .update({ is_active })
        .eq('id', skillId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills-management'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast({
        title: "Success",
        description: "Skill status updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update skill status",
        variant: "destructive",
      });
    },
  });

  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills-management'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast({
        title: "Success",
        description: "Skill deleted successfully.",
      });
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
        description: "Name and code are required.",
        variant: "destructive",
      });
      return;
    }
    addSkillMutation.mutate();
  };

  const handleUpdateSkill = () => {
    if (!selectedSkill?.name || !selectedSkill?.code) {
      toast({
        title: "Error",
        description: "Name and code are required.",
        variant: "destructive",
      });
      return;
    }
    updateSkillMutation.mutate(selectedSkill.id);
  };

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-amber-800">Skills Management</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-700 hover:bg-amber-800">
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Skill</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Skill Name</Label>
                  <Input
                    id="name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Web Development"
                  />
                </div>
                <div>
                  <Label htmlFor="code">Skill Code</Label>
                  <Input
                    id="code"
                    value={newSkill.code}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., WEB-DEV"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newSkill.description}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter skill description..."
                    rows={3}
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
                    onClick={handleAddSkill}
                    disabled={addSkillMutation.isPending}
                    className="bg-amber-700 hover:bg-amber-800"
                  >
                    {addSkillMutation.isPending ? 'Adding...' : 'Add Skill'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {skillsLoading ? (
          <div className="text-center py-8">Loading skills...</div>
        ) : skills?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4" />
            <p>No skills found. Add the first skill to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills?.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell className="font-medium">{skill.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{skill.code}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {skill.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {skill.student_applications?.length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={skill.is_active}
                        onCheckedChange={(checked) => 
                          toggleSkillMutation.mutate({ skillId: skill.id, is_active: checked })
                        }
                        disabled={toggleSkillMutation.isPending}
                      />
                      <Badge variant={skill.is_active ? "default" : "secondary"}>
                        {skill.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSkill(skill);
                          setIsEditDialogOpen(true);
                        }}
                        disabled={updateSkillMutation.isPending}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSkillMutation.mutate(skill.id)}
                        disabled={deleteSkillMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Skill</DialogTitle>
            </DialogHeader>
            {selectedSkill && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Skill Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedSkill.name}
                    onChange={(e) => setSelectedSkill(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Web Development"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">Skill Code</Label>
                  <Input
                    id="edit-code"
                    value={selectedSkill.code}
                    onChange={(e) => setSelectedSkill(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., WEB-DEV"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedSkill.description || ''}
                    onChange={(e) => setSelectedSkill(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter skill description..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateSkill}
                    disabled={updateSkillMutation.isPending}
                    className="bg-amber-700 hover:bg-amber-800"
                  >
                    {updateSkillMutation.isPending ? 'Updating...' : 'Update Skill'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SkillManagement;
