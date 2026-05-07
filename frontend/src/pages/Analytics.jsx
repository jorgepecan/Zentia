import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useTeam } from "../components/Layout";
import { Card } from "../components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { ChartLineUpIcon } from "@phosphor-icons/react";

export default function Analytics() {
  const { activeTeam } = useTeam() || {};
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [players, setPlayers] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    if (!activeTeam) return;
    (async () => {
      const m = await api.get(`/matches?team_id=${activeTeam.team_id}`);
      const p = await api.get(`/players?team_id=${activeTeam.team_id}`);
      setMatches(m.data);
      setPlayers(p.data);
      if (m.data.length && !selected) setSelected(m.data[0].match_id);
    })();
  }, [activeTeam]); // eslint-disable-line

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const { data } = await api.get(`/stats/summary?match_id=${selected}`);
      setSummary(data);
    })();
  }, [selected]);

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  const barData = Object.entries(summary).map(([pid, s]) => {
    const p = players.find(x => x.player_id === pid);
    return { name: p ? `#${p.number} ${p.name.split(" ")[0]}` : pid.slice(0, 6), kills: s.kills, aces: s.aces, blocks: s.blocks, errors: s.errors };
  });

  // team radar
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
        <h2 className="font-heading text-3xl font-bold tracking-tight">Analítica</h2>
        <p className="text-slate-500 text-sm">Visualización de datos por partido.</p>
      </div>

      <Card className="zentia-card p-4 shadow-none flex items-center gap-3 flex-wrap">
        <span className="text-xs uppercase font-bold tracking-widest text-slate-500">Partido</span>
        <Select value={selected || ""} onValueChange={setSelected}>
          <SelectTrigger data-testid="analytics-match-select" className="max-w-sm"><SelectValue placeholder="Selecciona partido" /></SelectTrigger>
          <SelectContent>
            {matches.map(m => <SelectItem key={m.match_id} value={m.match_id}>vs {m.opponent} • {new Date(m.date).toLocaleDateString("es-ES")}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {matches.length === 0 ? (
        <Card className="zentia-card p-12 text-center shadow-none">
          <ChartLineUpIcon size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Crea partidos y registra datos para ver analíticas.</p>
        </Card>
      ) : barData.length === 0 ? (
        <Card className="zentia-card p-12 text-center shadow-none">
          <p className="text-slate-500">Sin estadísticas en este partido todavía.</p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="zentia-card p-5 shadow-none lg:col-span-2">
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

          <Card className="zentia-card p-5 shadow-none">
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
