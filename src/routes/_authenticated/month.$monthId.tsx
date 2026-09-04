import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHisab, useRefreshHisab } from "@/hooks/useHisab";
import { formatDateBangla, formatMonthLabel, formatTaka } from "@/lib/format";
import { buildSummaries, previousOutstanding, type TransactionRow } from "@/lib/hisab";
import { buildTransactionMessage, notifyTelegram } from "@/lib/notify";
import { TransactionDialog } from "@/components/hisab/TransactionDialog";
import { MonthDialog } from "@/components/hisab/MonthDialog";
import { ConfirmDialog } from "@/components/hisab/ConfirmDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/month/$monthId")({
  head: () => ({
    meta: [
      { title: "মাসের বিস্তারিত — আমার হিসাব" },
      { name: "description", content: "নির্দিষ্ট মাসের পাওনা, নেওয়া, বাকি ও সব লেনদেনের বিস্তারিত।" },
      { property: "og:title", content: "মাসের বিস্তারিত — আমার হিসাব" },
      { property: "og:description", content: "মাসের সব লেনদেন ও হিসাবের বিবরণ।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MonthDetail,
});

function MonthDetail() {
  const { monthId } = Route.useParams();
  const { summaries, transactions, sources, months, isLoading } = useHisab();
  const refresh = useRefreshHisab();
  const [txOpen, setTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionRow | null>(null);
  const [monthOpen, setMonthOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState<TransactionRow | null>(null);

  const summary = summaries.find((s) => s.id === monthId);
  const rows = transactions
    .filter((t) => t.month_id === monthId)
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">লোড হচ্ছে…</p>;
  }
  if (!summary) {
    return (
      <div className="surface-card p-10 text-center">
        <p>এই মাসের হিসাব পাওয়া যায়নি।</p>
        <Link to="/months" className="mt-3 inline-block text-primary hover:underline">
          মাসের হিসাবে ফিরে যান
        </Link>
      </div>
    );
  }

  const removeTx = async () => {
    if (!deletingTx) return;
    const tx = deletingTx;
    const { error } = await supabase.from("transactions").delete().eq("id", tx.id);
    setDeletingTx(null);
    if (error) {
      toast.error("মুছে ফেলা যায়নি। আবার চেষ্টা করুন।");
      return;
    }
    toast.success("লেনদেন মুছে ফেলা হয়েছে।");

    const fresh = await supabase.from("transactions").select("*");
    const next = buildSummaries(months, (fresh.data ?? []) as TransactionRow[]);
    const ms = next.find((s) => s.id === tx.month_id);
    if (ms) {
      await notifyTelegram(
        buildTransactionMessage(
          {
            date: tx.transaction_date,
            amount: Number(tx.amount),
            source: sources.find((s) => s.id === tx.source_id)?.name ?? "অন্যান্য",
            action: "deleted",
          },
          ms,
          next.reduce((sum, s) => sum + s.remaining, 0),
        ),
      );
    }
    await refresh();
  };

  const prev = previousOutstanding(summaries, summary.sortKey);

  return (
    <div className="space-y-5">
      <Link to="/months" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> মাসের হিসাব
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{formatMonthLabel(summary.year, summary.month)}</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1" onClick={() => setMonthOpen(true)}>
            <Pencil className="h-4 w-4" /> সম্পাদনা
          </Button>
          <Button
            className="gap-1"
            onClick={() => {
              setEditingTx(null);
              setTxOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> নতুন লেনদেন
          </Button>
        </div>
      </div>

      <div className="surface-card p-4">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">মূল পাওনা</dt>
            <dd className="num text-lg font-semibold">{formatTaka(summary.base)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">সমন্বয়</dt>
            <dd className="num text-lg font-semibold">
              {summary.adjustment >= 0 ? "+" : "-"}
              {formatTaka(Math.abs(summary.adjustment))}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">চূড়ান্ত পাওনা</dt>
            <dd className="num text-lg font-bold text-primary">
              {formatTaka(summary.finalReceivable)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">বাকি</dt>
            <dd className="num text-lg font-bold text-destructive">
              {formatTaka(summary.remaining)}
            </dd>
          </div>
        </dl>
        {summary.adjustmentReason && (
          <p className="mt-3 text-xs text-muted-foreground">
            সমন্বয়ের কারণ: {summary.adjustmentReason}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          পূর্বের মাসগুলোর বকেয়া: {formatTaka(prev)}
        </p>
      </div>

      <div className="surface-card p-4">
        <h2 className="mb-3 text-base font-semibold">লেনদেন</h2>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            এই মাসে এখনও কোনো টাকা নেওয়ার হিসাব নেই।
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {sources.find((s) => s.id === tx.source_id)?.name ?? "অন্যান্য"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateBangla(tx.transaction_date)}
                    {tx.description ? ` • ${tx.description}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="num mr-2 text-sm font-semibold text-success">
                    {formatTaka(Number(tx.amount))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="সম্পাদনা"
                    onClick={() => {
                      setEditingTx(tx);
                      setTxOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="মুছে ফেলুন"
                    onClick={() => setDeletingTx(tx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TransactionDialog
        open={txOpen}
        onOpenChange={setTxOpen}
        editing={editingTx}
        defaultMonthId={monthId}
      />
      <MonthDialog open={monthOpen} onOpenChange={setMonthOpen} editing={summary} />
      <ConfirmDialog
        open={!!deletingTx}
        onOpenChange={(v) => !v && setDeletingTx(null)}
        title="আপনি কি এই লেনদেনটি মুছে ফেলতে চান?"
        onConfirm={removeTx}
      />
    </div>
  );
}
