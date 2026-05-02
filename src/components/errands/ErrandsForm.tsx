import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShoppingBag,
  Pill,
  Banknote,
  Wrench,
  FileText,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import EnhancedLocationSearch from "../map/EnhancedLocationSearch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFareEstimation } from "@/hooks/useFareEstimation";
import FareEstimateCard from "../rideshare/FareEstimateCard";
import OrderHistory from "../delivery/OrderHistory";

const ERRAND_TYPES = [
  { id: "shopping", label: "Shopping", icon: ShoppingBag, baseFee: 25 },
  { id: "pharmacy", label: "Pharmacy", icon: Pill, baseFee: 30 },
  { id: "banking", label: "Banking", icon: Banknote, baseFee: 40 },
  { id: "repairs", label: "Repairs", icon: Wrench, baseFee: 35 },
  { id: "documents", label: "Documents", icon: FileText, baseFee: 25 },
  { id: "other", label: "Other", icon: Briefcase, baseFee: 25 },
] as const;

type ErrandType = (typeof ERRAND_TYPES)[number]["id"];

export default function ErrandsForm() {
  const { user } = useAuth();
  const { estimate, loading: estimating, calculateFare, clearEstimate } = useFareEstimation();
  const [type, setType] = useState<ErrandType>("shopping");
  const [pickup, setPickup] = useState<any>(null);
  const [dropoff, setDropoff] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const baseFee = ERRAND_TYPES.find((t) => t.id === type)!.baseFee;
  const distanceFee = estimate?.totalFare ?? 0;
  const total = baseFee + distanceFee + (Number(budget) || 0);

  const handleEstimate = async () => {
    if (pickup && dropoff) {
      // package_delivery rate is closest match for errand pricing
      await calculateFare(pickup, dropoff, "package_delivery");
    }
  };

  const handleSubmit = async () => {
    if (!user) return toast.error("Please sign in first.");
    if (!pickup || !dropoff) return toast.error("Add pickup and drop-off locations.");
    if (!notes.trim()) return toast.error("Describe what the runner should do.");

    setSubmitting(true);
    try {
      const { data: created, error } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          service_type: "errand" as any,
          pickup_location: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
          delivery_location: { lat: dropoff.lat, lng: dropoff.lng, address: dropoff.address },
          items: [{ type: "errand", category: type, budget: Number(budget) || 0 }],
          subtotal: baseFee + (Number(budget) || 0),
          delivery_fee: distanceFee,
          total_amount: total,
          special_instructions: notes,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;

      // Auto-assign nearest available runner
      const { data: runnerId } = await supabase.rpc("assign_nearest_runner", {
        p_order_id: created.id,
      });

      if (runnerId) {
        toast.success("Runner assigned! Track your errand below.");
      } else {
        toast.success("Errand request sent. Searching for a nearby runner…");
      }

      setNotes("");
      setBudget("");
      setPickup(null);
      setDropoff(null);
      clearEstimate();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Failed to send errand");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Send a runner</h2>
          <p className="text-sm text-muted-foreground">
            Get someone to handle a quick task across town.
          </p>
        </div>

        <div>
          <Label className="text-xs uppercase text-muted-foreground">Errand type</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {ERRAND_TYPES.map((t) => {
              const Icon = t.icon;
              const active = t.id === type;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-all",
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Pickup</Label>
            <EnhancedLocationSearch onLocationSelect={setPickup} />
          </div>
          <div className="space-y-2">
            <Label>Drop-off</Label>
            <EnhancedLocationSearch onLocationSelect={setDropoff} />
          </div>
          <div>
            <Label htmlFor="notes">Instructions *</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What does the runner need to do?"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="budget">Item / cash budget (optional)</Label>
            <Input
              id="budget"
              type="number"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 100"
            />
          </div>
        </div>

        {pickup && dropoff && (
          <div className="space-y-3">
            <Button variant="outline" onClick={handleEstimate} disabled={estimating} className="w-full">
              {estimating ? "Calculating…" : "Estimate distance fee"}
            </Button>
            <FareEstimateCard estimate={estimate} loading={estimating} />
          </div>
        )}

        <Card className="p-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service fee</span>
            <span>${baseFee.toFixed(2)}</span>
          </div>
          {estimate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Distance & time</span>
              <span>${distanceFee.toFixed(2)}</span>
            </div>
          )}
          {Number(budget) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget held</span>
              <span>${Number(budget).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
          </div>
        </Card>

        <Button
          className="w-full h-12 text-base"
          onClick={handleSubmit}
          disabled={submitting || !pickup || !dropoff}
        >
          {submitting ? "Requesting…" : "Request errand"}
        </Button>

        <Card className="p-3 bg-muted/40 border-dashed">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Runner safety</span>
            <Badge variant="secondary">Verified runners only</Badge>
          </div>
        </Card>
      </div>

      <OrderHistory />
    </div>
  );
}
