import { useEffect, useState } from "react";
import { Search, Receipt, DollarSign, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReceiptData {
  id: string;
  amount: number;
  description: string | null;
  receipt_url: string | null;
  created_at: string;
  profiles: { name: string } | null;
}

export default function Receipts() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchReceipts();
  }, []);

  async function fetchReceipts() {
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const receiptsData = (data as any[])?.map(r => ({ ...r, profiles: null })) || [];
      setReceipts(receiptsData);
      
      const total = receiptsData.reduce((sum, r) => sum + Number(r.amount), 0);
      setTotalAmount(total);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  }

  const filteredReceipts = receipts.filter((r) =>
    r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.profiles?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Receipts</h1>
          <p className="text-muted-foreground">Track all expense receipts</p>
        </div>
        <div className="stat-card px-6 py-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Expenses</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search receipts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-input border-border"
        />
      </div>

      {/* Receipts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading receipts...</div>
        ) : filteredReceipts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "No receipts match your search"
                : "No receipts yet. Receipts will appear here when employees upload them."}
            </p>
          </div>
        ) : (
          filteredReceipts.map((receipt) => (
            <div key={receipt.id} className="stat-card animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div className="stat-icon">
                  <Receipt className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-success">
                  {formatCurrency(Number(receipt.amount))}
                </span>
              </div>
              <p className="text-foreground font-medium mb-2">
                {receipt.description || "No description"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {receipt.profiles?.name || "Unknown employee"}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border">
                <Calendar className="w-3 h-3" />
                <span>{new Date(receipt.created_at).toLocaleDateString()}</span>
              </div>
              {receipt.receipt_url && (
                <a
                  href={receipt.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-primary hover:underline"
                >
                  View Receipt →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
