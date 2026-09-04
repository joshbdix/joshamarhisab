import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHisab, useRefreshHisab } from "@/hooks/useHisab";
import { buildSummaries, type TransactionRow } from "@/lib/hisab";
import { buildTransactionMessage, notifyTelegram } from "@/lib/notify";
import { MonthSelect } from "@/components/hisab/MonthSelect";
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

export function TransactionDialog({
  open,
  onOpenChange,
  editing,
  defaultMonthId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: TransactionRow | null;
  defaultMonthId?: string;
}) {
  const { months, sources, summaries } = useHisab();
  const refresh = useRefreshHisab();
  const [date, setDate] = useState("");
  const [monthId, setMonthId] = useState("");
  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDate(editing.transaction_date);
      setMonthId(editing.month_id);
      setAmount(String(Number(editing.amount)));
      setSourceId(editing.source_id ?? "");
      setDescription(editing.description ?? "");
      setNote(editing.note ?? "");
    } else {
      const now = new Date();
      const currentKey = now.getFullYear() * 12 + (now.getMonth() + 1);
      const current = summaries.find((s) => s.sortKey === currentKey);
      setDate(now.toISOString().slice(0, 10));
      setMonthId(defaultMonthId ?? current?.id ?? summaries[summaries.length - 1]?.id ?? "");
      setAmount("");
      setSourceId(sources[0]?.id ?? "");
      setDescription("");
      setNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, defaultMonthId]);

  const save = async () => {
    const amountNum = Number(amount);
    if (!date) return toast.error("তারিখ নির্বাচন করুন।");
    if (!monthId) return toast.error("প্রথমে একটি মাসের হিসাব যোগ করুন।");
    if (!amountNum || amountNum <= 0) return toast.error("টাকার পরিমাণ দিন।");
    if (!sourceId) return toast.error("উৎস নির্বাচন করুন।");

    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        transaction_date: date,
        month_id: monthId,
        amount: amountNum,
        source_id: sourceId,
        description: description || null,
        note: note || null,
      };

      if (editing) {
        const { error } = await supabase.from("transactions").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("হিসাব সফলভাবে আপডেট করা হয়েছে।");
      } else {
        const { error } = await supabase
          .from("transactions")
          .insert({ ...payload, user_id: userData.user!.id });
        if (error) throw error;
        toast.success("হিসাব সফলভাবে সংরক্ষণ করা হয়েছে।");
      }

      const fresh = await supabase.from("transactions").select("*");
      const nextSummaries = buildSummaries(months, (fresh.data ?? []) as TransactionRow[]);
      const monthSummary = nextSummaries.find((s) => s.id === monthId);
      if (monthSummary) {
        const overall = nextSummaries.reduce((sum, s) => sum + s.remaining, 0);
        const sourceName = sources.find((s) => s.id === sourceId)?.name ?? "অন্যান্য";
        const res = await notifyTelegram(
          buildTransactionMessage(
            { date, amount: amountNum, source: sourceName, action: editing ? "updated" : "added" },
            monthSummary,
            overall,
          ),
        );
        if (res.ok) toast.success("Telegram নোটিফিকেশন পাঠানো হয়েছে।");
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
          <DialogTitle>{editing ? "লেনদেন সম্পাদনা" : "টাকা নেওয়া যোগ করুন"}</DialogTitle>
          <DialogDescription>কোন মাসের হিসাবে কত টাকা নেওয়া হয়েছে লিখুন।</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>মাস</Label>
            <MonthSelect value={monthId} onChange={setMonthId} />
            {!summaries.length && (
              <p className="text-xs text-destructive">প্রথমে একটি মাসের হিসাব যোগ করুন</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>তারিখ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>পরিমাণ (৳)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>উৎস</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="উৎস নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>বিবরণ</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>নোট</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button onClick={save} disabled={busy || !summaries.length}>
            সংরক্ষণ করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
