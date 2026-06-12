import { api } from "@/lib/api";
import type { Category, Neighborhood, Subcategory } from "@/data/mockData";

export interface BackendCategory {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  is_active?: boolean;
}

export interface BackendSubcategory {
  id: number;
  category_id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  icon?: string | null;
  is_active?: boolean;
}

export interface BackendNeighborhood {
  id: number;
  name: string;
  population_estimate?: number | null;
  center_point?: {
    type: "Point";
    coordinates: [number, number];
  } | null;
}

export interface BackendOrganization {
  id: number;
  name: string;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  is_active?: boolean;
}

export async function listBackendCategories(): Promise<BackendCategory[]> {
  return api.get<BackendCategory[]>("/categories", { auth: false });
}

export async function listBackendSubcategories(): Promise<BackendSubcategory[]> {
  return api.get<BackendSubcategory[]>("/subcategories", { auth: false });
}

export async function listBackendNeighborhoods(): Promise<BackendNeighborhood[]> {
  return api.get<BackendNeighborhood[]>("/neighborhoods", { auth: false });
}

export async function locateNeighborhood(lat: number, lng: number): Promise<BackendNeighborhood | null> {
  try {
    return await api.get<BackendNeighborhood>("/neighborhoods/locate", {
      query: { lat, lng },
      auth: false,
    });
  } catch {
    return null;
  }
}

export async function listBackendOrganizations(): Promise<BackendOrganization[]> {
  return api.get<BackendOrganization[]>("/organizations", { auth: false });
}

export function mapCatalog(
  backendCategories: BackendCategory[],
  backendSubcategories: BackendSubcategory[]
): Category[] {
  const subcategoriesByCategory = new Map<number, Subcategory[]>();

  backendSubcategories
    .filter((s) => s.is_active !== false)
    .forEach((s) => {
      const categoryId = String(s.category_id);
      const subcategory: Subcategory = {
        id: String(s.id),
        backendId: s.id,
        slug: s.slug ?? undefined,
        name: s.name,
        categoryId,
        description: s.description ?? null,
      };
      const list = subcategoriesByCategory.get(s.category_id) ?? [];
      list.push(subcategory);
      subcategoriesByCategory.set(s.category_id, list);
    });

  return backendCategories
    .filter((c) => c.is_active !== false)
    .map((c) => ({
      id: String(c.id),
      backendId: c.id,
      slug: c.slug ?? undefined,
      name: c.name,
      description: c.description ?? null,
      color: c.color ?? null,
      subcategories: subcategoriesByCategory.get(c.id) ?? [],
    }));
}

export function mapNeighborhood(n: BackendNeighborhood): Neighborhood {
  return {
    id: String(n.id),
    backendId: n.id,
    name: n.name,
    municipalityId: "videira-sc",
    populationEstimate: n.population_estimate ?? null,
  };
}
