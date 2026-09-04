import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useHisab } from "@/hooks/useHisab";
import { formatDateBangla, formatMonthLabel, formatTaka } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "অনুসন্ধান — আমার হিসাব" },
      { name: "description", content: "তারিখ, উৎস ও বিবরণ ধরে সব লেনদেন খুঁজুন ও ফিল্টার করুন।" },
      { property: "og:title", content: "অনুসন্ধান — আমার হিসাব" },
      { property: "og:description", content: "লেনদেন অনুসন্ধান ও ফিল্টার।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

const ALL = "__all__";

function SearchPage() {
  const { summaries, transactions, sources } = useHisab();
  const [q, setQ] = useState("");
  const [monthId, setMonthId] = useState(ALL);
  const [sourceId, setSourceId] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = transactions
    .filter((tx) => {
      if (monthId !== ALL && tx.month_id !== monthId) return false;
      if (sourceId !== ALL && tx.source_id !== sourceId) return false;
      if (from && tx.transaction_date < from) return false;
      if (to && tx.transaction_date > to) return false;
      if (q) {
        const hay = `${tx.description ?? ""} ${tx.note ?? ""} ${
          sources.find((s) => s.id === tx.source_id)?.name ?? ""
        }`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

  const sum = rows.reduce((s, tx) => s + Number(tx.amount), 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">অনুসন্ধান</h1>

      <div className="surface-card grid gap-3 p-4 md:grid-cols-5">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="q">অনুসন্ধান</Label>
          <Input
            id="q"
            placeholder="বিবরণ বা উৎস লিখুন"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>মাস</Label>
          <Select value={monthId} onValueChange={setMonthId}>
            <SelectTrigger>
              <SelectValue placeholder="সব মাস" />
            </SelectTrigger>
            <SelectContent className="pointer-events-auto">
              <SelectItem value={ALL}>সব মাস</SelectItem>
              {[...summaries].reverse().map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {formatMonthLabel(s.year, s.month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>উৎস</Label>
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger>
              <SelectValue placeholder="সব উৎস" />
            </SelectTrigger>
            <SelectContent className="pointer-events-auto">
              <SelectItem value={ALL}>সব উৎস</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="from">শুরু</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">শেষ</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="surface-card p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold">{rows.length} টি লেনদেন</span>
          <span className="num font-semibold text-success">{formatTaka(sum)}</span>
        </div>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            কোনো লেনদেন পাওয়া যায়নি।
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((tx) => {
              const m = summaries.find((s) => s.id === tx.month_id);
              return (
                <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {sources.find((s) => s.id === tx.source_id)?.name ?? "অন্যান্য"}
                      {m ? ` • ${formatMonthLabel(m.year, m.month)}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBangla(tx.transaction_date)}
                      {tx.description ? ` • ${tx.description}` : ""}
                    </p>
                  </div>
                  <span className="num text-sm font-semibold text-success">
                    {formatTaka(Number(tx.amount))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
