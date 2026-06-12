import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listBackendCategories,
  listBackendNeighborhoods,
  listBackendOrganizations,
  listBackendSubcategories,
  mapCatalog,
  mapNeighborhood,
} from "@/lib/catalog-api";

export function useCategories() {
  const categoriesQ = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: listBackendCategories,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const subcategoriesQ = useQuery({
    queryKey: ["catalog", "subcategories"],
    queryFn: listBackendSubcategories,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const categories = useMemo(
    () => mapCatalog(categoriesQ.data ?? [], subcategoriesQ.data ?? []),
    [categoriesQ.data, subcategoriesQ.data]
  );

  return {
    categories,
    rawCategories: categoriesQ.data ?? [],
    rawSubcategories: subcategoriesQ.data ?? [],
    isLoading: categoriesQ.isLoading || subcategoriesQ.isLoading,
    isError: categoriesQ.isError || subcategoriesQ.isError,
    error: categoriesQ.error ?? subcategoriesQ.error,
  };
}

export function useNeighborhoods() {
  const neighborhoodsQ = useQuery({
    queryKey: ["catalog", "neighborhoods"],
    queryFn: listBackendNeighborhoods,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const neighborhoods = useMemo(
    () => (neighborhoodsQ.data ?? []).map(mapNeighborhood),
    [neighborhoodsQ.data]
  );

  return {
    neighborhoods,
    neighborhoodNames: neighborhoods.map((n) => n.name),
    rawNeighborhoods: neighborhoodsQ.data ?? [],
    isLoading: neighborhoodsQ.isLoading,
    isError: neighborhoodsQ.isError,
    error: neighborhoodsQ.error,
  };
}

export function useOrganizations() {
  const organizationsQ = useQuery({
    queryKey: ["catalog", "organizations"],
    queryFn: listBackendOrganizations,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return {
    organizations: organizationsQ.data ?? [],
    isLoading: organizationsQ.isLoading,
    isError: organizationsQ.isError,
    error: organizationsQ.error,
  };
}
