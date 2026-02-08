import { Car, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { StatusBadge } from "./ui/status-badge";
import { forwardRef } from "react";
import { Vehicle } from "@/types/vehicleType";

interface VehicleCardProps {
  vehicle: Vehicle;
  toggleVehicleStatus: (id: string, currentStatus: boolean) => void;
  handleOpenEditDialog: (vehicle: Vehicle) => void;
}

const VehicleCard = forwardRef<HTMLDivElement, VehicleCardProps>(
  ({ vehicle, toggleVehicleStatus, handleOpenEditDialog }, ref) => {
    return (
      <div ref={ref} className="stat-card animate-fade-in">
        <div className="flex items-end justify-center"></div>
        <div className="flex items-start justify-center mb-4">
          {vehicle.image_url ? (
            <img
              src={vehicle.image_url}
              alt="vehicle image"
              className="h-52 w-80 object-contain"
            />
          ) : (
            <div className="stat-icon h-52 w-80">
              <Car className="w-44 h-44 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-row justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {vehicle.vehicle_number.toUpperCase()}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {vehicle.vehicle_type}
            </p>
          </div>
          <div className="flex flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-16 text-muted-foreground hover:text-foreground"
              onClick={() => handleOpenEditDialog(vehicle)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <StatusBadge
              status={vehicle.is_active ? "active" : "inactive"}
              label={vehicle.is_active ? "Available" : "Unavailable"}
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Added {new Date(vehicle.created_at).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleVehicleStatus(vehicle.id, vehicle.is_active)}
            >
              {vehicle.is_active ? "Mark as Unavailable" : "Mark as Available"}
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

export default VehicleCard;
