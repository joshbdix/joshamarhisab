import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownCircle,
  BarChart3,
  CalendarRange,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useHisab } from "@/hooks/useHisab";
import { currentMonthSummary, previousOutstanding, totals } from "@/lib/hisab";
import { BANGLA_MONTHS, formatMonthLabel, formatShortDateBangla, formatTaka } from "@/lib/format";
import { SummaryCard } from "@/components/hisab/SummaryCard";
import { MonthDialog } from "@/components/hisab/MonthDialog";
import { TransactionDialog } from "@/components/hisab/TransactionDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "ড্যাশবোর্ড — আমার হিসাব" },
      {
        name: "description",
        content: "মোট পাওনা, নেওয়া ও বাকির সারসংক্ষেপ এক নজরে দেখুন — আমার হিসাব ড্যাশবোর্ড।",
      },
      { property: "og:title", content: "ড্যাশবোর্ড — আমার হিসাব" },
      { property: "og:description", content: "মাসভিত্তিক পাওনা, নেওয়া ও বাকির হিসাব এক নজরে।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Dashboard() {
  const { summaries, transactions, sources, isLoading } = useHisab();
  const [monthOpen, setMonthOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);

  const now = new Date();
  const t = totals(summaries);
  const current = currentMonthSummary(summaries);
  const prevOutstanding = current
    ? previousOutstanding(summaries, current.sortKey)
    : t.remaining;

  const chartData = summaries.map((s) => ({
    name: formatMonthLabel(s.year, s.month),
    পাওনা: s.finalReceivable,
    নেওয়া: s.received,
    বাকি: s.remaining,
  }));

  const sourceData = sources
    .map((src) => ({
      name: src.name,
      value: transactions
        .filter((tx) => tx.source_id === src.id)
        .reduce((sum, tx) => sum + Number(tx.amount), 0),
    }))
    .filter((d) => d.value > 0);

  const recent = [...transactions]
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 5);

  if (isLoading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">লোড হচ্ছে…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ড্যাশবোর্ড</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {current
              ? `চলতি মাস: ${formatMonthLabel(current.year, current.month)}`
              : "এই মাসের হিসাব এখনো যোগ করা হয়নি"}
          </p>
        </div>
        {!current && (
          <Button className="gap-1" onClick={() => setMonthOpen(true)}>
            <Plus className="h-4 w-4" /> এই মাস যোগ করুন
          </Button>
        )}
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="সর্বমোট পাওনা" amount={t.receivable} icon={Wallet} tone="primary" />
        <SummaryCard
          label="সর্বমোট নেওয়া"
          amount={t.received}
          icon={ArrowDownCircle}
          tone="success"
        />
        <SummaryCard
          label="সর্বমোট বাকি"
          amount={t.remaining}
          icon={TrendingUp}
          tone="destructive"
        />
        <SummaryCard
          label="এই মাসের বাকি"
          amount={current?.remaining ?? 0}
          icon={CalendarRange}
          tone="warning"
          hint={`পূর্বের বকেয়া: ${formatTaka(prevOutstanding)}`}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Button onClick={() => setMonthOpen(true)} className="h-12 gap-2">
          <Plus className="h-4 w-4" /> মাসের হিসাব
        </Button>
        <Button onClick={() => setTxOpen(true)} variant="secondary" className="h-12 gap-2">
          <Plus className="h-4 w-4" /> টাকা নেওয়া
        </Button>
        <Button asChild variant="outline" className="h-12 gap-2">
          <Link to="/months">
            <CalendarRange className="h-4 w-4" /> হিসাব দেখুন
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 gap-2">
          <Link to="/reports">
            <BarChart3 className="h-4 w-4" /> রিপোর্ট
          </Link>
        </Button>
      </section>

      {summaries.length === 0 ? (
        <section className="surface-card p-10 text-center">
          <h2 className="text-lg font-semibold">এখনও কোনো মাসের হিসাব যোগ করা হয়নি</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            শুরু করতে {BANGLA_MONTHS[now.getMonth()]} {now.getFullYear()} মাসের পাওনা যোগ করুন।
          </p>
          <Button className="mt-5 gap-1" onClick={() => setMonthOpen(true)}>
            <Plus className="h-4 w-4" /> নতুন মাসের হিসাব
          </Button>
        </section>
      ) : (
        <>
          <section className="surface-card p-4">
            <h2 className="text-base font-semibold">সারাংশ</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {current
                ? `${formatMonthLabel(current.year, current.month)} মাসে চূড়ান্ত পাওনা ${formatTaka(
                    current.finalReceivable,
                  )}, নেওয়া হয়েছে ${formatTaka(current.received)}, বাকি ${formatTaka(
                    current.remaining,
                  )}। পূর্বের মাসগুলোর বকেয়া ${formatTaka(prevOutstanding)} সহ সর্বমোট বাকি ${formatTaka(
                    t.remaining,
                  )}।`
                : `সর্বমোট পাওনা ${formatTaka(t.receivable)}, নেওয়া ${formatTaka(
                    t.received,
                  )}, বাকি ${formatTaka(t.remaining)}।`}
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-4">
              <h2 className="mb-3 text-base font-semibold">মাসিক পাওনা বনাম নেওয়া</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v: number) => formatTaka(Number(v))} />
                    <Legend />
                    <Bar dataKey="পাওনা" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="নেওয়া" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="surface-card p-4">
              <h2 className="mb-3 text-base font-semibold">মাসিক বাকি</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v: number) => formatTaka(Number(v))} />
                    <Line
                      type="monotone"
                      dataKey="বাকি"
                      stroke="var(--color-chart-4)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="surface-card p-4 lg:col-span-2">
              <h2 className="mb-3 text-base font-semibold">উৎসভিত্তিক নেওয়া</h2>
              {sourceData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  এখনও কোনো লেনদেন নেই
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => formatTaka(Number(v))} />
                      <Bar dataKey="value" name="নেওয়া" radius={[0, 6, 6, 0]}>
                        {sourceData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <section className="surface-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">সাম্প্রতিক লেনদেন</h2>
          <Link to="/search" className="text-sm text-primary hover:underline">
            সব দেখুন
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">এখনও কোনো লেনদেন নেই</p>
        ) : (
          <ul className="divide-y">
            {recent.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {sources.find((s) => s.id === tx.source_id)?.name ?? "অন্যান্য"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDateBangla(tx.transaction_date)}
                    {tx.description ? ` • ${tx.description}` : ""}
                  </p>
                </div>
                <span className="num text-sm font-semibold text-success">
                  {formatTaka(Number(tx.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <MonthDialog open={monthOpen} onOpenChange={setMonthOpen} />
      <TransactionDialog open={txOpen} onOpenChange={setTxOpen} />
    </div>
  );
}
