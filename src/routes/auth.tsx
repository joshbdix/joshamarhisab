import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "লগইন — আমার হিসাব" },
      {
        name: "description",
        content: "আমার হিসাব অ্যাকাউন্টে প্রবেশ করুন বা নতুন অ্যাকাউন্ট তৈরি করুন।",
      },
      { property: "og:title", content: "লগইন — আমার হিসাব" },
      { property: "og:description", content: "আপনার পাওনার হিসাব দেখতে লগইন করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/" });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("সফলভাবে লগইন হয়েছে।");
        navigate({ to: "/" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name },
          },
        });
        if (error) throw error;
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে। ইমেইল যাচাই করুন।");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে।");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google দিয়ে লগইন করা যায়নি।");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="surface-card w-full max-w-md p-7">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-2xl font-bold">আমার হিসাব</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "আপনার অ্যাকাউন্টে প্রবেশ করুন"
              : mode === "signup"
                ? "নতুন অ্যাকাউন্ট তৈরি করুন"
                : "পাসওয়ার্ড রিসেট করুন"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">নাম</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">ইমেইল</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "login" ? "লগইন" : mode === "signup" ? "অ্যাকাউন্ট তৈরি করুন" : "রিসেট লিংক পাঠান"}
          </Button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> অথবা <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              Google দিয়ে চালিয়ে যান
            </Button>
          </>
        )}

        <div className="mt-5 space-y-2 text-center text-sm">
          {mode === "login" && (
            <>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setMode("forgot")}
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
              <p className="text-muted-foreground">
                অ্যাকাউন্ট নেই?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setMode("signup")}
                >
                  নতুন অ্যাকাউন্ট
                </button>
              </p>
            </>
          )}
          {mode !== "login" && (
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setMode("login")}
            >
              লগইনে ফিরে যান
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
