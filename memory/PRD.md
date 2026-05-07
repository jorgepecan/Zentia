# Zentia VolleyPro — Product Requirements Document

## Original Problem Statement
Hola! Me gustaría crear una aplicación llamada "Zentia VolleyPro" que sea visual, sorprendente y fácil de usar. Que tenga visuales y sea innovadora, competitiva en el mercado y productiva. La app está pensada para entrenadores de voleibol que quieran gestionar sus equipos desde dentro de la app. La idea es que desde la app se pueda hacer datavolley para los partidos, que tenga un apartado para introducir las plantillas, otro para crear las alineaciones de sexteto inicial sobre el campo de voleibol, así como una pestaña de horarios, otra de resultados y un canal de comunicaciones con el equipo. Una app interactiva para usuarios y que los entrenadores sean los "administradores de cada equipo".

## User Choices (Feb 2026)
- **Auth**: Both — Email/Password (JWT) + Emergent Google Auth
- **Roles**: head_coach, assistant_coach, player
- **Datavolley**: Both intermediate (button-based) + advanced (coded)
- **Extras**: All (attendance, announcements, gallery, post-match analytics, season calendar, tactical court)
- **Style**: Light, functional, visual

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async). JWT cookies (httpOnly, secure, samesite=none) + Bearer fallback. Bcrypt password hashing. Emergent OAuth via session_id exchange.
- **Frontend**: React 19 + Tailwind + Shadcn UI + Recharts + @phosphor-icons/react. Sidebar dashboard layout, team selector context. Drag-and-drop lineup with HTML5 API. Sonner for toasts.
- **Design**: Light theme. Outfit (headings) + Manrope (body). Brand orange #EA580C + deep blue #1E3A8A. No purple.

## User Personas
1. **Head Coach (admin)** — full CRUD on team, players, matches, stats, lineups, schedule, announcements.
2. **Assistant Coach** — same as head coach minus team-level admin (currently same access; UI can hide team creation).
3. **Player** — read-only views of plantilla, lineups, schedule, results, announcements; can post in chat.

## Implemented (May 7, 2026)
- ✅ JWT email/password registration + login with cookie auth
- ✅ Emergent Google OAuth via /auth/google/session
- ✅ Team CRUD + member invitation
- ✅ Players CRUD per team
- ✅ Lineups: 6-position court drag-drop, save/load/delete
- ✅ Matches CRUD + score/status updates
- ✅ Datavolley (intermediate) — 12 color-coded action buttons
- ✅ Datavolley (advanced) — code parser (e.g., `01a#hp+`)
- ✅ Live stats summary table per match
- ✅ Schedule (matches + trainings unified timeline)
- ✅ Attendance tracking per training (present/late/excused/absent)
- ✅ Announcements with pin
- ✅ Team chat (5s polling)
- ✅ Multimedia gallery (URL-based)
- ✅ Analytics — bar + radar charts with Recharts
- ✅ Role-based sidebar nav
- ✅ Responsive layout
- ✅ 18/18 backend tests + 100% frontend smoke pass

## Backlog
### P1
- Team-membership authorization on every team-scoped endpoint (currently anyone authenticated can read by id once they know it)
- Tighten CORS to explicit FRONTEND_URL when credentials=True
- Restrict default register role (player) and require coach approval for elevated roles
- Object-storage upload for gallery (currently URL only)
- Real-time websockets for chat/datavolley (currently HTTP polling)
- Heatmaps for attack zones (court overlay)
- Heart-rate / fitness tracking integration

### P2
- Push notifications (PWA + service worker)
- Stripe billing for multi-team SaaS plans
- Player profile pages with season trends
- Tournament/league standings
- Match video upload + timestamped tagging
- Export PDF reports per match (post-game brief for coach)
- Multilenguaje (EN, FR, IT)

## Test Credentials
- admin@zentia.com / ZentiaAdmin2026!  (head_coach)
