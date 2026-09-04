import { supabase } from "@/integrations/supabase/client";
import { formatDateBangla, formatMonthLabel, formatTaka } from "@/lib/format";
import type { MonthSummary } from "@/lib/hisab";

type TxInfo = {
  date: string;
  amount: number;
  source: string;
  action: "added" | "updated" | "deleted";
};

const HEADINGS: Record<TxInfo["action"], string> = {
  added: "হিসাব আপডেট",
  updated: "হিসাব সংশোধন",
  deleted: "হিসাব মুছে ফেলা হয়েছে",
};

export function buildTransactionMessage(
  tx: TxInfo,
  monthSummary: MonthSummary,
  overallRemaining: number,
) {
  const monthName = formatMonthLabel(monthSummary.year, monthSummary.month);
  return [
    `<b>${HEADINGS[tx.action]}</b>`,
    monthName,
    "",
    `তারিখ: ${formatDateBangla(tx.date)}`,
    `উৎস: ${tx.source}`,
    `${tx.action === "deleted" ? "বাদ দেওয়া হয়েছে" : "নেওয়া হয়েছে"}: ${formatTaka(tx.amount)}`,
    "",
    `মোট পাওনা: ${formatTaka(monthSummary.finalReceivable)}`,
    `মোট নেওয়া: ${formatTaka(monthSummary.received)}`,
    `${monthName}-এর বাকি: ${formatTaka(monthSummary.remaining)}`,
    `সর্বমোট বাকি: ${formatTaka(overallRemaining)}`,
  ].join("\n");
}

export async function notifyTelegram(text: string, type = "transaction") {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, error: "Not authenticated" };

    // Same-origin on the hosted app; VITE_API_BASE_URL points the static
    // GitHub Pages build at the hosted backend endpoint.
    const base = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";
    const res = await fetch(`${base}/api/public/telegram-notify`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, type }),
    });
    return (await res.json()) as { ok: boolean; error?: string | null; skipped?: boolean };
  } catch {
    return { ok: false, error: "Telegram request failed" };
  }
}
