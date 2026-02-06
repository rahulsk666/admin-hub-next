import { Employee } from "@/types/employeeType";
import { Column } from "@tanstack/react-table";
import { Button } from "./button";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export function SortableHeader({
  column,
  title,
}: {
  column: Column<Employee>;
  title: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="data-[state=open]:bg-accent -ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ArrowDown />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp />
      ) : (
        <ChevronsUpDown />
      )}
    </Button>
  );
}
