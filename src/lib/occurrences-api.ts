import { api, assetUrl } from "@/lib/api";
import type { BackendCategory, BackendNeighborhood, BackendOrganization, BackendSubcategory } from "@/lib/catalog-api";
import type { OrganType, Priority, Report, ReportStatus, StatusHistoryEntry } from "@/data/mockData";

export interface BackendOccurrenceMedia {
  id: number;
  occurrence_id: number;
  url: string;
  storage_key?: string;
  original_name?: string | null;
  mime_type?: string;
  size_bytes?: number;
  uploaded_by?: number | null;
  created_at?: string;
}

export interface BackendOccurrence {
  id: number;
  title: string;
  description: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  } | null;
  address?: string | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  neighborhood_id?: number | null;
  author_id?: number | null;
  assigned_organization_id?: number | null;
  status: BackendOccurrenceStatus;
  upvote_count?: number | string | null;
  downvote_count?: number | string | null;
  score?: number | string | null;
  reopen_count?: number | string | null;
  parent_occurrence_id?: number | null;
  root_occurrence_id?: number | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  media?: BackendOccurrenceMedia[];
  distance_m?: number | string;
  voted_user?: "up" | "down" | null;
}

export interface BackendStatusHistoryEntry {
  id: number;
  occurrence_id: number;
  old_status: BackendOccurrenceStatus | null;
  new_status: BackendOccurrenceStatus;
  changed_by?: number | null;
  note?: string | null;
  created_at: string;
}

export type BackendOccurrenceStatus =
  | "pending"
  | "awaiting_validation"
  | "validated"
  | "in_analysis"
  | "in_progress"
  | "resolved"
  | "resolution_validated"
  | "resolution_rejected"
  | "closed";

const STATUS_MAP: Record<BackendOccurrenceStatus, ReportStatus> = {
  pending: "pre_publicacao",
  awaiting_validation: "aguardando_validacao",
  validated: "em_analise",
  in_analysis: "em_analise",
  in_progress: "em_execucao",
  resolved: "resolvido",
  resolution_validated: "resolucao_validada",
  resolution_rejected: "resolucao_rejeitada",
  closed: "arquivado",
};

const STATUS_REVERSE_MAP: Partial<Record<ReportStatus, BackendOccurrenceStatus>> = {
  pre_publicacao: "pending",
  aguardando_validacao: "awaiting_validation",
  em_analise: "in_analysis",
  em_execucao: "in_progress",
  resolvido: "resolved",
  resolucao_validada: "resolution_validated",
  resolucao_rejeitada: "resolution_rejected",
  arquivado: "closed",
};

