import { useEffect, useState } from "react";
import { Search, MapPin, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Trip {
  id: string;
  trip_date: string;
  start_time: string | null;
  end_time: string | null;
  start_km: number | null;
  end_km: number | null;
  status: "STARTED" | "ENDED";
  created_at: string;
  profiles: { name: string } | null;
  vehicles: { vehicle_number: string; vehicle_type: string } | null;
}

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select(`*, vehicles(vehicle_number, vehicle_type)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrips((data as any[])?.map(t => ({ ...t, profiles: null })) || []);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.profiles?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.vehicles?.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function formatTime(timestamp: string | null) {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function calculateDistance(startKm: number | null, endKm: number | null) {
    if (startKm === null || endKm === null) return "—";
    return `${endKm - startKm} km`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Trips</h1>
        <p className="text-muted-foreground">Track all trip activities</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-input border-border">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="STARTED">In Progress</SelectItem>
            <SelectItem value="ENDED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading trips...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="stat-card text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "No trips match your filters"
                : "No trips recorded yet. Trips will appear here when employees start tracking."}
            </p>
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <div key={trip.id} className="stat-card animate-fade-in">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="stat-icon">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {trip.profiles?.name || "Unknown Employee"}
                      </h3>
                      <StatusBadge status={trip.status === "STARTED" ? "started" : "ended"} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {trip.vehicles?.vehicle_number || "No vehicle"} • {trip.vehicles?.vehicle_type || ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(trip.trip_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {formatTime(trip.start_time)} - {formatTime(trip.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-medium">
                      {calculateDistance(trip.start_km, trip.end_km)}
                    </span>
                  </div>
                </div>
              </div>

              {(trip.start_km || trip.end_km) && (
                <div className="mt-4 pt-4 border-t border-border flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start KM:</span>{" "}
                    <span className="font-medium">{trip.start_km ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End KM:</span>{" "}
                    <span className="font-medium">{trip.end_km ?? "—"}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
