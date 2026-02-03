import { useEffect, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}
type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminSwitch, setAdminSwitch] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  const handleAddEmployee = () => {
    setEditingId(null);
    setFormData({ name: "", phone: "", email: "" });
    setDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingId(employee.id);
    setFormData({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
    });
    setDialogOpen(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.email || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        const updatePayload: UserUpdate = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
        };
        const { error } = await supabase
          .from("users")
          .update(updatePayload)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Employee updated successfully");
      } else {
        const createPayload: UserInsert = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          role: "EMPLOYEE",
          is_active: true,
        };
        const { error } = await supabase.from("users").insert(createPayload);

        if (error) throw error;

        toast.success("Employee added successfully");
      }
      setDialogOpen(false);
      setFormData({ name: "", phone: "", email: "" });
      fetchEmployees();
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error(error.message || "Failed to add employee");
    }
  }

  async function toggleEmployeeStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Employee ${currentStatus ? "deactivated" : "activated"}`);
      fetchEmployees();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee status");
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      (emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query)) ??
      false;
    const matchAdminSwitch = adminSwitch ? emp.role === "ADMIN" : true;
    return matchSearch && matchAdminSwitch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Employees</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleAddEmployee()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Employee" : "Add New Employee"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emp-name">Full Name *</Label>
                <Input
                  id="emp-name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-email">Email *</Label>
                <Input
                  id="emp-email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-input border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emp-phone">Phone</Label>
                <Input
                  id="emp-phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-input border-border"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingId ? "Update Employee" : "Create Employee"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex flex-row justify-between">
        <div className="flex relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border"
          />
        </div>

        {
          <div className="flex flex-row justify-between items-center gap-2 mr-2">
            <Label htmlFor="admin-switch">Admin Only</Label>
            <Switch
              id="admin-switch"
              checked={adminSwitch}
              onCheckedChange={setAdminSwitch}
            />
          </div>
        }
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading employees...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "No employees match your search"
                : "No employees yet. Add your first employee to get started."}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="animate-fade-in">
                  <td className="items-center">
                    <Avatar>
                      <AvatarImage src={employee.avatar_url} alt="avatar" />
                      <AvatarFallback>
                        <img src="/profile.png" alt="fallback" className="" />
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="font-medium">{employee.name}</td>
                  <td>{employee.phone || "—"}</td>
                  <td>{employee.role.toLowerCase() || "—"}</td>
                  <td>
                    <StatusBadge
                      status={employee.is_active ? "active" : "inactive"}
                    />
                  </td>
                  <td className="text-muted-foreground">
                    {new Date(employee.created_at).toLocaleDateString()}
                  </td>
                  <td className="space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleEmployeeStatus(employee.id, employee.is_active)
                      }
                    >
                      {employee.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditEmployee(employee)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
