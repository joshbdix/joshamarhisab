import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useHisab } from "@/hooks/useHisab";
import { totals } from "@/lib/hisab";
import { formatMonthLabel, formatTaka } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "রিপোর্ট — আমার হিসাব" },
      { name: "description", content: "মাসভিত্তিক পাওনা, নেওয়া ও বাকির রিপোর্ট এবং ডাটা এক্সপোর্ট।" },
      { property: "og:title", content: "রিপোর্ট — আমার হিসাব" },
      { property: "og:description", content: "সব মাসের হিসাবের বিশ্লেষণ ও এক্সপোর্ট।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { summaries, transactions, sources } = useHisab();
  const t = totals(summaries);

  const chartData = summaries.map((s) => ({
    name: formatMonthLabel(s.year, s.month),
    পাওনা: s.finalReceivable,
    নেওয়া: s.received,
    বাকি: s.remaining,
  }));

  const exportCsv = () => {
    const header = ["তারিখ", "মাস", "উৎস", "পরিমাণ", "বিবরণ"];
    const lines = transactions.map((tx) => {
      const m = summaries.find((s) => s.id === tx.month_id);
      return [
        tx.transaction_date,
        m ? formatMonthLabel(m.year, m.month) : "",
        sources.find((s) => s.id === tx.source_id)?.name ?? "",
        String(tx.amount),
        (tx.description ?? "").replace(/,/g, " "),
      ].join(",");
    });
    const csv = "\uFEFF" + [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "amar-hisab.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">রিপোর্ট</h1>
        <Button variant="outline" className="gap-1" onClick={exportCsv}>
          <Download className="h-4 w-4" /> ডাটা এক্সপোর্ট
        </Button>
      </div>

      <div className="surface-card overflow-x-auto p-4">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2">মাস</th>
              <th className="py-2 text-right">চূড়ান্ত পাওনা</th>
              <th className="py-2 text-right">নেওয়া</th>
              <th className="py-2 text-right">বাকি</th>
              <th className="py-2 text-right">লেনদেন</th>
            </tr>
          </thead>
          <tbody>
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  এখনও কোনো তথ্য নেই
                </td>
              </tr>
            ) : (
              [...summaries].reverse().map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2">{formatMonthLabel(s.year, s.month)}</td>
                  <td className="num py-2 text-right">{formatTaka(s.finalReceivable)}</td>
                  <td className="num py-2 text-right text-success">{formatTaka(s.received)}</td>
                  <td className="num py-2 text-right text-destructive">
                    {formatTaka(s.remaining)}
                  </td>
                  <td className="num py-2 text-right">{s.transactionCount}</td>
                </tr>
              ))
            )}
          </tbody>
          {summaries.length > 0 && (
            <tfoot>
              <tr className="font-semibold">
                <td className="py-2">সর্বমোট</td>
                <td className="num py-2 text-right">{formatTaka(t.receivable)}</td>
                <td className="num py-2 text-right text-success">{formatTaka(t.received)}</td>
                <td className="num py-2 text-right text-destructive">{formatTaka(t.remaining)}</td>
                <td className="num py-2 text-right">{transactions.length}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {summaries.length > 0 && (
        <div className="surface-card p-4">
          <h2 className="mb-3 text-base font-semibold">তুলনামূলক চিত্র</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(v: number) => formatTaka(Number(v))} />
                <Legend />
                <Bar dataKey="পাওনা" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="নেওয়া" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="বাকি" fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
