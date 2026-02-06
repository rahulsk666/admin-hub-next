import { Employee } from "@/types/employeeType";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { StatusBadge } from "../ui/status-badge";
import { SortableHeader } from "../ui/sortable-header";

interface MetaTypes {
  onToggleStatus: (id: string, currentStatus: boolean) => Promise<void>;
  onEditEmployee: (employee: Employee) => void;
}

export const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <div className="flex ml-6">
          <SortableHeader column={column} title={"name"} />
        </div>
      );
    },
    cell: ({ row }) => {
      const employee = row.original;
      return (
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={employee.avatar_url} alt="avatar" />
            <AvatarFallback>
              <img src="/profile.png" alt="fallback" className="" />
            </AvatarFallback>
          </Avatar>
          <span>{employee.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => {
      return <SortableHeader column={column} title={"phone"} />;
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      return <SortableHeader column={column} title={"Role"} />;
    },
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => {
      return <SortableHeader column={column} title={"Status"} />;
    },
    cell: ({ row }) => {
      const employee = row.original;
      return (
        <StatusBadge status={employee.is_active ? "active" : "inactive"} />
      );
    },
  },
  {
    accessorKey: "created_at",
    accessorFn: (row) => new Date(row.created_at).toLocaleDateString(),
    header: ({ column }) => {
      return <SortableHeader column={column} title={"Joined"} />;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const employee = row.original;
      const actions = table.options.meta as MetaTypes;

      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() =>
                actions.onToggleStatus(employee.id, employee.is_active)
              }
            >
              {employee.is_active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => actions.onEditEmployee(employee)}>
              Edit Employee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
