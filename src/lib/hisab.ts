import type { Tables } from "@/integrations/supabase/types";

export type MonthRow = Tables<"months">;
export type TransactionRow = Tables<"transactions">;
export type SourceRow = Tables<"sources">;

export type MonthSummary = {
  id: string;
  year: number;
  month: number;
  sortKey: number;
  base: number;
  adjustment: number;
  adjustmentType: string;
  adjustmentReason: string | null;
  note: string | null;
  finalReceivable: number;
  received: number;
  remaining: number;
  transactionCount: number;
};

/** Chronological summaries (oldest first) built from raw rows — never hardcoded. */
export function buildSummaries(
  months: MonthRow[],
  transactions: TransactionRow[],
): MonthSummary[] {
  return [...months]
    .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month))
    .map((m) => {
      const own = transactions.filter((t) => t.month_id === m.id);
      const received = own.reduce((sum, t) => sum + Number(t.amount), 0);
      const adjustment =
        (m.adjustment_type === "decrease" ? -1 : 1) * Number(m.adjustment_amount ?? 0);
      const finalReceivable = Number(m.base_receivable ?? 0) + adjustment;
      return {
        id: m.id,
        year: m.year,
        month: m.month,
        sortKey: m.year * 12 + m.month,
        base: Number(m.base_receivable ?? 0),
        adjustment,
        adjustmentType: m.adjustment_type ?? "increase",
        adjustmentReason: m.adjustment_reason,
        note: m.note,
        finalReceivable,
        received,
        remaining: finalReceivable - received,
        transactionCount: own.length,
      };
    });
}

export function totals(summaries: MonthSummary[]) {
  return summaries.reduce(
    (acc, s) => ({
      receivable: acc.receivable + s.finalReceivable,
      received: acc.received + s.received,
      remaining: acc.remaining + s.remaining,
    }),
    { receivable: 0, received: 0, remaining: 0 },
  );
}

export function previousOutstanding(summaries: MonthSummary[], sortKey: number) {
  return summaries.filter((s) => s.sortKey < sortKey).reduce((sum, s) => sum + s.remaining, 0);
}

/** The summary for the real current calendar month, or null when it doesn't exist yet. */
export function currentMonthSummary(summaries: MonthSummary[]): MonthSummary | null {
  const now = new Date();
  const key = now.getFullYear() * 12 + (now.getMonth() + 1);
  return summaries.find((s) => s.sortKey === key) ?? null;
}
