import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHisab, useRefreshHisab } from "@/hooks/useHisab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "সেটিংস — আমার হিসাব" },
      { name: "description", content: "প্রোফাইল, উৎস এবং টেলিগ্রাম নোটিফিকেশন সেটিংস পরিচালনা করুন।" },
      { property: "og:title", content: "সেটিংস — আমার হিসাব" },
      { property: "og:description", content: "অ্যাকাউন্ট, উৎস ও নোটিফিকেশন সেটিংস।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { sources } = useHisab();
  const refresh = useRefreshHisab();

  const [name, setName] = useState("");
  const [newSource, setNewSource] = useState("");
  const [chatId, setChatId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: tg }] = await Promise.all([
        supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("telegram_settings")
          .select("chat_id, notifications_enabled")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setName(profile?.name ?? "");
      setChatId(tg?.chat_id ?? "");
      setEnabled(tg?.notifications_enabled ?? false);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: user.id, name }, { onConflict: "user_id" });
    setBusy(false);
    if (error) toast.error("সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।");
    else toast.success("প্রোফাইল সংরক্ষণ করা হয়েছে।");
  };

  const saveTelegram = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("telegram_settings")
      .upsert(
        { user_id: user.id, chat_id: chatId, notifications_enabled: enabled },
        { onConflict: "user_id" },
      );
    setBusy(false);
    if (error) toast.error("সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।");
    else toast.success("টেলিগ্রাম সেটিংস সংরক্ষণ করা হয়েছে।");
  };

  const addSource = async () => {
    if (!user || !newSource.trim()) return;
    const { error } = await supabase
      .from("sources")
      .insert({ user_id: user.id, name: newSource.trim() });
    if (error) toast.error("এই নামে একটি উৎস আগে থেকেই আছে।");
    else {
      toast.success("উৎস যোগ করা হয়েছে।");
      setNewSource("");
      await refresh();
    }
  };

  const removeSource = async (id: string) => {
    const { error } = await supabase.from("sources").delete().eq("id", id);
    if (error) toast.error("এই উৎসটি লেনদেনে ব্যবহৃত হচ্ছে, মুছে ফেলা যায়নি।");
    else {
      toast.success("উৎস মুছে ফেলা হয়েছে।");
      await refresh();
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">সেটিংস</h1>

      <section className="surface-card space-y-3 p-4">
        <h2 className="text-base font-semibold">প্রোফাইল</h2>
        <div className="space-y-1">
          <Label htmlFor="name">নাম</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">ইমেইল: {user?.email}</p>
        <Button onClick={saveProfile} disabled={busy}>
          সংরক্ষণ করুন
        </Button>
      </section>

      <section className="surface-card space-y-3 p-4">
        <h2 className="text-base font-semibold">উৎস</h2>
        <ul className="divide-y">
          {sources.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2 text-sm">
              {s.name}
              <Button
                variant="ghost"
                size="icon"
                aria-label="মুছে ফেলুন"
                onClick={() => removeSource(s.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            placeholder="নতুন উৎসের নাম"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
          />
          <Button className="gap-1" onClick={addSource}>
            <Plus className="h-4 w-4" /> যোগ করুন
          </Button>
        </div>
      </section>

      <section className="surface-card space-y-3 p-4">
        <h2 className="text-base font-semibold">Telegram নোটিফিকেশন</h2>
        <div className="flex items-center justify-between">
          <Label htmlFor="tg">নোটিফিকেশন চালু</Label>
          <Switch id="tg" checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="chat">Chat ID</Label>
          <Input id="chat" value={chatId} onChange={(e) => setChatId(e.target.value)} />
        </div>
        <Button onClick={saveTelegram} disabled={busy}>
          সংরক্ষণ করুন
        </Button>
      </section>
    </div>
  );
}
