import React, { useEffect, useState } from "react";
import { api, formatErr } from "../lib/api";
import { useTeam } from "../components/Layout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { ChartLineUp } from "@phosphor-icons/react";
import { toast } from "sonner";

const REC_BUTTONS = [
  { id: "rec_excellent", label: "rece#", action: "reception", quality: "kill", cls: "dv-btn-perfect", desc: "Recepción perfecta" },
  { id: "rec_perfect", label: "rece+", action: "reception", quality: "perfect", cls: "dv-btn-kill", desc: "Recepción positiva" },
  { id: "rec_ok", label: "rece!", action: "reception", quality: "medium", cls: "dv-btn-medium", desc: "Recepción aceptable" },
];

export default function Analytics() {
  const { activeTeam } = useTeam() || {};
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [players, setPlayers] = useState([]);
  const [summary, setSummary] = useState({});
  const [activePlayer, setActivePlayer] = useState(null);

  useEffect(() => {
    if (!activeTeam) return;
    (async () => {
      const m = await api.get(`/matches?team_id=${activeTeam.team_id}`);
      const p = await api.get(`/players?team_id=${activeTeam.team_id}`);
      setMatches(m.data);
      setPlayers(p.data.sort((a,b)=>a.number-b.number));
      if (m.data.length && !selected) setSelected(m.data[0].match_id);
    })();
  }, [activeTeam]); // eslint-disable-line

  const refreshSummary = async (matchId) => {
    const { data } = await api.get(`/stats/summary?match_id=${matchId}`);
    setSummary(data);
  };

  useEffect(() => {
    if (!selected) return;
    refreshSummary(selected);
  }, [selected]);

  const logReception = async (btn) => {
    if (!selected) { toast.error("Selecciona un partido"); return; }
    if (!activePlayer) { toast.error("Selecciona un jugador"); return; }
    try {
      await api.post("/stats", {
        match_id: selected,
        player_id: activePlayer,
        set_number: 1,
        action: btn.action,
        quality: btn.quality,
      });
      toast.success(`${btn.label} • #${players.find(p => p.player_id === activePlayer)?.number}`);
      refreshSummary(selected);
    } catch (e) { toast.error(formatErr(e)); }
  };

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  const barData = Object.entries(summary).map(([pid, s]) => {
    const p = players.find(x => x.player_id === pid);
    return { name: p ? `#${p.number} ${p.name.split(" ")[0]}` : pid.slice(0, 6), kills: s.kills, aces: s.aces, blocks: s.blocks, errors: s.errors };
  });

  const totals = Object.values(summary).reduce((acc, s) => ({
    kills: acc.kills + s.kills, aces: acc.aces + s.aces, blocks: acc.blocks + s.blocks,
    digs: acc.digs + s.digs, errors: acc.errors + s.errors
  }), { kills: 0, aces: 0, blocks: 0, digs: 0, errors: 0 });

  const radarData = [
    { axis: "Kills", val: totals.kills },
    { axis: "Aces", val: totals.aces },
    { axis: "Bloqueos", val: totals.blocks },
    { axis: "Defensas", val: totals.digs },
  ];

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h2 className="font-heading text-3xl font-bold tracking-tight">Estadísticas</h2>
        <p className="text-slate-500 text-sm">Visualización de datos por partido y registro rápido de recepciones.</p>
      </div>

      <Card className="zentia-card p-4 flex items-center gap-3 flex-wrap">
        <span className="text-xs uppercase font-bold tracking-widest text-slate-500">Partido</span>
        <Select value={selected || ""} onValueChange={setSelected}>
          <SelectTrigger data-testid="analytics-match-select" className="max-w-sm glass-soft border-white/60"><SelectValue placeholder="Selecciona partido" /></SelectTrigger>
          <SelectContent>
            {matches.map(m => <SelectItem key={m.match_id} value={m.match_id}>vs {m.opponent} • {new Date(m.date).toLocaleDateString("es-ES")}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {/* Quick reception input */}
      {selected && (
        <Card className="zentia-card p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Registro rápido — Recepción</div>
              <h3 className="font-heading font-bold text-base">Selecciona jugador y pulsa la calidad de la recepción</h3>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-4">
            {players.map(p => (
              <button
                key={p.player_id}
                data-testid={`stats-player-${p.player_id}`}
                onClick={() => setActivePlayer(p.player_id)}
                className={`p-2 rounded-xl border text-center transition-all ${activePlayer === p.player_id ? "border-orange-500 bg-orange-50/80 ring-2 ring-orange-300" : "border-white/60 glass-soft hover:bg-white/80"}`}
              >
                <div className="font-heading font-bold text-xl">{p.number}</div>
                <div className="text-[10px] truncate font-semibold">{p.name.split(" ")[0]}</div>
              </button>
            ))}
            {players.length === 0 && <p className="col-span-full text-slate-500 text-sm">Añade jugadores en Plantilla.</p>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {REC_BUTTONS.map(b => (
              <button
                key={b.id}
                data-testid={`stats-${b.id}`}
                onClick={() => logReception(b)}
                className={`dv-btn ${b.cls} flex flex-col items-center justify-center py-3`}
                title={b.desc}
              >
                <span className="text-lg">{b.label}</span>
                <span className="text-[9px] mt-1 opacity-90 normal-case tracking-normal font-medium">{b.desc}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {matches.length === 0 ? (
        <Card className="zentia-card p-12 text-center">
          <ChartLineUp size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Crea partidos y registra datos para ver estadísticas.</p>
        </Card>
      ) : barData.length === 0 ? (
        <Card className="zentia-card p-12 text-center">
          <p className="text-slate-500">Sin estadísticas en este partido todavía.</p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="zentia-card p-5 lg:col-span-2">
            <h3 className="font-heading font-bold mb-4">Acciones por jugador</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="kills" fill="#16A34A" />
                <Bar dataKey="aces" fill="#15803D" />
                <Bar dataKey="blocks" fill="#2563EB" />
                <Bar dataKey="errors" fill="#DC2626" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="zentia-card p-5">
            <h3 className="font-heading font-bold mb-4">Perfil de equipo</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar name="Total" dataKey="val" stroke="#EA580C" fill="#EA580C" fillOpacity={0.45} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
