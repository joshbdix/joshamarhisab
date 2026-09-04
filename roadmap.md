# আমার হিসাব — roadmap

## Build (app was reset to template; rebuilding)
- [ ] Design system (styles.css), format/hisab libs, auth hook, data hooks
- [ ] Auth pages (login/signup/forgot/reset) + route guard
- [ ] Dashboard, months list, month detail, reports, search, settings
- [ ] Month/transaction dialogs with edit + delete confirmation
- [ ] Telegram notify + export

## New requests (2026-09-04)
- [ ] Clean all demo/sample financial data (transactions, months, notification_logs); keep schema, RLS, profiles, telegram settings; keep default reusable sources
- [ ] Stop bootstrap_account from seeding sample months/transactions
- [ ] Dynamic month dropdown everywhere from `months` table, chronological sort, Bangla names, no hardcoding
- [ ] "+ নতুন মাস" quick action inside transaction form; auto-select newly created month
- [ ] Empty states: "প্রথমে একটি মাসের হিসাব যোগ করুন", "এই মাসের হিসাব এখনো যোগ করা হয়নি" + "+ এই মাস যোগ করুন"

## GitHub Pages static deployment (2026-09-04)
- [x] Static SPA build via `vite.static.config.ts` (base `/`, outDir `dist`, no SSR/Nitro)
- [x] `index.html` + `src/main.tsx` client entry; `bun run build` → `dist/index.html`, `dist/assets/`, `dist/404.html`
- [x] `public/CNAME` (hisab.joshbdixsports.shop) + `.nojekyll`
- [x] Telegram moved to hosted endpoint `/api/public/telegram-notify` (bot token stays server-side); frontend targets it via `VITE_API_BASE_URL`
- [x] SSR build still available via `bun run build:ssr`
