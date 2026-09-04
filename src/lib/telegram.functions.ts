import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendTelegramMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ text: z.string().min(1), type: z.string().default("transaction") }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: settings } = await supabase
      .from("telegram_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!settings?.notifications_enabled || !settings.bot_token || !settings.chat_id) {
      return { ok: false, skipped: true as const };
    }
    if (data.type === "transaction" && !settings.transaction_notifications) {
      return { ok: false, skipped: true as const };
    }

    let ok = false;
    let errorMessage: string | null = null;
    try {
      const res = await fetch(`https://api.telegram.org/bot${settings.bot_token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: settings.chat_id,
          text: data.text,
          parse_mode: "HTML",
        }),
      });
      const json = (await res.json()) as { ok?: boolean; description?: string };
      ok = !!json.ok;
      if (!ok) errorMessage = json.description ?? "Telegram API error";
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : "Telegram request failed";
    }

    await supabase.from("notification_logs").insert({
      user_id: userId,
      type: data.type,
      status: ok ? "success" : "failed",
      message: data.text,
      error_message: errorMessage,
    });

    return { ok, error: errorMessage };
  });
