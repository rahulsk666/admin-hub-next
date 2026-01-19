import { cn } from "@/lib/utils";

type StatusType = "active" | "inactive" | "pending" | "started" | "ended";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig: Record<StatusType, { className: string; defaultLabel: string }> = {
  active: { className: "status-active", defaultLabel: "Active" },
  inactive: { className: "status-inactive", defaultLabel: "Inactive" },
  pending: { className: "status-pending", defaultLabel: "Pending" },
  started: { className: "status-started", defaultLabel: "In Progress" },
  ended: { className: "status-ended", defaultLabel: "Completed" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn("status-badge", config.className)}>
      {label || config.defaultLabel}
    </span>
  );
}
