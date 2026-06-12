import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { currentMunicipality } from "@/data/mockData";
import { MapPin, Loader2 } from "lucide-react";

interface AddressSelection {
  description: string;
  placeId: string;
  location?: { lat: number; lng: number };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (text: string) => void;
  onSelect: (selection: AddressSelection) => void;
  placeholder?: string;
  biasCenter?: [number, number];
  biasRadiusMeters?: number;
  id?: string;
  "aria-describedby"?: string;
}

interface NominatimResult {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
}

const buildViewbox = ([lat, lng]: [number, number], radiusMeters: number) => {
  const latRadius = radiusMeters / 111_320;
  const lngRadius = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [
    lng - lngRadius,
    lat + latRadius,
    lng + lngRadius,
    lat - latRadius,
  ].join(",");
};

const mainLabel = (result: NominatimResult) =>
  result.address?.road ??
  result.address?.pedestrian ??
  result.display_name.split(",")[0] ??
  result.display_name;

const secondaryLabel = (result: NominatimResult) => {
  const parts = [
    result.address?.neighbourhood ?? result.address?.suburb,
    result.address?.city ?? result.address?.town ?? result.address?.village,
    result.address?.state,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : result.display_name.split(",").slice(1, 4).join(",").trim();
};

const AddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar endereço em Videira/SC...",
  biasCenter = currentMunicipality.center,
  biasRadiusMeters = 15000,
  id,
  ...rest
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const viewbox = useMemo(
    () => buildViewbox(biasCenter, biasRadiusMeters),
    [biasCenter, biasRadiusMeters]
  );

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          addressdetails: "1",
          limit: "6",
          countrycodes: "br",
          dedupe: "1",
          q: `${trimmed}, Videira, Santa Catarina`,
          viewbox,
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
        const data = (await res.json()) as NominatimResult[];
        setSuggestions(data);
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.warn("[osm] busca de endereço falhou:", err);
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [value, viewbox]);

  const handlePick = (index: number) => {
    const result = suggestions[index];
    if (!result) return;
    const description = result.display_name;
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    onChange(description);
    setOpen(false);
    setSuggestions([]);
    onSelect({
      description,
      placeId: `${result.osm_type ?? "place"}:${result.osm_id ?? result.place_id}`,
      location: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handlePick(activeIndex);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="address-suggestions"
          {...rest}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul
          id="address-suggestions"
          role="listbox"
          className="absolute z-[2200] mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, i) => (
            <li
              key={`${suggestion.osm_type ?? "place"}-${suggestion.osm_id ?? suggestion.place_id}`}
              role="option"
              aria-selected={activeIndex === i}
              onMouseDown={(e) => {
                e.preventDefault();
                handlePick(i);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-3 py-2 text-sm cursor-pointer ${
                activeIndex === i ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              }`}
            >
              <div className="font-medium text-foreground">{mainLabel(suggestion)}</div>
              <div className="text-xs text-muted-foreground">{secondaryLabel(suggestion)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
