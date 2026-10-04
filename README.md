# 🚕 RidePair

**Safe, verified campus ride-sharing.** Going to the railway station at 5 PM? So are four other
students from your college. RidePair finds them, ranks them, and splits the fare.

Built to the Stitch **“Campus Ride Utility”** design system — emerald primary, indigo secondary,
Plus Jakarta Sans + Inter, 8-point grid.

---

## Run it

**Two terminals.**

```bash
# terminal 1 — backend (API on :8000)
pip install -r requirements.txt
python seed.py                                   # demo students + rides
python -m uvicorn backend.main:app --reload

# terminal 2 — frontend (React dev server on :5173)
cd frontend
npm install
npm run dev
```

Open **http://127.0.0.1:5173** — `/api` calls proxy to the backend automatically.

### One-server production mode

```bash
cd frontend && npm run build      # emits ../static_react
# then just run the backend — it serves the built app
```

Open **http://127.0.0.1:8000**. API docs live at **/docs**.

### Demo logins (password for all: `ridepair123`)

| Email | Who | Why they matter in the demo |
|---|---|---|
| `priya@lpu.in`  | CS ’26, ★4.9, 8 rides hosted | Hosts the 5:00 PM Innova to Jalandhar station |
| `rahul@lpu.in`  | Mechanical ’25 | The searcher — log in as Rahul to see matches |
| `aman@lpu.in`   | Electronics ’27 | Needs a ride at 5:15 PM → the 92% match |
| `simran@lpu.in` | Biotech ’26 | Has a **same-gender-only** ride (invisible to male students) |
| `arjun@lpu.in`  | CS ’26, ★5.0, 14 rides | Hosts the 4:30 AM Delhi airport run |

---

## Screens

| Route | Screen |
|---|---|
| `/` | Landing — live campus stats, hub search, high-frequency runs, safety, 3 steps |
| `/auth` | Split-screen register / login with college-email verification |
| `/find` | Ranked matches with quick filters and a live savings panel |
| `/post` | Three-step post form with a live student-feed preview |
| `/ride/:id` | Route timeline, vehicle roster, fare breakdown, join |
| `/dashboard` | Metric ribbon, upcoming vs past rides, roster, campus impact |
| `/how-it-works` | The scoring formula, explained |

---

## What makes it different

Two modes, **one matching engine**:

| You are | You match with | Result |
|---|---|---|
| Looking for a ride | someone **offering** seats | Take a seat in their cab |
| Looking for a ride | someone **also looking** | Group up, split one cab |
| Offering seats | students **looking** | Fill your empty seats |

That middle row is the part other ride-share apps don't do. They can only connect a rider to a
driver. RidePair also connects riders **to each other**, so four students who between them own no
car still leave campus in a single cab.

### The matching engine

Rides aren't filtered, they're **scored and ranked** out of 100:

```
score = 45 × time_proximity      (how close the departure times are)
      + 20 × destination_match   (exact hub, or shared-vocabulary fallback)
      + 15 × pickup_proximity    (same campus gate?)
      + 12 × seat_fit            (does the group physically fit?)
      +  8 × luggage_fit         (room for the bags they're bringing?)

time_proximity = max(0, 1 − Δminutes / flex_window)
```

`flex_window` is whichever side is **more** flexible, so a student who says “±1 hour” genuinely
sees more matches. Every score is explained in the UI — tap **“How we scored this”** on any card.

### Trust & safety

- **College email required** — a closed, verified campus network, not a public app
- **Phone numbers hidden** until both sides are confirmed on the same ride
- **Same-gender-only rides** are invisible to everyone else, and rejected server-side on join
- Seats decrement in one transaction, so a cab can never be oversold

---

## Architecture

```
React 19 + Vite + Tailwind 4 + Framer Motion + React Router 7
    ↕  fetch() + JSON, Bearer token   (dev: Vite proxies /api → :8000)
FastAPI (Python)
    ↕  SQLAlchemy
SQLite  (ridepair.db — one file)
```

```
backend/
├── config.py     ← college domain, hubs, fares, vehicles, luggage, weights
├── database.py   ← connection (swap one line for Postgres)
├── models.py     ← User, Ride, RideJoin
├── schemas.py    ← request/response validation
├── auth.py       ← PBKDF2 hashing, JWT, college-email gate
├── matching.py   ← the scoring engine
├── routers/      ← users.py, rides.py
└── main.py       ← API + serves the built React app
frontend/
├── src/pages/       ← the seven screens
├── src/components/  ← ui kit, MatchCard, RouteSpine, Header, Footer
├── src/context/     ← Auth, Meta, Toast
├── src/lib/         ← api client, formatters
└── smoke.mjs        ← render smoke test (npm run smoke)
seed.py           ← 12 students, 17 rides, existing groups
```

### Making it yours

Everything campus-specific lives in **`backend/config.py`**: email domain, college name, pickup
points, transit hubs with fares and travel times, vehicle types, luggage options and the scoring
weights. Change it, re-run `python seed.py`, restart the server.

> If signup ever blocks you during a demo, set `ENFORCE_COLLEGE_EMAIL = False`.

### Scaling past one campus

- SQLite → Postgres is a one-line change in `database.py`
- Auth is **stateless JWT**, so the API scales horizontally with no shared session store
- Composite index on `(to_location, ride_date, status)` keeps matching fast
- The DB does the cheap filtering; scoring only runs on the handful of rides that survive
- Matching is **per-campus**, so load partitions naturally college by college

---

## API

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup` | register (college email enforced) |
| `POST` | `/api/auth/login` | get a token |
| `GET`  | `/api/auth/me` | current user |
| `GET`  | `/api/meta` | hubs, pickup points, vehicles, luggage, weights |
| `GET`  | `/api/rides/campus-stats` | public landing-page stats |
| `POST` | `/api/rides` | post an offer or a seek |
| `POST` | `/api/rides/match` | **ranked matches** |
| `GET`  | `/api/rides/{id}` | full ride detail |
| `POST` | `/api/rides/{id}/join` | take a seat |
| `GET`  | `/api/rides/dashboard` | upcoming, past, savings, CO₂ |

---

## Testing

```bash
cd frontend && npm run smoke     # backend must be running
```

Pulls real payloads from the live API, mounts all seven routes in jsdom, and fails if any screen
crashes or loses its key content — the white-screen bug class a production build compiles happily.

---

## Demo script (90 seconds)

1. **Problem** — “I paid ₹700 alone to Jalandhar station. Three classmates went within 40 minutes. Also alone.”
2. Landing page — live campus stats, then search *Uni Mall → Jalandhar City Railway Station, 5:20 PM*.
3. Log in as **rahul** (Quick fill demo student) → ranked board appears:
   **92% group-up with Aman**, then **Priya's cab at 70%**.
4. Tap **“How we scored this”** — the five weighted bars, live.
5. **Request to join** → confetti-free but instant: seat decrements, contact unlocks.
6. **My Rides** → money saved, CO₂ offset, trust rating, full co-rider roster.
7. **Close** — “One campus is 30,000 students. Every college in India has this problem.”

Run the demo on **seeded data**, never an empty database.
