import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { Employee } from "@/types/employeeType";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/employees/columns";
import { Switch } from "@/components/ui/switch";
import { ColumnFiltersState, SortingState } from "@tanstack/react-table";

type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminSwitch, setAdminSwitch] = useState(false);
  const [activeSwitch, setActiveSwitch] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0, //initial page index
    pageSize: 10, //default page size
  });

  const fetchEmployees = useCallback(async () => {
    const from = pagination.pageIndex * pagination.pageSize;
    const to = from + pagination.pageSize - 1;

    try {
      let query = supabase
        .from("users")
        .select("*", { count: "exact" })
        .range(from, to);

      // Sorting
      if (sorting.length > 0) {
        const { id, desc } = sorting[0];

        query = query.order(id, { ascending: !desc });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      // Filtering
      columnFilters.forEach((filter) => {
        if (filter.id === "name") {
          query = query.ilike("name", `%${filter.value}%`);
        }

        if (filter.id === "role" && typeof filter.value == "string") {
          query = query.eq("role", filter.value);
        }

        if (filter.id == "created_at" && typeof filter.value == "string") {
          query = query.eq("created_at", filter.value);
        }

        if (filter.id === "is_active" && typeof filter.value == "boolean") {
          query = query.eq("is_active", filter.value);
        }
      });

      const { data, count, error } = await query;

      if (error) throw error;

      setEmployees(data ?? []);
      setTotalCount(count ?? 0);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    }
  }, [sorting, pagination, columnFilters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
      if (error.code === "23505") {
        toast.error("Employee with this email already exists");
      } else {
        console.error("Error adding employee:", error);
        toast.error(error.message || "Failed to add employee");
      }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Employees</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <Button onClick={() => handleAddEmployee()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Employee" : "Add New Employee"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update employee details."
                  : "Create a new employee."}
              </DialogDescription>
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

              <div className="space-y-1">
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

      <DataTable
        columns={columns}
        data={employees}
        meta={{
          onToggleStatus: toggleEmployeeStatus,
          onEditEmployee: handleEditEmployee,
        }}
        toolbar={(table) => {
          return (
            <div className="flex items-center justify-between py-4 mx-1">
              <Input
                placeholder="Search"
                value={
                  (table.getColumn("name")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <div className="flex items-center gap-4 mr-2">
                <div className="flex flex-row items-center gap-2">
                  <Label htmlFor="admin-switch">Active</Label>
                  <Switch
                    id="admin-switch"
                    checked={activeSwitch}
                    onCheckedChange={(checked) => {
                      setActiveSwitch(checked);
                      table
                        .getColumn("is_active")
                        .setFilterValue(checked ? true : undefined);
                    }}
                  />
                </div>
                <div className="flex flex-row items-center gap-2">
                  <Label htmlFor="admin-switch">Admin</Label>
                  <Switch
                    id="admin-switch"
                    checked={adminSwitch}
                    onCheckedChange={(checked) => {
                      setAdminSwitch(checked);
                      if (checked)
                        table.getColumn("role").setFilterValue("ADMIN");
                      else table.getColumn("role").setFilterValue(undefined);
                    }}
                  />
                </div>
              </div>
            </div>
          );
        }}
        rowCount={totalCount}
        pagination={pagination}
        setPagination={setPagination}
        sorting={sorting}
        setSorting={setSorting}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
      />
    </div>
  );
}
