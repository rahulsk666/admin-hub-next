import { useEffect, useState } from "react";
import { Users, Car, MapPin, Receipt, TrendingUp, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalEmployees: number;
  activeVehicles: number;
  activeTrips: number;
  totalReceipts: number;
}

interface RecentTrip {
  id: string;
  trip_date: string;
  status: "STARTED" | "ENDED";
  profiles: { name: string } | null;
  vehicles: { vehicle_number: string } | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeVehicles: 0,
    activeTrips: 0,
    totalReceipts: 0,
  });
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [
          { count: employeeCount },
          { count: vehicleCount },
          { count: tripCount },
          { count: receiptCount },
          { data: tripsData }
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "STARTED"),
          supabase.from("receipts").select("*", { count: "exact", head: true }),
          supabase
            .from("trips")
            .select("id, trip_date, status, user_id, vehicle_id, vehicles(vehicle_number)")
            .order("created_at", { ascending: false })
            .limit(5)
        ]);

        setStats({
          totalEmployees: employeeCount || 0,
          activeVehicles: vehicleCount || 0,
          activeTrips: tripCount || 0,
          totalReceipts: receiptCount || 0,
        });

        setRecentTrips((tripsData as any[])?.map(t => ({
          ...t,
          profiles: null // Will be fetched separately if needed
        })) || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your fleet overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Vehicles"
          value={stats.activeVehicles}
          icon={Car}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Active Trips"
          value={stats.activeTrips}
          icon={MapPin}
        />
        <StatCard
          title="Total Receipts"
          value={stats.totalReceipts}
          icon={Receipt}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Recent Trips Table */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Recent Trips</h2>
          <Clock className="w-5 h-5 text-muted-foreground" />
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : recentTrips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No trips recorded yet. Trips will appear here once employees start tracking.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Vehicle</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip) => (
                <tr key={trip.id} className="animate-fade-in">
                  <td className="font-medium">{trip.profiles?.name || "Unknown"}</td>
                  <td>{trip.vehicles?.vehicle_number || "N/A"}</td>
                  <td>{new Date(trip.trip_date).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge 
                      status={trip.status === "STARTED" ? "started" : "ended"} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-success" />
            <h3 className="font-semibold">Fleet Performance</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Your fleet is performing well. Active vehicles are being utilized efficiently.
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-4">
            <Receipt className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Expense Tracking</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            All receipts are being tracked and categorized automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
