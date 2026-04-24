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

const ERRAND_TYPES = [
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "pharmacy", label: "Pharmacy", icon: Pill },
  { id: "banking", label: "Banking / Mobile money", icon: Banknote },
  { id: "repairs", label: "Repairs / Services", icon: Wrench },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "other", label: "Other", icon: Briefcase },
] as const;

type ErrandType = (typeof ERRAND_TYPES)[number]["id"];

interface ErrandsFormProps {
  pickupLabel?: string | null;
}

export default function ErrandsForm({ pickupLabel }: ErrandsFormProps) {
  const [type, setType] = useState<ErrandType>("shopping");
  const [pickup, setPickup] = useState(pickupLabel ?? "");
  const [dropoff, setDropoff] = useState("");
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      toast.error("Add both pickup and drop-off locations.");
      return;
    }
    setSubmitting(true);
    // Stub: in production this would create an errand task in the deliveries table.
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    toast.success("Errand request sent. A runner will accept shortly.");
    setNotes("");
    setBudget("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Send a runner</h2>
        <p className="text-sm text-muted-foreground">
          Get someone to handle a quick task across town.
        </p>
      </div>

      <div>
        <Label className="text-xs uppercase text-muted-foreground">
          Errand type
        </Label>
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
        <div>
          <Label htmlFor="pickup">Pickup</Label>
          <Input
            id="pickup"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Where to start, e.g. Manda Hill Mall"
          />
        </div>
        <div>
          <Label htmlFor="dropoff">Drop-off</Label>
          <Input
            id="dropoff"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            placeholder="Where to deliver"
          />
        </div>
        <div>
          <Label htmlFor="notes">Instructions</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What does the runner need to do? (e.g. buy groceries, deliver documents)"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="budget">Budget (ZMW)</Label>
          <Input
            id="budget"
            type="number"
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <Card className="p-3 bg-muted/40 border-dashed">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Service fee</span>
          <Badge variant="secondary">From ZMW 25</Badge>
        </div>
      </Card>

      <Button
        className="w-full h-12 text-base"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Requesting…" : "Request errand"}
      </Button>
    </div>
  );
}
