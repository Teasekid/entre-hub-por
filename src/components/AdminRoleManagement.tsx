import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type UserRow = {
  id: string;
  email: string;
};

const ALL_ROLES = ["admin", "trainer", "moderator", "user"] as const;
type RoleType = typeof ALL_ROLES[number];

export default function AdminRoleManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Record<string, RoleType[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchUsers() {
      let foundUsers: UserRow[] = [];
      const { data: admins } = await supabase.from("admins").select("user_id, email");
      const { data: trainers } = await supabase.from("trainers").select("user_id, email");

      if (admins) {
        foundUsers.push(
          ...admins
            .filter((u: any) => u.user_id && u.email)
            .map((u: any) => ({ id: u.user_id, email: u.email }))
        );
      }
      if (trainers) {
        foundUsers.push(
          ...trainers
            .filter((u: any) => u.user_id && u.email)
            .map((u: any) => ({ id: u.user_id, email: u.email }))
        );
      }

      const allUsers = Object.values(
        foundUsers.reduce<{ [id: string]: UserRow }>((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {})
      );

      const userIds = allUsers.map(u => u.id);
      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role");

        const rolesByUserId: Record<string, RoleType[]> = {};
        rolesData?.forEach((r: any) => {
          if (!rolesByUserId[r.user_id]) rolesByUserId[r.user_id] = [];
          // Only allow if r.role is in ALL_ROLES
          if ((ALL_ROLES as ReadonlyArray<string>).includes(r.role)) {
            rolesByUserId[r.user_id].push(r.role as RoleType);
          }
        });

        if (isMounted) {
          setUsers(allUsers);
          setRoles(rolesByUserId);
          setLoading(false);
        }
      } else {
        setUsers([]);
        setRoles({});
        setLoading(false);
      }
    }
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Assign selected role to user
  async function assignRole(userId: string, role: RoleType) {
    if (roles[userId]?.includes(role)) {
      toast({
        title: "Already assigned",
        description: `User already has role: ${role}`,
      });
      return;
    }
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: role,
    } as { user_id: string; role: RoleType });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setRoles((prev) => ({
      ...prev,
      [userId]: prev[userId] ? [...prev[userId], role] : [role],
    }));
    toast({
      title: "Role assigned",
      description: `Assigned: ${role}`,
    });
  }

  if (loading) return <div>Loading user roles...</div>;

  const noAdmins = Object.values(roles).every((userRoles) => !userRoles?.includes("admin"));

  return (
    <Card className="border-amber-200 mt-8">
      <CardHeader>
        <CardTitle className="text-amber-800">User Role Management</CardTitle>
        {noAdmins ? (
          <div className="text-red-600 text-sm mt-2">
            No admin users found! The first logged-in user may assign themselves as admin using the form below.
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Current Roles</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {roles[user.id]?.map((role) => (
                    <Badge key={role} className="mr-1">{role}</Badge>
                  )) || (
                    <span className="text-gray-500 text-xs">No roles</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    onValueChange={(value) => assignRole(user.id, value as RoleType)}
                    value=""
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Assign role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
