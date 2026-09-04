import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHisab, useRefreshHisab } from "@/hooks/useHisab";
import { BANGLA_MONTHS, formatMonthLabel, formatTaka } from "@/lib/format";
import type { MonthSummary } from "@/lib/hisab";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MonthDialog({
  open,
  onOpenChange,
  editing,
  defaultYear,
  defaultMonth,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: MonthSummary | null;
  defaultYear?: number;
  defaultMonth?: number;
  onCreated?: (monthId: string) => void;
}) {
  const { months } = useHisab();
  const refresh = useRefreshHisab();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [base, setBase] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [adjType, setAdjType] = useState("increase");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setYear(String(editing.year));
      setMonth(String(editing.month));
      setBase(String(editing.base));
      setAdjustment(String(Math.abs(editing.adjustment)));
      setAdjType(editing.adjustmentType);
      setReason(editing.adjustmentReason ?? "");
      setNote(editing.note ?? "");
    } else {
      setYear(String(defaultYear ?? now.getFullYear()));
      setMonth(String(defaultMonth ?? now.getMonth() + 1));
      setBase("");
      setAdjustment("");
      setAdjType("increase");
      setReason("");
      setNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, defaultYear, defaultMonth]);

  const baseNum = Number(base) || 0;
  const adjNum = Number(adjustment) || 0;
  const finalReceivable = baseNum + (adjType === "decrease" ? -adjNum : adjNum);

  const save = async () => {
    if (!year) return toast.error("বছর দিন।");
    if (!month) return toast.error("মাস নির্বাচন করুন।");
    if (baseNum <= 0) return toast.error("মূল পাওনার পরিমাণ দিন।");

    const duplicate = months.some(
      (m) => m.year === Number(year) && m.month === Number(month) && m.id !== editing?.id,
    );
    if (duplicate) return toast.error("এই মাসের হিসাব আগেই যোগ করা হয়েছে।");

    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        year: Number(year),
        month: Number(month),
        base_receivable: baseNum,
        adjustment_amount: adjNum,
        adjustment_type: adjType,
        adjustment_reason: reason || null,
        note: note || null,
      };

      if (editing) {
        const { error } = await supabase.from("months").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("হিসাব সফলভাবে আপডেট করা হয়েছে।");
      } else {
        const { data, error } = await supabase
          .from("months")
          .insert({ ...payload, user_id: userData.user!.id })
          .select("id")
          .single();
        if (error) {
          if (error.code === "23505") throw new Error("এই মাসের হিসাব আগেই যোগ করা হয়েছে।");
          throw error;
        }
        toast.success("হিসাব সফলভাবে সংরক্ষণ করা হয়েছে।");
        onCreated?.(data.id);
      }
      await refresh();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "মাসের হিসাব সম্পাদনা" : "নতুন মাসের হিসাব"}</DialogTitle>
          <DialogDescription>মাসিক পাওনা ও প্রয়োজনীয় সমন্বয় লিখুন।</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>বছর</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={2000}
                max={2100}
              />
            </div>
            <div className="space-y-2">
              <Label>মাস</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="মাস" />
                </SelectTrigger>
                <SelectContent>
                  {BANGLA_MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>মূল পাওনা (৳)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>সমন্বয় (৳)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>সমন্বয়ের ধরন</Label>
              <Select value={adjType} onValueChange={setAdjType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">বৃদ্ধি</SelectItem>
                  <SelectItem value="decrease">কমানো</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>সমন্বয়ের কারণ</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>নোট</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          <div className="rounded-xl bg-secondary p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">মূল পাওনা</span>
              <span className="num font-medium">{formatTaka(baseNum)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">সমন্বয়</span>
              <span className="num font-medium">
                {adjType === "decrease" ? "-" : "+"}
                {formatTaka(adjNum)}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2">
              <span className="font-medium">চূড়ান্ত পাওনা</span>
              <span className="num font-bold text-primary">{formatTaka(finalReceivable)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatMonthLabel(Number(year), Number(month))}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button onClick={save} disabled={busy}>
            সংরক্ষণ করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
