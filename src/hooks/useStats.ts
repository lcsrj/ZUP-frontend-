// Hook agregador de estatísticas para Minha Cidade e Gestão.
// Lê ocorrências do backend Node via useOccurrences() (react-query).
// Quando o backend expuser /analytics/*, cada hook pode trocar a fonte
// sem alterar os componentes consumidores.

import { useMemo } from "react";
import { type Report } from "@/data/mockData";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useCategories } from "@/hooks/useCatalog";

const RESOLVED_STATUSES = ["resolvido", "resolucao_validada"] as const;
const PENDING_STATUSES = ["aguardando_validacao", "em_analise", "em_execucao"] as const;

const isResolved = (r: Report) => RESOLVED_STATUSES.includes(r.status as any);
const isPending = (r: Report) => PENDING_STATUSES.includes(r.status as any);

const daysBetween = (a: string, b: string) =>
  Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

export interface CityOverview {
  total: number;
  active: number;
  resolved: number;
  unresolved: number;
  prePublication: number;
  awaitingValidation: number;
  inAnalysis: number;
  inExecution: number;
  resolutionValidated: number;
  resolutionRejected: number;
  resolutionRate: number;
  pendingRate: number;
  avgResponseDays: number;
  avgResolutionDays: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  prevMonthCount: number;
  growthPct: number;
}

export interface NeighborhoodStat {
  name: string;
  total: number;
  resolved: number;
  pending: number;
  recurrent: number;
  vandalism: number;
  lighting: number;
  sanitation: number;
  resolutionRate: number;
  avgResolutionDays: number;
}

export interface CategoryStat {
  id: string;
  name: string;
  total: number;
  resolved: number;
  pending: number;
  rejected: number;
  recurrent: number;
  resolutionRate: number;
  avgResolutionDays: number;
}

export interface OrganStat {
  organ: string;
  name: string;
  total: number;
  resolved: number;
  pending: number;
  inExecution: number;
  recurrent: number;
  rejected: number;
  overdue: number;
  resolutionRate: number;
  avgResponseDays: number;
  avgResolutionDays: number;
}

const ORGAN_NAMES: Record<string, string> = {
  prefeitura: "Prefeitura",
  agua_saneamento: "Água e Saneamento (VISAN)",
  energia_luz: "Energia e Iluminação (CELESC)",
};

export function useCityOverview(): CityOverview {
  const { reports } = useOccurrences();
  return useMemo(() => {
    const total = reports.length;
    const active = reports.filter(r => !isResolved(r) && !["arquivado", "pre_publicacao"].includes(r.status)).length;
    const resolved = reports.filter(isResolved).length;
    const unresolved = reports.filter(r => !isResolved(r)).length;
    const today = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const weekAgo = now - 7 * 86_400_000;
    const monthAgo = now - 30 * 86_400_000;
    const prevMonthAgo = now - 60 * 86_400_000;

    const responseDays: number[] = [];
    const resolutionDays: number[] = [];
    reports.forEach(r => {
      const firstResp = r.statusHistory?.find(h =>
        ["em_analise", "em_execucao"].includes(h.status as any)
      );
      if (firstResp) responseDays.push(daysBetween(r.createdAt, firstResp.date));
      const resolvedEntry = r.statusHistory?.find(h => isResolved({ status: h.status } as Report));
      if (resolvedEntry) resolutionDays.push(daysBetween(r.createdAt, resolvedEntry.date));
    });

    const avg = (a: number[]) => (a.length ? +(a.reduce((s, n) => s + n, 0) / a.length).toFixed(1) : 0);

    const todayCount = reports.filter(r => r.createdAt.startsWith(today)).length;
    const weekCount = reports.filter(r => new Date(r.createdAt).getTime() >= weekAgo).length;
    const monthCount = reports.filter(r => new Date(r.createdAt).getTime() >= monthAgo).length;
    const prevMonthCount = reports.filter(r => {
      const t = new Date(r.createdAt).getTime();
      return t >= prevMonthAgo && t < monthAgo;
    }).length;

    return {
      total,
      active,
      resolved,
      unresolved,
      prePublication: reports.filter(r => r.status === "pre_publicacao").length,
      awaitingValidation: reports.filter(r => r.status === "aguardando_validacao").length,
      inAnalysis: reports.filter(r => r.status === "em_analise").length,
      inExecution: reports.filter(r => r.status === "em_execucao").length,
      resolutionValidated: reports.filter(r => r.status === "resolucao_validada").length,
      resolutionRejected: reports.filter(r => r.status === "resolucao_rejeitada").length,
      resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
      pendingRate: total ? Math.round((unresolved / total) * 100) : 0,
      avgResponseDays: avg(responseDays),
      avgResolutionDays: avg(resolutionDays),
      todayCount,
      weekCount,
      monthCount,
      prevMonthCount,
      growthPct: prevMonthCount ? Math.round(((monthCount - prevMonthCount) / prevMonthCount) * 100) : 0,
    };
  }, [reports]);
}

