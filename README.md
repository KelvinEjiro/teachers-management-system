# Teachers Management System

MERN app for staff duty rosters, the management assembly rotation and (next) timetables.

- **Backend/** Express 5 + Mongoose 9 (JWT auth, optional Upstash rate limiting)
- **Frontend/** React + Vite, Tailwind 4, DaisyUI 5 (`aqua` theme), react-hot-toast

## Run it

```bash
# 1. API
cd Backend
cp .env.example .env      # set JWT_SECRET; MongoDB defaults to local
npm install
npm run dev               # http://localhost:5000

# 2. Web app (new terminal)
cd Frontend
npm install
npm run dev               # http://localhost:5173  (proxies /api to :5000)
```

Open the app: on a fresh database it asks you to create the first administrator.

## Roster rules (Backend/src/services/dutyRules.js)

- Morning duty 7:00am–3:00pm, evening duty 5:00pm–8:30pm, every day
- Male staff never take evening duty (all-girls school)
- Weekend duty only for staff flagged "stays on compound"
- Management staff are excluded from duty and rotate on the assembly roster instead
- Assembly: principal → VP admin → VP academics → senior dean → junior dean, one whole week each

Run the rule tests with `cd Backend && npm test`.
# teachers-management-system
