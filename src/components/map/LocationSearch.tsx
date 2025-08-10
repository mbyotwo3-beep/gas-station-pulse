import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search as SearchIcon, LocateFixed, X } from "lucide-react";

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
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`, {
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
        setResults([]);
      },
      () => toast({ title: "Location error", description: "Could not get your location." }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    // Close results when clicking outside
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("[data-loc-search]")) setResults([]);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div data-loc-search className={`relative w-full ${className ?? ""}`}>
      <form onSubmit={search} className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
        {query && (
          <button
            type="button"
            aria-label="Clear"
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a place, address, or city"
          aria-label="Search location"
          className="pl-9 pr-28 rounded-full shadow-md"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button type="submit" size="sm" variant="secondary" className="hidden md:inline-flex rounded-full">
            {loading ? "Searching" : "Search"}
          </Button>
          <Button type="button" size="icon" variant="secondary" className="rounded-full" onClick={useMyLocation} aria-label="Use my location">
            <LocateFixed className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 rounded-lg border bg-popover p-2 max-h-72 overflow-auto z-[1100] shadow-xl">
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
