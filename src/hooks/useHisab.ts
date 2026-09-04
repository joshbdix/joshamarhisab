import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildSummaries, type MonthRow, type SourceRow, type TransactionRow } from "@/lib/hisab";
import { useAuth } from "@/hooks/useAuth";

export const HISAB_QUERY_KEY = ["hisab"] as const;

async function fetchHisab() {
  await supabase.rpc("bootstrap_account");

  const [months, transactions, sources] = await Promise.all([
    supabase.from("months").select("*").order("year").order("month"),
    supabase.from("transactions").select("*").order("transaction_date", { ascending: false }),
    supabase.from("sources").select("*").order("name"),
  ]);

  if (months.error) throw months.error;
  if (transactions.error) throw transactions.error;
  if (sources.error) throw sources.error;

  return {
    months: (months.data ?? []) as MonthRow[],
    transactions: (transactions.data ?? []) as TransactionRow[],
    sources: (sources.data ?? []) as SourceRow[],
  };
}

export function useHisab() {
  const { session } = useAuth();
  const query = useQuery({
    queryKey: HISAB_QUERY_KEY,
    queryFn: fetchHisab,
    enabled: !!session,
    staleTime: 0,
  });

  const months = query.data?.months ?? [];
  const transactions = query.data?.transactions ?? [];
  const sources = query.data?.sources ?? [];

  const summaries = useMemo(
    () => buildSummaries(months, transactions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.data],
  );

  return {
    months,
    transactions,
    sources,
    summaries,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/** Invalidate every hisab-derived query so new months appear without a reload. */
export function useRefreshHisab() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: HISAB_QUERY_KEY });
}
