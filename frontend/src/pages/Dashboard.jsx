import React, { useEffect, useMemo, useState } from "react";
import { useTeam } from "../components/Layout";
import { api, formatErr } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "../components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Volleyball, Trophy, UsersThree, CalendarBlank,
  Fire, ArrowRight, Megaphone, Plus, CaretLeft, CaretRight,
  ChartBar, Strategy
} from "@phosphor-icons/react";

const StatCard = ({ label, value, icon: Icon, accent = "orange", onClick, testId }) => (
  <Card
    onClick={onClick}
    data-testid={testId}
    className={`zentia-card p-5 ${onClick ? "is-clickable" : ""}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{label}</div>
        <div className="font-heading text-4xl font-extrabold mt-2 tracking-tight">{value}</div>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent === "blue" ? "bg-blue-50/80 text-blue-700" : "bg-orange-50/80 text-orange-600"}`}>
        <Icon size={22} weight="duotone" />
      </div>
    </div>
  </Card>
);

// ------ Weekly Planner ------
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function startOfWeek(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // monday=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function WeeklyPlanner({ teamId, matches, trainings, onChanged }) {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "Entrenamiento", time: "18:00", location: "" });

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = useMemo(() => {
    const evMap = {};
    days.forEach(d => { evMap[d.toDateString()] = []; });
    matches.forEach(m => {
      const d = new Date(m.date);
      const k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
      if (k in evMap) evMap[k].push({ kind: "match", id: m.match_id, date: m.date, title: `vs ${m.opponent}`, location: m.location });
    });
    trainings.forEach(t => {
      const d = new Date(t.date);
      const k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
      if (k in evMap) evMap[k].push({ kind: "training", id: t.training_id, date: t.date, title: t.title, location: t.location });
    });
    return evMap;
  }, [days, matches, trainings]);

  const moveWeek = (delta) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
    setSelected(null);
  };

  const selectedEvents = selected ? (events[selected.toDateString()] || []) : [];

  const createTraining = async (e) => {
    e.preventDefault();
    if (!selected) return;
    const [h, m] = (form.time || "18:00").split(":");
    const dt = new Date(selected);
    dt.setHours(Number(h) || 18, Number(m) || 0, 0, 0);
    try {
      await api.post("/trainings", {
        team_id: teamId,
        title: form.title,
        date: dt.toISOString(),
        location: form.location,
        notes: "",
      });
      toast.success("Entrenamiento añadido");
      setCreating(false);
      setForm({ title: "Entrenamiento", time: "18:00", location: "" });
      onChanged?.();
    } catch (err) { toast.error(formatErr(err)); }
  };

  const weekLabel = `${weekStart.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;

  return (
    <Card className="zentia-card p-5" data-testid="weekly-planner">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Planificador semanal</div>
          <h3 className="font-heading text-lg font-bold tracking-tight">{weekLabel}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button data-testid="planner-prev" variant="outline" size="icon" className="glass-soft border-white/60" onClick={() => moveWeek(-1)}>
            <CaretLeft size={16} weight="bold" />
          </Button>
          <Button data-testid="planner-today" variant="outline" size="sm" className="glass-soft border-white/60" onClick={() => { setWeekStart(startOfWeek(new Date())); setSelected(null); }}>Hoy</Button>
          <Button data-testid="planner-next" variant="outline" size="icon" className="glass-soft border-white/60" onClick={() => moveWeek(1)}>
            <CaretRight size={16} weight="bold" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const evs = events[d.toDateString()] || [];
          const isToday = sameDay(d, today);
          const isSelected = selected && sameDay(selected, d);
          return (
            <button
              key={i}
              data-testid={`planner-day-${i}`}
              onClick={() => setSelected(d)}
              className={`planner-day ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
            >
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">{DAY_LABELS[i]}</div>
              <div className="font-heading text-2xl font-extrabold leading-none">{d.getDate()}</div>
              <div className="flex items-center justify-center gap-0.5 flex-wrap min-h-[10px]">
                {evs.slice(0, 3).map((e, j) => <span key={j} className={`event-dot ${e.kind}`} />)}
                {evs.length > 3 && <span className="text-[9px] font-bold text-slate-500">+{evs.length - 3}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 pt-4 border-t border-white/50">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="font-semibold text-sm">
              {selected.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <Button data-testid="planner-add-training" size="sm" onClick={() => setCreating(true)} className="bg-orange-600 hover:bg-orange-700 gap-1.5">
              <Plus size={14} weight="bold" /> Añadir entrenamiento
            </Button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-slate-500 text-sm py-2">Sin eventos este día.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev) => (
                <div
                  key={`${ev.kind}-${ev.id}`}
                  className="flex items-center gap-3 p-3 glass-soft rounded-xl cursor-pointer"
                  onClick={() => navigate(ev.kind === "match" ? `/matches/${ev.id}` : "/schedule")}
                  data-testid={`planner-event-${ev.id}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ev.kind === "match" ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-700"}`}>
                    {ev.kind === "match" ? <Volleyball size={18} weight="duotone" /> : <CalendarBlank size={18} weight="duotone" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{ev.title}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(ev.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      {ev.location ? ` • ${ev.location}` : ""}
                    </div>
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    {ev.kind === "match" ? "Partido" : "Entreno"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo entrenamiento — {selected?.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</DialogTitle>
          </DialogHeader>
          <form onSubmit={createTraining} className="space-y-3">
            <div><Label>Título</Label><Input data-testid="planner-training-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Hora</Label><Input data-testid="planner-training-time" type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              <div><Label>Lugar</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            <Button type="submit" data-testid="planner-training-submit" className="bg-orange-600 hover:bg-orange-700">Crear entrenamiento</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ------ Dashboard ------
export default function Dashboard() {
  const { activeTeam } = useTeam() || {};
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ players: 0, matches: 0, scheduled: 0, won: 0 });
  const [recent, setRecent] = useState([]);
  const [news, setNews] = useState([]);
  const [matches, setMatches] = useState([]);
  const [trainings, setTrainings] = useState([]);

  const reload = async () => {
    if (!activeTeam) return;
    const [p, m, a, t] = await Promise.all([
      api.get(`/players?team_id=${activeTeam.team_id}`),
      api.get(`/matches?team_id=${activeTeam.team_id}`),
      api.get(`/announcements?team_id=${activeTeam.team_id}`),
      api.get(`/trainings?team_id=${activeTeam.team_id}`),
    ]);
    const ms = m.data;
    setCounts({
      players: p.data.length,
      matches: ms.length,
      scheduled: ms.filter(x => x.status === "scheduled").length,
      won: ms.filter(x => x.status === "finished" && (x.home ? x.home_score > x.away_score : x.away_score > x.home_score)).length
    });
    setRecent(ms.slice(0, 4));
    setNews(a.data.slice(0, 3));
    setMatches(ms);
    setTrainings(t.data);
  };

  useEffect(() => { reload(); /* eslint-disable-line */ }, [activeTeam]);

  if (!activeTeam) {
    return (
      <Card className="zentia-card p-12 text-center max-w-2xl mx-auto">
        <Volleyball size={56} weight="duotone" className="mx-auto text-orange-500 mb-4" />
        <h2 className="font-heading text-3xl font-bold tracking-tight">¡Bienvenido a Zentia VolleyPro!</h2>
        <p className="text-slate-500 mt-2 mb-6">Crea tu primer equipo para empezar a gestionar la temporada.</p>
        <Link to="/teams/new"><Button className="bg-orange-600 hover:bg-orange-700">Crear equipo</Button></Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Weekly Planner — at the very top */}
      <WeeklyPlanner teamId={activeTeam.team_id} matches={matches} trainings={trainings} onChanged={reload} />

      {/* Hero */}
      <Card className="zentia-card overflow-hidden relative">
        <div className="p-8 grid md:grid-cols-3 gap-6 items-center"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,237,213,0.65) 100%)" }}>
          <div className="md:col-span-2">
            <div className="tag-chip mb-3 border-orange-200/80 text-orange-700">Temporada en curso</div>
            <h2 className="font-heading text-4xl font-extrabold tracking-tight leading-tight">
              {activeTeam.name}
            </h2>
            <p className="text-slate-600 mt-2 max-w-lg">
              Tu cabina de mando. Plantilla, alineaciones, datavolley, comunicación y estadísticas — sincronizado para todo el cuerpo técnico.
            </p>
            <div className="flex gap-3 mt-5 flex-wrap">
              <Button data-testid="hero-start-datavolley" onClick={() => navigate("/matches")} className="bg-orange-600 hover:bg-orange-700 gap-2">
                Iniciar Datavolley <ArrowRight size={16} weight="bold" />
              </Button>
              <Button data-testid="hero-design-lineup" variant="outline" onClick={() => navigate("/lineup")} className="glass-soft border-white/60">
                Diseñar alineación
              </Button>
              <Button data-testid="hero-roster" variant="outline" onClick={() => navigate("/roster")} className="glass-soft border-white/60">
                Plantilla
              </Button>
              <Button data-testid="hero-stats" variant="outline" onClick={() => navigate("/analytics")} className="glass-soft border-white/60">
                Estadísticas
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="vp-court mx-auto" style={{ width: "260px", height: "180px" }}>
              <div className="net" />
              {[
                { x: 25, y: 30 }, { x: 50, y: 30 }, { x: 75, y: 30 },
                { x: 25, y: 75 }, { x: 50, y: 75 }, { x: 75, y: 75 },
              ].map((p, i) => (
                <div key={i} className="vp-position" style={{ left: `${p.x}%`, top: `${p.y}%`, width: 32, height: 32, fontSize: 14 }}>{i+1}</div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats - all clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard testId="dash-stat-players" label="Jugadores" value={counts.players} icon={UsersThree} onClick={() => navigate("/roster")} />
        <StatCard testId="dash-stat-scheduled" label="Próximos partidos" value={counts.scheduled} icon={CalendarBlank} accent="blue" onClick={() => navigate("/schedule")} />
        <StatCard testId="dash-stat-played" label="Partidos jugados" value={counts.matches} icon={Volleyball} onClick={() => navigate("/matches")} />
        <StatCard testId="dash-stat-won" label="Victorias" value={counts.won} icon={Trophy} accent="blue" onClick={() => navigate("/results")} />
      </div>

      {/* Recent + News */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="zentia-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold tracking-tight flex items-center gap-2">
              <Fire size={20} weight="duotone" className="text-orange-500" /> Partidos recientes
            </h3>
            <button onClick={() => navigate("/matches")} className="text-sm text-orange-600 font-semibold hover:underline" data-testid="recent-see-all">Ver todos</button>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-3">No hay partidos. Crea uno para empezar.</p>
              <Button onClick={() => navigate("/matches")} size="sm" className="bg-orange-600 hover:bg-orange-700">Crear partido</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map(m => (
                <div
                  key={m.match_id}
                  data-testid={`dash-match-${m.match_id}`}
                  onClick={() => navigate(`/matches/${m.match_id}`)}
                  className="flex items-center justify-between p-3 glass-soft rounded-xl cursor-pointer hover:bg-white/80 transition-all"
                >
                  <div>
                    <div className="font-semibold text-sm">{m.home ? activeTeam.name : m.opponent} <span className="text-slate-400">vs</span> {m.home ? m.opponent : activeTeam.name}</div>
                    <div className="text-xs text-slate-500">{new Date(m.date).toLocaleDateString("es-ES")} • {m.location || "Por confirmar"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-heading font-bold text-lg">{m.home_score} - {m.away_score}</div>
                    <span className={`text-[10px] uppercase font-bold tracking-widest ${m.status === "live" ? "text-red-600" : m.status === "finished" ? "text-emerald-600" : "text-slate-500"}`}>{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="zentia-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold tracking-tight flex items-center gap-2">
              <Megaphone size={20} weight="duotone" className="text-blue-700" /> Anuncios
            </h3>
            <button onClick={() => navigate("/announcements")} className="text-sm text-orange-600 font-semibold hover:underline" data-testid="news-see-all">Ver todos</button>
          </div>
          {news.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm mb-2">Sin novedades.</p>
              <Button onClick={() => navigate("/announcements")} size="sm" variant="outline" className="glass-soft border-white/60">Publicar</Button>
            </div>
          ) : news.map(a => (
            <div
              key={a.announcement_id}
              data-testid={`dash-announcement-${a.announcement_id}`}
              onClick={() => navigate("/announcements")}
              className="py-2 border-b border-white/40 last:border-0 cursor-pointer hover:bg-white/30 -mx-2 px-2 rounded-md transition-colors"
            >
              <div className="font-semibold text-sm">{a.title}</div>
              <div className="text-xs text-slate-500 line-clamp-2">{a.body}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button data-testid="quick-lineup" onClick={() => navigate("/lineup")} variant="outline" className="glass-soft border-white/60 h-14 gap-2">
          <Strategy size={20} weight="duotone" className="text-orange-600" /> Alineación
        </Button>
        <Button data-testid="quick-stats" onClick={() => navigate("/analytics")} variant="outline" className="glass-soft border-white/60 h-14 gap-2">
          <ChartBar size={20} weight="duotone" className="text-blue-700" /> Estadísticas
        </Button>
        <Button data-testid="quick-comms" onClick={() => navigate("/communications")} variant="outline" className="glass-soft border-white/60 h-14 gap-2">
          <Megaphone size={20} weight="duotone" className="text-orange-600" /> Comunicación
        </Button>
        <Button data-testid="quick-attendance" onClick={() => navigate("/attendance")} variant="outline" className="glass-soft border-white/60 h-14 gap-2">
          <UsersThree size={20} weight="duotone" className="text-blue-700" /> Asistencia
        </Button>
      </div>
    </div>
  );
}
