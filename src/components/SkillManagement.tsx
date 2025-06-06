import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SkillManagement = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCode, setNewSkillCode] = useState('');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editedSkillName, setEditedSkillName] = useState('');
  const [editedSkillCode, setEditedSkillCode] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch skills
  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Create skill mutation
  const createSkillMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('skills')
        .insert({ name: newSkillName, code: newSkillCode });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Skill Created",
        description: "New skill has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setIsCreating(false);
      setNewSkillName('');
      setNewSkillCode('');
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create skill",
        variant: "destructive",
      });
    },
  });

  // Update skill mutation
  const updateSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const { error } = await supabase
        .from('skills')
        .update({ name: editedSkillName, code: editedSkillCode })
        .eq('id', skillId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Skill Updated",
        description: "Skill has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setEditingSkillId(null);
      setEditedSkillName('');
      setEditedSkillCode('');
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update skill",
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
      toast({
        title: "Skill Deleted",
        description: "Skill has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete skill",
        variant: "destructive",
      });
    },
  });

  // Toggle skill status mutation
  const toggleSkillStatusMutation = useMutation({
    mutationFn: async ({ skillId, is_active }: { skillId: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('skills')
        .update({ is_active: !is_active })
        .eq('id', skillId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Skill Status Updated",
        description: "Skill status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error: any) => {
      toast({
        title: "Status Update Failed",
        description: error.message || "Failed to update skill status",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-amber-800">Manage Skills</CardTitle>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            Create Skill
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isCreating && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-amber-700 mb-4">Create New Skill</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newSkillName">Skill Name</Label>
                <Input
                  id="newSkillName"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="newSkillCode">Skill Code</Label>
                <Input
                  id="newSkillCode"
                  value={newSkillCode}
                  onChange={(e) => setNewSkillCode(e.target.value)}
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
            </div>
            <Button
              onClick={() => createSkillMutation.mutate()}
              disabled={createSkillMutation.isLoading}
              className="mt-4 bg-amber-700 hover:bg-amber-800"
            >
              {createSkillMutation.isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4">Loading skills...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills?.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell>
                    {editingSkillId === skill.id ? (
                      <Input
                        value={editedSkillName}
                        onChange={(e) => setEditedSkillName(e.target.value)}
                        className="border-amber-200 focus:border-amber-500"
                      />
                    ) : (
                      skill.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingSkillId === skill.id ? (
                      <Input
                        value={editedSkillCode}
                        onChange={(e) => setEditedSkillCode(e.target.value)}
                        className="border-amber-200 focus:border-amber-500"
                      />
                    ) : (
                      skill.code
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={skill.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {skill.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingSkillId === skill.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => updateSkillMutation.mutate(skill.id)}
                          disabled={updateSkillMutation.isLoading}
                          variant="outline"
                          size="sm"
                        >
                          {updateSkillMutation.isLoading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          onClick={() => setEditingSkillId(null)}
                          variant="ghost"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => {
                            setEditingSkillId(skill.id);
                            setEditedSkillName(skill.name);
                            setEditedSkillCode(skill.code);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => toggleSkillStatusMutation.mutate({ skillId: skill.id, is_active: skill.is_active })}
                          disabled={toggleSkillStatusMutation.isLoading}
                          variant="outline"
													size="sm"
                        >
                          {toggleSkillStatusMutation.isLoading ? 'Updating...' : (skill.is_active ? 'Deactivate' : 'Activate')}
                        </Button>
                        <Button
                          onClick={() => deleteSkillMutation.mutate(skill.id)}
                          disabled={deleteSkillMutation.isLoading}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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
  );
};

export default SkillManagement;
