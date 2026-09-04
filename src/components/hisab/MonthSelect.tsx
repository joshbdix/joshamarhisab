import { useState } from "react";
import { Plus } from "lucide-react";
import { useHisab } from "@/hooks/useHisab";
import { formatMonthLabel } from "@/lib/format";
import { MonthDialog } from "@/components/hisab/MonthDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ALL_MONTHS = "__all__";

/**
 * Month picker. The option list always comes from the user's `months` table
 * (chronologically sorted) — never a hardcoded list of months.
 */
export function MonthSelect({
  value,
  onChange,
  allowAll = false,
  allowCreate = true,
  placeholder = "মাস নির্বাচন করুন",
}: {
  value: string;
  onChange: (v: string) => void;
  allowAll?: boolean;
  allowCreate?: boolean;
  placeholder?: string;
}) {
  const { summaries } = useHisab();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange} disabled={!allowAll && !summaries.length}>
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={summaries.length ? placeholder : "প্রথমে একটি মাসের হিসাব যোগ করুন"}
          />
        </SelectTrigger>
        <SelectContent>
          {allowAll && <SelectItem value={ALL_MONTHS}>সব মাস</SelectItem>}
          {summaries.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {formatMonthLabel(s.year, s.month)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {allowCreate && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1 whitespace-nowrap"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" /> নতুন মাস
          </Button>
          <MonthDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={(id) => onChange(id)}
          />
        </>
      )}
    </div>
  );
}
