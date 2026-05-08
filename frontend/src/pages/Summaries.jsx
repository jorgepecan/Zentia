import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useTeam } from "../components/Layout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table } from "@phosphor-icons/react";

const COLS = [
  { key: "matches_played", label: "PJ", desc: "Partidos jugados" },
  { key: "kills", label: "K", desc: "Kills" },
  { key: "atk_errors", label: "EAt", desc: "Errores ataque" },
  { key: "kill_pct", label: "K%", desc: "% kills sobre ataques", computed: (s) => s.attacks > 0 ? Math.round((s.kills / s.attacks) * 100) + "%" : "—" },
  { key: "aces", label: "A", desc: "Aces" },
  { key: "serve_errors", label: "ES", desc: "Errores saque" },
  { key: "blocks", label: "B", desc: "Bloqueos" },
  { key: "digs", label: "D", desc: "Defensas" },
  { key: "receptions", label: "R", desc: "Recepciones" },
  { key: "rec_excellent", label: "R#", desc: "Recep #" },
  { key: "rec_perfect", label: "R+", desc: "Recep +" },
  { key: "rec_ok", label: "R!", desc: "Recep !" },
  { key: "rec_errors", label: "ER", desc: "Errores recep" },
  { key: "reception_pct", label: "%R", desc: "% recep positivas", suffix: "%" },
  { key: "errors", label: "Err", desc: "Errores totales", color: "text-red-600" },
  { key: "total", label: "Tot", desc: "Acciones totales", strong: true },
];

export default function Summaries() {
  const { activeTeam } = useTeam() || {};
  const [players, setPlayers] = useState([]);
  const [summary, setSummary] = useState({});
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!activeTeam) return;
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        api.get(`/players?team_id=${activeTeam.team_id}`),
        api.get(`/stats/team-summary?team_id=${activeTeam.team_id}`),
      ]);
      setPlayers(p.data.sort((a, b) => a.number - b.number));
      setSummary(s.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, [activeTeam]);

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  const empty = {
    matches_played: 0, total: 0, attacks: 0, kills: 0, atk_errors: 0,
    serves: 0, aces: 0, serve_errors: 0, blocks: 0, block_errors: 0,
    digs: 0, receptions: 0, rec_excellent: 0, rec_perfect: 0, rec_ok: 0, rec_errors: 0,
    sets: 0, set_errors: 0, errors: 0, reception_pct: 0, attack_pct: 0,
  };

  const rows = players
    .filter(p => filter ? p.name.toLowerCase().includes(filter.toLowerCase()) || String(p.number).includes(filter) : true)
    .map(p => ({ player: p, stats: summary[p.player_id] || empty }));

  // Totals row
  const totalsRow = rows.reduce((acc, r) => {
    Object.keys(acc).forEach(k => {
      if (typeof acc[k] === "number") acc[k] += r.stats[k] || 0;
    });
    return acc;
  }, { ...empty });
  if (totalsRow.receptions > 0) {
    totalsRow.reception_pct = Math.round(((totalsRow.rec_excellent + totalsRow.rec_perfect) / totalsRow.receptions) * 1000) / 10;
  }
  if (totalsRow.attacks > 0) {
    totalsRow.attack_pct = Math.round(((totalsRow.kills - totalsRow.atk_errors) / totalsRow.attacks) * 1000) / 10;
  }

  return (
    <div className="max-w-[1400px] space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Resúmenes data</h2>
          <p className="text-slate-500 text-sm">Estadística completa por jugadora — agregada de todos los partidos del equipo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            data-testid="summaries-filter"
            placeholder="Filtrar por nombre o dorsal…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-64 glass-soft border-white/60"
          />
          <Button data-testid="summaries-refresh" variant="outline" onClick={load} className="glass-soft border-white/60">
            Actualizar
          </Button>
        </div>
      </div>

      {/* Legend */}
      <Card className="zentia-card p-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mr-2">Leyenda</span>
          {COLS.map(c => (
            <span key={c.key} className="px-2 py-1 rounded-md glass-soft border-white/60" title={c.desc}>
              <strong>{c.label}</strong> · <span className="text-slate-500">{c.desc}</span>
            </span>
          ))}
        </div>
      </Card>

      <Card className="zentia-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Cargando…</div>
        ) : players.length === 0 ? (
          <div className="p-12 text-center">
            <Table size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Aún no hay jugadores en la plantilla.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" data-testid="summaries-table-wrap">
            <table className="w-full text-sm" data-testid="summaries-table">
              <thead className="bg-white/40 backdrop-blur-md sticky top-0">
                <tr className="text-left text-[10px] uppercase tracking-widest text-slate-600">
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Jugadora</th>
                  <th className="px-3 py-3">Pos.</th>
                  {COLS.map(c => (
                    <th key={c.key} className="px-3 py-3 text-center" title={c.desc}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ player: p, stats: s }) => (
                  <tr key={p.player_id} data-testid={`summaries-row-${p.player_id}`} className="border-t border-white/40 hover:bg-white/40 transition-colors">
                    <td className="px-3 py-3 font-heading font-bold text-orange-700">{p.number}</td>
                    <td className="px-3 py-3 font-semibold">{p.name}</td>
                    <td className="px-3 py-3 text-slate-500 text-xs">{p.position}</td>
                    {COLS.map(c => {
                      let val = s[c.key];
                      if (c.computed) val = c.computed(s);
                      else if (c.suffix === "%") val = `${val}%`;
                      const cls = c.color || "";
                      const fw = c.strong ? "font-bold" : "";
                      return <td key={c.key} className={`px-3 py-3 text-center ${cls} ${fw}`}>{val == null || val === 0 && c.key !== "matches_played" ? <span className="text-slate-300">·</span> : val}</td>;
                    })}
                  </tr>
                ))}
                {/* Totals row */}
                {rows.length > 0 && (
                  <tr className="border-t-2 border-orange-300 bg-orange-50/40 font-semibold">
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 font-heading font-bold uppercase tracking-widest text-orange-700 text-xs">Total equipo</td>
                    <td className="px-3 py-3"></td>
                    {COLS.map(c => {
                      let val = totalsRow[c.key];
                      if (c.computed) val = c.computed(totalsRow);
                      else if (c.suffix === "%") val = `${val}%`;
                      return <td key={c.key} className="px-3 py-3 text-center">{val == null ? "·" : val}</td>;
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
