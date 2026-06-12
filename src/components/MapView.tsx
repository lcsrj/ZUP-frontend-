import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type Report, getStatusColor, currentMunicipality } from "@/data/mockData";

interface MapViewProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
  onReportClick?: (report: Report) => void;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  selectedPosition?: [number, number] | null;
}

const VIDEIRA_BOUNDS = L.latLngBounds(
  [-27.15, -51.34],
  [-26.86, -50.96]
);

const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const createPinIcon = (color: string) =>
  L.divIcon({
    className: "zup-leaflet-pin",
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42" aria-hidden="true">
      <path d="M17 1C8.2 1 1 8.2 1 17c0 11.8 16 23.5 16 23.5S33 28.8 33 17C33 8.2 25.8 1 17 1z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="17" cy="17" r="5.5" fill="#ffffff"/>
    </svg>`,
  });

const selectedIcon = L.divIcon({
  className: "zup-leaflet-selected-pin",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `<span class="zup-selected-dot"></span>`,
});

const MapView = ({
  reports,
  center = currentMunicipality.center,
  zoom = currentMunicipality.zoom,
  onReportClick,
  className = "",
  onMapClick,
  selectedPosition,
}: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const validReports = useMemo(
    () => reports.filter((report) => Number.isFinite(report.lat) && Number.isFinite(report.lng)),
    [reports]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      minZoom: 11,
      maxBounds: VIDEIRA_BOUNDS,
      maxBoundsViscosity: 0.7,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      preferCanvas: true,
    });

    tileLayerRef.current = L.tileLayer(TILE_LAYER_URL, {
      maxZoom: 19,
      subdomains: "abc",
      attribution: TILE_ATTRIBUTION,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    window.setTimeout(() => {
      map.invalidateSize();
      map.setView(center, zoom, { animate: false });
    }, 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      selectedMarkerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, zoom, { animate: false });
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (event: L.LeafletMouseEvent) => {
      onMapClick?.(event.latlng.lat, event.latlng.lng);
    };

    map.off("click");
    if (onMapClick) map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [onMapClick]);

  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    validReports.forEach((report) => {
      const marker = L.marker([report.lat, report.lng], {
        icon: createPinIcon(getStatusColor(report.status)),
        title: report.title,
      });

      marker.bindTooltip(
        `<strong>${escapeHtml(report.title)}</strong><br/><span>${escapeHtml(report.neighborhood)}</span>`,
        {
          className: "zup-map-tooltip",
          direction: "top",
          offset: [0, -36],
          opacity: 0.96,
        }
      );

      if (onReportClick) marker.on("click", () => onReportClick(report));
      marker.addTo(layer);
    });
  }, [validReports, onReportClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    selectedMarkerRef.current?.remove();
    selectedMarkerRef.current = null;

    if (!selectedPosition) return;

    selectedMarkerRef.current = L.marker(selectedPosition, {
      icon: selectedIcon,
      zIndexOffset: 1000,
    }).addTo(map);
    map.panTo(selectedPosition);
  }, [selectedPosition]);

  return (
    <div className={`zup-map-shell w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-muted ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[400px]" />
    </div>
  );
};

export default MapView;
