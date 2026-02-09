import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Search, Car, Pencil, Signal } from "lucide-react";
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
import VehicleCard from "@/components/VehicleCard";
import { Vehicle, vehicleTypes } from "@/types/vehicleType";
import VehicleCardSkeleton from "@/components/VehicleCardSkeleton";

type vehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
type vehicleUpdate = Database["public"]["Tables"]["vehicles"]["Update"];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(false);
  const [pagenum, setPagenum] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "",
    image_url: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const itemSize = 9;
  const intersectionObserver = useRef<IntersectionObserver | null>(null);

  const lastVehicleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (intersectionObserver.current)
        intersectionObserver.current.disconnect();
      intersectionObserver.current = new IntersectionObserver((vehicles) => {
        if (vehicles[0].isIntersecting && nextPage) {
          setPagenum((prev) => prev + 1);
        }
      });
      if (node) {
        intersectionObserver.current.observe(node);
      }
    },
    [loading, nextPage],
  );

  const fetchVehicles = useCallback(
    async (controller: AbortController) => {
      setLoading(true);
      const from = pagenum * itemSize;
      const to = from + itemSize - 1;
      try {
        let query = supabase
          .from("vehicles")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, to)
          .abortSignal(controller.signal);

        if (debouncedSearch.trim()) {
          query = query.or(
            `vehicle_number.ilike.%${debouncedSearch}%,vehicle_type.ilike.%${debouncedSearch}%`,
          );
        }

        const { data, error } = await query;

        if (error) throw error;
        if (pagenum === 0) {
          setVehicles(data);
        } else {
          setVehicles((prev) => [...prev, ...data]);
        }
        setNextPage(Boolean(data.length === itemSize));
        setLoading(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoading(false);
        console.error("Error fetching vehicles:", error);
        toast.error("Failed to load vehicles");
      }
      // finally {
      //   setLoading(false);
      // }
    },
    [pagenum, debouncedSearch, itemSize, refreshCount],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setVehicles([]);
    setPagenum(0);
    setNextPage(true);
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    fetchVehicles(controller);

    return () => {
      controller.abort();
    };
  }, [fetchVehicles]);

  function refreshVehicles() {
    setVehicles([]);
    setPagenum(0);
    setNextPage(true);
    setRefreshCount((prev) => prev + 1);
  }

  function handleOpenAddDialog() {
    setEditingId(null);
    setFormData({ vehicle_number: "", vehicle_type: "", image_url: "" });
    setVehicleImage(null);
    setDialogOpen(true);
  }

  const handleOpenEditDialog = useCallback((vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      image_url: vehicle.image_url,
    });
    setVehicleImage(null);
    setDialogOpen(true);
  }, []);

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
      refreshVehicles();
    } catch (error) {
      if (error && error.code == 23505) {
        toast.error("Vehicle with this number already exists");
      } else {
        toast.error(error.message || "Failed to save vehicle");
      }
    }
  }

  const toggleVehicleStatus = useCallback(
    async (id: string, currentStatus: boolean) => {
      try {
        const { error } = await supabase
          .from("vehicles")
          .update({ is_active: !currentStatus })
          .eq("id", id);

        if (error) throw error;

        toast.success(
          `Vehicle marked as ${currentStatus ? "unavailable" : "available"}`,
        );
        refreshVehicles();
      } catch (error) {
        console.error("Error updating vehicle:", error);
        toast.error("Failed to update vehicle status");
      }
    },
    [],
  );

  return (
    <div className="space-y-6 overflow-hidden">
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
      <div className="relative max-w-md pl-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search vehicles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-input border-border"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-165">
        {loading &&
          pagenum == 0 &&
          vehicles.length === 0 &&
          Array.from({ length: 6 }).map((_, index) => (
            <VehicleCardSkeleton key={index} />
          ))}
        {vehicles &&
          vehicles.map((vehicle, i) => {
            const isLast = vehicles.length === i + 1;

            return (
              <VehicleCard
                key={vehicle.id}
                ref={isLast ? lastVehicleRef : null}
                vehicle={vehicle}
                toggleVehicleStatus={toggleVehicleStatus}
                handleOpenEditDialog={handleOpenEditDialog}
              />
            );
          })}
        {!loading && pagenum == 0 && vehicles.length === 0 && searchQuery && (
          <div className="col-span-full text-center py-12">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "No vehicles match your search"
                : "No vehicles yet. Add your first vehicle to get started."}
            </p>
          </div>
        )}
        {loading &&
          pagenum > 0 &&
          Array.from({ length: 6 }).map((_, index) => (
            <VehicleCardSkeleton key={index} />
          ))}
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
