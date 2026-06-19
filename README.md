# ADVBench

Advanced Delivery & Visibility Bench for ERPNext-focused project and delivery teams.

## Run locally

```bash
npm install
npm run dev
```

Configure `VITE_ERPNEXT_BASE_URL` in `.env.local` if you want the app to talk to a live ERPNext instance.
If you are enabling chat, run `npm run setup:erpnext-chat` once against the ERPNext instance to create the required custom doctypes.

## What is included

- Mobile-first responsive product shell
- Executive dashboard
- Projects, tasks, team, activity, and deadline views
- Chat rooms, direct messages, and project group conversations
- Search-driven task filtering
- Strong visual foundation for expanding into routing, API integration, and role-based workflows
