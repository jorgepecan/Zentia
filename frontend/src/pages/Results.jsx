import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useTeam } from "../components/Layout";
import { Card } from "../components/ui/card";
import { TrophyIcon } from "@phosphor-icons/react";

export default function Results() {
  const { activeTeam } = useTeam() || {};
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    if (!activeTeam) return;
    (async () => {
      const { data } = await api.get(`/matches?team_id=${activeTeam.team_id}`);
      setMatches(data.filter(m => m.status === "finished"));
    })();
  }, [activeTeam]);

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  const won = matches.filter(m => m.home ? m.home_score > m.away_score : m.away_score > m.home_score).length;
  const lost = matches.length - won;

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h2 className="font-heading text-3xl font-bold tracking-tight">Resultados</h2>
        <p className="text-slate-500 text-sm">Histórico de partidos finalizados.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="zentia-card p-5 shadow-none">
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Jugados</div>
          <div className="font-heading text-4xl font-extrabold">{matches.length}</div>
        </Card>
        <Card className="zentia-card p-5 shadow-none">
          <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Victorias</div>
          <div className="font-heading text-4xl font-extrabold text-emerald-600">{won}</div>
        </Card>
        <Card className="zentia-card p-5 shadow-none">
          <div className="text-[10px] uppercase font-bold tracking-widest text-red-600">Derrotas</div>
          <div className="font-heading text-4xl font-extrabold text-red-600">{lost}</div>
        </Card>
      </div>

      {matches.length === 0 ? (
        <Card className="zentia-card p-12 text-center shadow-none">
          <TrophyIcon size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Aún no hay resultados.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {matches.map(m => {
            const win = m.home ? m.home_score > m.away_score : m.away_score > m.home_score;
            return (
              <Card key={m.match_id} className="zentia-card p-4 shadow-none flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">{new Date(m.date).toLocaleDateString("es-ES")}</div>
                  <div className="font-heading font-bold">{m.home ? activeTeam.name : m.opponent} <span className="text-slate-400">vs</span> {m.home ? m.opponent : activeTeam.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-heading font-extrabold text-2xl">{m.home_score} - {m.away_score}</div>
                  <span className={`text-[10px] uppercase font-bold tracking-widest ${win ? "text-emerald-600" : "text-red-600"}`}>{win ? "Victoria" : "Derrota"}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