export function useNeighborhoodStats(): NeighborhoodStat[] {
  const { reports } = useOccurrences();
  const { categories } = useCategories();
  return useMemo(() => {
    const map = new Map<string, NeighborhoodStat>();
    reports.forEach(r => {
      const cur = map.get(r.neighborhood) ?? {
        name: r.neighborhood,
        total: 0, resolved: 0, pending: 0, recurrent: 0,
        vandalism: 0, lighting: 0, sanitation: 0,
        resolutionRate: 0, avgResolutionDays: 0,
      };
      cur.total += 1;
      if (isResolved(r)) cur.resolved += 1;
      else if (isPending(r)) cur.pending += 1;
      if (r.isRecurrence) cur.recurrent += 1;
      const cat = categories.find(c => c.id === r.categoryId);
      if (cat?.id === "vandalismo") cur.vandalism += 1;
      if (cat?.id === "iluminacao" || cat?.organ === "energia_luz") cur.lighting += 1;
      if (cat?.organ === "agua_saneamento") cur.sanitation += 1;
      map.set(r.neighborhood, cur);
    });
    return Array.from(map.values()).map(n => ({
      ...n,
      resolutionRate: n.total ? Math.round((n.resolved / n.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [reports, categories]);
}

export function useCategoryStats(): CategoryStat[] {
  const { reports } = useOccurrences();
  const { categories } = useCategories();
  return useMemo(() => {
    return categories.map(cat => {
      const list = reports.filter(r => r.categoryId === cat.id);
      const total = list.length;
      const resolved = list.filter(isResolved).length;
      return {
        id: cat.id,
        name: cat.name,
        total,
        resolved,
        pending: list.filter(isPending).length,
        rejected: list.filter(r => r.status === "resolucao_rejeitada").length,
        recurrent: list.filter(r => r.isRecurrence).length,
        resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
        avgResolutionDays: 0,
      };
    }).sort((a, b) => b.total - a.total);
  }, [reports, categories]);
}

export function useOrganStats(): OrganStat[] {
  const { reports } = useOccurrences();
  return useMemo(() => {
    const organs = ["prefeitura", "agua_saneamento", "energia_luz"];
    return organs.map(org => {
      const list = reports.filter(r => r.organ === org);
      const total = list.length;
      const resolved = list.filter(isResolved).length;
      const responseDays: number[] = [];
      const resolutionDays: number[] = [];
      list.forEach(r => {
        const firstResp = r.statusHistory?.find(h =>
          ["em_analise", "em_execucao"].includes(h.status as any)
        );
        if (firstResp) responseDays.push(daysBetween(r.createdAt, firstResp.date));
        const resolvedEntry = r.statusHistory?.find(h => isResolved({ status: h.status } as Report));
        if (resolvedEntry) resolutionDays.push(daysBetween(r.createdAt, resolvedEntry.date));
      });
      const avg = (a: number[]) => (a.length ? +(a.reduce((s, n) => s + n, 0) / a.length).toFixed(1) : 0);
      return {
        organ: org,
        name: ORGAN_NAMES[org],
        total,
        resolved,
        pending: list.filter(isPending).length,
        inExecution: list.filter(r => r.status === "em_execucao").length,
        recurrent: list.filter(r => r.isRecurrence).length,
        rejected: list.filter(r => r.status === "resolucao_rejeitada").length,
        overdue: list.filter(r => {
          if (!r.estimatedCompletion) return false;
          return new Date(r.estimatedCompletion) < new Date() && !isResolved(r);
        }).length,
        resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
        avgResponseDays: avg(responseDays),
        avgResolutionDays: avg(resolutionDays),
      };
    });
  }, [reports]);
}

export function useValidationStats() {
  const { reports } = useOccurrences();
  return useMemo(() => {
    const awaiting = reports.filter(r => r.status === "aguardando_validacao").length;
    const totalValidations = reports.reduce((s, r) => s + (r.validations || 0), 0);
    const requiredSix = reports.filter(r => (r.requiredValidations || 0) === 6).length;
    return {
      awaiting,
      totalValidations,
      requiredSix,
      avgValidatorsPerReport: reports.length ? +(totalValidations / reports.length).toFixed(1) : 0,
      confirmationRate: reports.length
        ? Math.round(
            (reports.filter(r => ["resolvido", "resolucao_validada"].includes(r.status as any)).length /
              reports.length) *
              100
          )
        : 0,
    };
  }, [reports]);
}
