import type { ValidationRequest } from "@/data/mockData";
import { assetUrl } from "@/lib/api";
import {
  downvoteOccurrence,
  listOccurrences,
  removeOccurrenceVote,
  upvoteOccurrence,
  type BackendOccurrence,
} from "@/lib/occurrences-api";

export type ValidationDecision = "confirm" | "reject" | "unknown";

function toNum(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function toValidationRequest(o: BackendOccurrence): ValidationRequest {
  const [lng, lat] = o.location?.coordinates ?? [0, 0];

  return {
    id: String(o.id),
    reportId: String(o.id),
    reportTitle: o.title,
    reportImageUrl: assetUrl(o.media?.[0]?.url),
    type: "existence",
    deadline: new Date(Date.now() + 24 * 3600_000).toISOString(),
    neighborhood: o.neighborhood_id ? `Bairro ${o.neighborhood_id}` : "Sem bairro",
    lat: toNum(lat),
    lng: toNum(lng),
  };
}

export async function listValidationRequests(): Promise<ValidationRequest[]> {
  const occurrences = await listOccurrences({ status: "awaiting_validation", limit: 50 });
  return occurrences.map(toValidationRequest);
}

export async function submitValidation(occurrenceId: string | number, decision: ValidationDecision): Promise<void> {
  if (decision === "confirm") {
    await upvoteOccurrence(occurrenceId);
    return;
  }
  if (decision === "reject") {
    await downvoteOccurrence(occurrenceId);
    return;
  }
  await removeOccurrenceVote(occurrenceId);
}
