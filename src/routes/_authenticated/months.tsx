import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHisab, useRefreshHisab } from "@/hooks/useHisab";
import { formatMonthLabel, formatTaka } from "@/lib/format";
import type { MonthSummary } from "@/lib/hisab";
import { MonthDialog } from "@/components/hisab/MonthDialog";
import { ConfirmDialog } from "@/components/hisab/ConfirmDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/months")({
  head: () => ({
    meta: [
      { title: "মাসের হিসাব — আমার হিসাব" },
      { name: "description", content: "প্রতিটি মাসের পাওনা, নেওয়া ও বাকির তালিকা দেখুন ও সম্পাদনা করুন।" },
      { property: "og:title", content: "মাসের হিসাব — আমার হিসাব" },
      { property: "og:description", content: "মাসভিত্তিক পাওনার তালিকা ও ব্যবস্থাপনা।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MonthsPage,
});

function MonthsPage() {
  const { summaries, isLoading } = useHisab();
  const refresh = useRefreshHisab();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MonthSummary | null>(null);
  const [deleting, setDeleting] = useState<MonthSummary | null>(null);

  const remove = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("months").delete().eq("id", deleting.id);
    if (error) toast.error("মুছে ফেলা যায়নি। আবার চেষ্টা করুন।");
    else toast.success("হিসাব মুছে ফেলা হয়েছে।");
    setDeleting(null);
    await refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">মাসের হিসাব</h1>
        <Button
          className="gap-1"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> নতুন মাস যোগ করুন
        </Button>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">লোড হচ্ছে…</p>
      ) : summaries.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <p className="text-base font-medium">এখনও কোনো মাসের হিসাব যোগ করা হয়নি</p>
          <Button
            className="mt-4 gap-1"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> নতুন মাসের হিসাব
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {[...summaries].reverse().map((s) => (
            <div key={s.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{formatMonthLabel(s.year, s.month)}</h2>
                  <p className="text-xs text-muted-foreground">
                    {s.transactionCount} টি লেনদেন
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="সম্পাদনা"
                    onClick={() => {
                      setEditing(s);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="মুছে ফেলুন"
                    onClick={() => setDeleting(s)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-secondary p-2">
                  <dt className="text-xs text-muted-foreground">পাওনা</dt>
                  <dd className="num font-semibold">{formatTaka(s.finalReceivable)}</dd>
                </div>
                <div className="rounded-xl bg-success/10 p-2">
                  <dt className="text-xs text-muted-foreground">নেওয়া</dt>
                  <dd className="num font-semibold text-success">{formatTaka(s.received)}</dd>
                </div>
                <div className="rounded-xl bg-destructive/10 p-2">
                  <dt className="text-xs text-muted-foreground">বাকি</dt>
                  <dd className="num font-semibold text-destructive">{formatTaka(s.remaining)}</dd>
                </div>
              </dl>

              <Link
                to="/month/$monthId"
                params={{ monthId: s.id }}
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                বিস্তারিত দেখুন <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <MonthDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        description="এই মাসের সব লেনদেনও মুছে যাবে।"
        onConfirm={remove}
      />
    </div>
  );
}
