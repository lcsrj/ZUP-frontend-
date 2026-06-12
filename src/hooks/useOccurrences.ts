// Hook central para listar ocorrências do backend Node.
// Mantém o mesmo shape de `Report` usado hoje pelo front para não quebrar UIs.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listOccurrences,
  mapOccurrenceToReport,
  type ListOccurrencesQuery,
} from "@/lib/occurrences-api";
import type { Report } from "@/data/mockData";
import { useCategories, useNeighborhoods, useOrganizations } from "@/hooks/useCatalog";

export function useOccurrences(query: ListOccurrencesQuery = {}) {
  const { rawCategories, rawSubcategories } = useCategories();
  const { rawNeighborhoods } = useNeighborhoods();
  const { organizations } = useOrganizations();

  const q = useQuery({
    queryKey: ["occurrences", query],
    queryFn: () => listOccurrences(query),
    staleTime: 30_000,
    retry: 1,
  });

  const reports = useMemo(
    () =>
      (q.data ?? []).map((occurrence) =>
        mapOccurrenceToReport(occurrence, {
          categories: rawCategories,
          subcategories: rawSubcategories,
          neighborhoods: rawNeighborhoods,
          organizations,
        })
      ),
    [q.data, rawCategories, rawSubcategories, rawNeighborhoods, organizations]
  );

  return {
    reports: reports as Report[],
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    refetch: q.refetch,
  };
}
