import { sendTelegramMessage } from "@/lib/telegram.functions";
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
    return await sendTelegramMessage({ data: { text, type } });
  } catch {
    return { ok: false, error: "Telegram request failed" };
  }
}
