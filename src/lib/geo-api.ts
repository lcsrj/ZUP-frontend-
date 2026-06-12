import { locateNeighborhood } from "@/lib/catalog-api";

export interface ReverseGeocodeResult {
  street: string;
  number: string;
  postalCode: string;
  neighborhood: string;
  formatted: string;
  neighborhoodId?: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const neighborhood = await locateNeighborhood(lat, lng);
  if (!neighborhood) return null;

  return {
    street: "",
    number: "",
    postalCode: "",
    neighborhood: neighborhood.name,
    neighborhoodId: String(neighborhood.id),
    formatted: neighborhood.name,
  };
}
