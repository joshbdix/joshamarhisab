import { createFileRoute } from "@tanstack/react-router";

// Raw HTTP endpoint for Telegram notifications.
// The static GitHub Pages frontend calls this hosted endpoint with the user's
// Supabase access token, so the bot token never reaches the browser.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/telegram-notify")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: CORS }),
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env["SUPABASE_URL"];
        const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return json({ ok: false, error: "Backend not configured" }, 500);
        }

        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) return json({ ok: false, error: "Unauthorized" }, 401);
        const token = authHeader.slice("Bearer ".length);
        if (token.split(".").length !== 3) return json({ ok: false, error: "Unauthorized" }, 401);

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              headers.set("apikey", SUPABASE_PUBLISHABLE_KEY);
              headers.set("Authorization", authHeader);
              return fetch(input, { ...init, headers });
            },
          },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (claimsError || !userId) return json({ ok: false, error: "Unauthorized" }, 401);

        let payload: { text?: string; type?: string };
        try {
          payload = (await request.json()) as { text?: string; type?: string };
        } catch {
          return json({ ok: false, error: "Invalid payload" }, 400);
        }
        const text = (payload.text ?? "").trim();
        const type = payload.type ?? "transaction";
        if (!text) return json({ ok: false, error: "Invalid payload" }, 400);

        const { data: settings } = await supabase
          .from("telegram_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!settings?.notifications_enabled || !settings.bot_token || !settings.chat_id) {
          return json({ ok: false, skipped: true });
        }
        if (type === "transaction" && !settings.transaction_notifications) {
          return json({ ok: false, skipped: true });
        }

        let ok = false;
        let errorMessage: string | null = null;
        try {
          const res = await fetch(
            `https://api.telegram.org/bot${settings.bot_token}/sendMessage`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ chat_id: settings.chat_id, text, parse_mode: "HTML" }),
            },
          );
          const result = (await res.json()) as { ok?: boolean; description?: string };
          ok = !!result.ok;
          if (!ok) errorMessage = result.description ?? "Telegram API error";
        } catch (err) {
          errorMessage = err instanceof Error ? err.message : "Telegram request failed";
        }

        await supabase.from("notification_logs").insert({
          user_id: userId,
          type,
          status: ok ? "success" : "failed",
          message: text,
          error_message: errorMessage,
        });

        return json({ ok, error: errorMessage });
      },
    },
  },
});
