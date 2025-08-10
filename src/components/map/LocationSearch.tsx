import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export interface LocationSearchProps {
  onSelectLocation: (loc: { lat: number; lng: number; label?: string }) => void;
  className?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export default function LocationSearch({ onSelectLocation, className }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`, {
        headers: { Accept: "application/json" },
      });
      const data: NominatimResult[] = await res.json();
      setResults(data);
      if (data.length === 0) toast({ title: "No results", description: "Try a different search term." });
    } catch (err) {
      toast({ title: "Search error", description: "Unable to search locations right now." });
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", description: "Your browser doesn't support location access." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onSelectLocation({ lat: latitude, lng: longitude, label: "My location" });
      },
      () => toast({ title: "Location error", description: "Could not get your location." }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={`w-full max-w-xl ${className ?? ""}`}>
      <form onSubmit={search} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a place, address, or city"
          aria-label="Search location"
        />
        <Button type="submit" variant="default" disabled={loading}>{loading ? "Searching" : "Search"}</Button>
        <Button type="button" variant="outline" onClick={useMyLocation}>Use my location</Button>
      </form>
      {results.length > 0 && (
        <div className="mt-2 rounded-md border bg-card p-2 max-h-64 overflow-auto">
          {results.map((r, idx) => (
            <button
              key={idx}
              className="block w-full text-left p-2 rounded hover:bg-accent"
              onClick={() => {
                onSelectLocation({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name });
                setResults([]);
              }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
