import React, { useEffect, useState } from "react";
import { useTeam } from "../components/Layout";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import {
  Volleyball, Trophy, UsersThree, CalendarBlank,
  ChartLineUp, Fire, ArrowRight, Megaphone
} from "@phosphor-icons/react";

const Stat = ({ label, value, icon: Icon, accent = "orange" }) => (
  <Card className="zentia-card p-5 shadow-none">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{label}</div>
        <div className="font-heading text-4xl font-extrabold mt-2 tracking-tight">{value}</div>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent === "blue" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-600"}`}>
        <Icon size={22} weight="duotone" />
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const { activeTeam } = useTeam() || {};
  const [counts, setCounts] = useState({ players: 0, matches: 0, scheduled: 0, won: 0 });
  const [recent, setRecent] = useState([]);
  const [news, setNews] = useState([]);

  useEffect(() => {
    if (!activeTeam) return;
    (async () => {
      const [p, m, a] = await Promise.all([
        api.get(`/players?team_id=${activeTeam.team_id}`),
        api.get(`/matches?team_id=${activeTeam.team_id}`),
        api.get(`/announcements?team_id=${activeTeam.team_id}`)
      ]);
      const matches = m.data;
      setCounts({
        players: p.data.length,
        matches: matches.length,
        scheduled: matches.filter(x => x.status === "scheduled").length,
        won: matches.filter(x => x.status === "finished" && (x.home ? x.home_score > x.away_score : x.away_score > x.home_score)).length
      });
      setRecent(matches.slice(0, 4));
      setNews(a.data.slice(0, 3));
    })();
  }, [activeTeam]);

  if (!activeTeam) {
    return (
      <Card className="zentia-card p-12 text-center max-w-2xl mx-auto shadow-none">
        <Volleyball size={56} weight="duotone" className="mx-auto text-orange-500 mb-4" />
        <h2 className="font-heading text-3xl font-bold tracking-tight">¡Bienvenido a Zentia VolleyPro!</h2>
        <p className="text-slate-500 mt-2 mb-6">Crea tu primer equipo para empezar a gestionar la temporada.</p>
        <Link to="/teams/new"><Button className="bg-orange-600 hover:bg-orange-700">Crear equipo</Button></Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Hero */}
      <Card className="zentia-card overflow-hidden shadow-none relative">
        <div className="p-8 grid md:grid-cols-3 gap-6 items-center"
          style={{ background: "linear-gradient(135deg, #fff 0%, #FFEDD5 100%)" }}>
          <div className="md:col-span-2">
            <div className="tag-chip mb-3 border-orange-200 text-orange-700">Temporada en curso</div>
            <h2 className="font-heading text-4xl font-extrabold tracking-tight leading-tight">
              {activeTeam.name}
            </h2>
            <p className="text-slate-600 mt-2 max-w-lg">
              Tu cabina de mando. Plantilla, alineaciones, datavolley, comunicación y analítica — sincronizado para todo el cuerpo técnico.
            </p>
            <div className="flex gap-3 mt-5">
              <Link to="/matches"><Button className="bg-orange-600 hover:bg-orange-700 gap-2">Iniciar Datavolley <ArrowRight size={16} weight="bold" /></Button></Link>
              <Link to="/lineup"><Button variant="outline">Diseñar alineación</Button></Link>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Jugadores" value={counts.players} icon={UsersThree} />
        <Stat label="Próximos partidos" value={counts.scheduled} icon={CalendarBlank} accent="blue" />
        <Stat label="Partidos jugados" value={counts.matches} icon={Volleyball} />
        <Stat label="Victorias" value={counts.won} icon={Trophy} accent="blue" />
      </div>

      {/* Recent + News */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="zentia-card p-5 lg:col-span-2 shadow-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold tracking-tight flex items-center gap-2">
              <Fire size={20} weight="duotone" className="text-orange-500" /> Partidos recientes
            </h3>
            <Link to="/matches" className="text-sm text-orange-600 font-semibold hover:underline">Ver todos</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No hay partidos. Crea uno para empezar.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map(m => (
                <div key={m.match_id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{m.home ? activeTeam.name : m.opponent} <span className="text-slate-400">vs</span> {m.home ? m.opponent : activeTeam.name}</div>
                    <div className="text-xs text-slate-500">{m.date} • {m.location || "Por confirmar"}</div>
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

        <Card className="zentia-card p-5 shadow-none">
          <h3 className="font-heading text-lg font-bold tracking-tight flex items-center gap-2 mb-4">
            <Megaphone size={20} weight="duotone" className="text-blue-700" /> Anuncios
          </h3>
          {news.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">Sin novedades.</p>
          ) : news.map(a => (
            <div key={a.announcement_id} className="py-2 border-b border-slate-100 last:border-0">
              <div className="font-semibold text-sm">{a.title}</div>
              <div className="text-xs text-slate-500 line-clamp-2">{a.body}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