function toNum(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function toInt(v: unknown): number {
  const n = typeof v === "string" ? parseInt(v, 10) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function locationToLatLng(location: BackendOccurrence["location"]) {
  const [lng, lat] = location?.coordinates ?? [0, 0];
  return { lat: toNum(lat), lng: toNum(lng) };
}

function inferOrganFromOrganizationName(name?: string | null): OrganType {
  const normalized = (name ?? "").toLowerCase();
  if (normalized.includes("água") || normalized.includes("agua") || normalized.includes("saneamento") || normalized.includes("visan")) {
    return "agua_saneamento";
  }
  if (normalized.includes("energia") || normalized.includes("luz") || normalized.includes("celesc")) {
    return "energia_luz";
  }
  return "prefeitura";
}

export interface OccurrenceLookups {
  categories?: BackendCategory[];
  subcategories?: BackendSubcategory[];
  neighborhoods?: BackendNeighborhood[];
  organizations?: BackendOrganization[];
}

export function mapStatusToBackend(status: ReportStatus): BackendOccurrenceStatus | undefined {
  return STATUS_REVERSE_MAP[status];
}

export function mapStatusToReport(status: string): ReportStatus {
  return STATUS_MAP[status as BackendOccurrenceStatus] ?? "aguardando_validacao";
}

export function mapHistoryToReport(history: BackendStatusHistoryEntry[]): StatusHistoryEntry[] {
  return history.map((h) => ({
    status: mapStatusToReport(h.new_status),
    date: h.created_at,
    note: h.note ?? undefined,
    by: h.changed_by ? `Usuário ${h.changed_by}` : undefined,
  }));
}

export function mapOccurrenceToReport(o: BackendOccurrence, lookups: OccurrenceLookups = {}): Report {
  const { lat, lng } = locationToLatLng(o.location);
  const category = lookups.categories?.find((c) => c.id === o.category_id);
  const subcategory = lookups.subcategories?.find((s) => s.id === o.subcategory_id);
  const neighborhood = lookups.neighborhoods?.find((n) => n.id === o.neighborhood_id);
  const organization = lookups.organizations?.find((org) => org.id === o.assigned_organization_id);
  const media = (o.media ?? []).map((m) => assetUrl(m.url)).filter(Boolean);
  const status = mapStatusToReport(o.status);
  const createdAt = o.created_at ?? new Date().toISOString();

  return {
    id: String(o.id),
    title: o.title,
    description: o.description,
    status,
    priority: "media" satisfies Priority,
    categoryId: o.category_id != null ? String(o.category_id) : "",
    subcategoryId: o.subcategory_id != null ? String(o.subcategory_id) : "",
    categoryName: category?.name,
    subcategoryName: subcategory?.name,
    neighborhood: neighborhood?.name ?? (o.neighborhood_id ? `Bairro ${o.neighborhood_id}` : "Sem bairro"),
    neighborhoodId: o.neighborhood_id != null ? String(o.neighborhood_id) : undefined,
    municipalityId: "videira-sc",
    address: o.address ?? null,
    lat,
    lng,
    imageUrl: media[0] ?? "/placeholder.svg",
    imageUrls: media,
    createdAt,
    updatedAt: o.updated_at ?? createdAt,
    validations: toInt(o.upvote_count),
    requiredValidations: 2,
    resolutionValidations: 0,
    organ: inferOrganFromOrganizationName(organization?.name),
    organizationId: o.assigned_organization_id != null ? String(o.assigned_organization_id) : undefined,
    organizationName: organization?.name,
    authorId: o.author_id != null ? String(o.author_id) : undefined,
    upvoteCount: toInt(o.upvote_count),
    downvoteCount: toInt(o.downvote_count),
    score: toInt(o.score),
    isRecurrence: toInt(o.reopen_count) > 0 || o.parent_occurrence_id != null || o.root_occurrence_id != null,
    previousReportId: o.parent_occurrence_id != null ? String(o.parent_occurrence_id) : undefined,
    recurrenceCount: toInt(o.reopen_count),
    statusHistory: [{ status, date: createdAt }],
  };
}

export interface CreateOccurrencePayload {
  title: string;
  description: string;
  category_id: number;
  subcategory_id?: number | null;
  neighborhood_id?: number | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  assigned_organization_id?: number | null;
  parent_occurrence_id?: number | null;
  status?: BackendOccurrenceStatus;
}

export async function createOccurrence(payload: CreateOccurrencePayload): Promise<BackendOccurrence> {
  return api.post<BackendOccurrence>("/occurrences", payload);
}

export async function uploadOccurrencePhotos(
  occurrenceId: number | string,
  files: File[]
): Promise<BackendOccurrenceMedia[]> {
  if (!files.length) return [];
  const fd = new FormData();
  files.forEach((f, i) => {
    fd.append("media", f, f.name || `media-${i}.jpg`);
  });
  return api.post<BackendOccurrenceMedia[]>(`/occurrences/${occurrenceId}/media`, fd, { multipart: true });
}

export interface ListOccurrencesQuery {
  status?: BackendOccurrenceStatus;
  category_id?: number;
  subcategory_id?: number;
  neighborhood_id?: number;
  author_id?: number;
  assigned_organization_id?: number;
  limit?: number;
  offset?: number;
}

export async function listOccurrences(q: ListOccurrencesQuery = {}): Promise<BackendOccurrence[]> {
  return api.get<BackendOccurrence[]>("/occurrences", {
    query: q as Record<string, string | number | boolean | undefined | null>,
    auth: false,
  });
}

export async function listNearbyOccurrences(params: {
  lat: number;
  lng: number;
  radius?: number;
}): Promise<BackendOccurrence[]> {
  return api.get<BackendOccurrence[]>("/occurrences/nearby", {
    query: params,
    auth: false,
  });
}

export async function getOccurrence(id: number | string): Promise<BackendOccurrence> {
  return api.get<BackendOccurrence>(`/occurrences/${id}`, { auth: false });
}

export async function listOccurrenceStatusHistory(id: number | string): Promise<BackendStatusHistoryEntry[]> {
  return api.get<BackendStatusHistoryEntry[]>(`/occurrences/${id}/status-history`, { auth: false });
}

export async function updateOccurrence(
  id: number | string,
  patch: Partial<Pick<CreateOccurrencePayload, "title" | "description" | "address" | "latitude" | "longitude">>
): Promise<BackendOccurrence> {
  return api.patch<BackendOccurrence>(`/occurrences/${id}`, patch);
}

export async function updateOccurrenceStatus(
  id: number | string,
  status: BackendOccurrenceStatus
): Promise<BackendOccurrence> {
  return api.patch<BackendOccurrence>(`/occurrences/${id}/status`, { status });
}

export async function deleteOccurrence(id: number | string): Promise<void> {
  await api.delete(`/occurrences/${id}`);
}

export async function upvoteOccurrence(id: number | string) {
  return api.post(`/occurrences/${id}/upvote`);
}

export async function downvoteOccurrence(id: number | string) {
  return api.post(`/occurrences/${id}/downvote`);
}

export async function removeOccurrenceVote(id: number | string) {
  return api.delete(`/occurrences/${id}/vote`);
}
