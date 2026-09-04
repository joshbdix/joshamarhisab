import type { LucideIcon } from "lucide-react";
import { formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
  destructive: "bg-destructive/12 text-destructive",
} as const;

export function SummaryCard({
  label,
  amount,
  icon: Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  amount: number;
  icon: LucideIcon;
  tone?: keyof typeof TONE;
  hint?: string;
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="num mt-1 text-2xl font-bold">{formatTaka(amount)}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("rounded-xl p-2", TONE[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
