import { useEffect, useState } from "react";
import { Plus, Search, Car, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

import { ImageUpload } from "@/components/ImageUploadV1";

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  is_active: boolean;
  created_at: string;
  image_url: string;
}

const vehicleTypes = [
  "Sedan",
  "SUV",
  "Truck",
  "Van",
  "Ford Transit",
  "Pickup",
  "Bus",
  "Motorcycle",
  "Other",
];

type vehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
type vehicleUpdate = Database["public"]["Tables"]["vehicles"]["Update"];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "",
    image_url: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAddDialog() {
    setEditingId(null);
    setFormData({ vehicle_number: "", vehicle_type: "", image_url: "" });
    setVehicleImage(null);
    setDialogOpen(true);
  }

  function handleOpenEditDialog(vehicle: Vehicle) {
    setEditingId(vehicle.id);
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      image_url: vehicle.image_url,
    });
    setVehicleImage(null);
    setDialogOpen(true);
  }

  async function uploadVehicleImage(vehicleId: string) {
    if (!vehicleImage) return formData.image_url;

    const fileExt = vehicleImage.name.split(".").pop();
    const filePath = `${vehicleId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("vehicles")
      .upload(filePath, vehicleImage, {
        upsert: true,
        cacheControl: "no-cache",
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("vehicles").getPublicUrl(filePath);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.vehicle_number || !formData.vehicle_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        let imageUrl = formData.image_url;
        if (vehicleImage) {
          imageUrl = await uploadVehicleImage(editingId);
        }

        const { error } = await supabase
          .from("vehicles")
          .update({
            vehicle_number: formData.vehicle_number,
            vehicle_type: formData.vehicle_type,
            image_url: imageUrl,
          } as vehicleUpdate)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Vehicle updated successfully");
      } else {
        const { data: vehicleData, error } = await supabase
          .from("vehicles")
          .insert({
            vehicle_number: formData.vehicle_number,
            vehicle_type: formData.vehicle_type,
          } as vehicleInsert)
          .select()
          .single();

        if (error) throw error;

        if (vehicleImage && vehicleData) {
          const imageUrl = await uploadVehicleImage(vehicleData.id);
          const { error: updateError } = await supabase
            .from("vehicles")
            .update({ image_url: imageUrl } as vehicleUpdate)
            .eq("id", vehicleData.id);

          if (updateError) throw updateError;
        }

        toast.success("Vehicle added successfully");
      }

      setDialogOpen(false);
      setFormData({ vehicle_number: "", vehicle_type: "", image_url: "" });
      setVehicleImage(null);
      fetchVehicles();
    } catch (error) {
      if (error && error.code == 23505) {
        toast.error("Vehicle with this number already exists");
      } else {
        toast.error(error.message || "Failed to save vehicle");
      }
    }
  }

  async function toggleVehicleStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("vehicles")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Vehicle ${currentStatus ? "deactivated" : "activated"}`);
      fetchVehicles();
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast.error("Failed to update vehicle status");
    }
  }

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicle_type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Vehicles</h1>
          <p className="text-muted-foreground">Manage your fleet</p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search vehicles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-input border-border"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading vehicles...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "No vehicles match your search"
                : "No vehicles yet. Add your first vehicle to get started."}
            </p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="stat-card animate-fade-in">
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
                    onClick={() =>
                      toggleVehicleStatus(vehicle.id, vehicle.is_active)
                    }
                  >
                    {vehicle.is_active
                      ? "Mark as Unavailable"
                      : "Mark as Available"}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Vehicle" : "Add New Vehicle"}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {editingId
              ? "Edit the vehicle details"
              : "Add a new vehicle and upload a picture of it."}
          </DialogDescription>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-number">
                Vehicle Number / License Plate *
              </Label>
              <Input
                id="vehicle-number"
                placeholder="ABC-1234"
                value={formData.vehicle_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vehicle_number: e.target.value.toUpperCase(),
                  })
                }
                className="bg-input border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-type">Vehicle Type *</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, vehicle_type: value })
                }
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Picture</Label>
              <ImageUpload
                value={formData.image_url}
                onChange={(file) => setVehicleImage(file)}
                onRemove={() => {
                  setVehicleImage(null);
                  setFormData({ ...formData, image_url: "" });
                }}
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
                {editingId ? "Update Vehicle" : "Add Vehicle"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
