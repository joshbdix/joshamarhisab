export const BANGLA_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

/** Indian/Bangladeshi digit grouping: 1,80,000 */
export function groupBD(value: number): string {
  const negative = value < 0;
  const [intPart, decPart] = Math.abs(value).toFixed(2).split(".");
  let out = intPart;
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    out = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }
  const decimals = decPart && decPart !== "00" ? "." + decPart : "";
  return (negative ? "-" : "") + out + decimals;
}

export function formatTaka(value: number | null | undefined): string {
  return "৳" + groupBD(Number(value ?? 0));
}

export function formatMonthLabel(year: number, month: number): string {
  return `${BANGLA_MONTHS[month - 1] ?? ""} ${year}`;
}

export function formatDateBangla(date: string): string {
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return `${d.getDate()} ${BANGLA_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDateBangla(date: string): string {
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return `${d.getDate()} ${BANGLA_MONTHS[d.getMonth()]}`;
}
