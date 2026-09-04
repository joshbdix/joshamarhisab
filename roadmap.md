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
