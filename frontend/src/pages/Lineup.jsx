import React, { useEffect, useRef, useState } from "react";
import { api, formatErr } from "../lib/api";
import { useTeam } from "../components/Layout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { FloppyDiskIcon, TrashIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";

// Volleyball court rotation positions (top half = our side)
// Position numbers from coach's perspective:
// Back row: P5 (left back), P6 (mid back), P1 (right back / server)
// Front row: P4 (left front), P3 (mid front), P2 (right front)
const COURT_SLOTS = [
  { id: "P4", label: "P4", x: 22, y: 32 },
  { id: "P3", label: "P3", x: 50, y: 32 },
  { id: "P2", label: "P2", x: 78, y: 32 },
  { id: "P5", label: "P5", x: 22, y: 75 },
  { id: "P6", label: "P6", x: 50, y: 75 },
  { id: "P1", label: "P1", x: 78, y: 75 },
];

export default function Lineup() {
  const { activeTeam } = useTeam() || {};
  const [players, setPlayers] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [name, setName] = useState("Sexteto inicial");
  const [positions, setPositions] = useState({}); // {P1: player_id, ...}
  const dragId = useRef(null);

  const load = async () => {
    if (!activeTeam) return;
    const [p, l] = await Promise.all([
      api.get(`/players?team_id=${activeTeam.team_id}`),
      api.get(`/lineups?team_id=${activeTeam.team_id}`)
    ]);
    setPlayers(p.data);
    setLineups(l.data);
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, [activeTeam]);

  const playerById = (id) => players.find(p => p.player_id === id);
  const placedIds = Object.values(positions);

  const onSlotDrop = (slot) => {
    if (!dragId.current) return;
    const next = { ...positions };
    // Remove from any other slot
    Object.keys(next).forEach(k => { if (next[k] === dragId.current) delete next[k]; });
    next[slot] = dragId.current;
    setPositions(next);
    dragId.current = null;
  };

  const removeSlot = (slot) => {
    const next = { ...positions };
    delete next[slot];
    setPositions(next);
  };

  const save = async () => {
    if (Object.keys(positions).length !== 6) {
      toast.error("Coloca los 6 jugadores en pista");
      return;
    }
    try {
      await api.post("/lineups", { team_id: activeTeam.team_id, name, positions });
      toast.success("Alineación guardada");
      load();
    } catch (e) { toast.error(formatErr(e)); }
  };

  const loadLineup = (l) => {
    setName(l.name);
    setPositions(l.positions);
  };

  const del = async (id) => {
    await api.delete(`/lineups/${id}`);
    toast.success("Eliminada");
    load();
  };

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  return (
    <div className="max-w-7xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Alineaciones</h2>
          <p className="text-slate-500 text-sm">Arrastra jugadores a las posiciones del sexteto inicial.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input data-testid="lineup-name-input" className="w-56" value={name} onChange={e => setName(e.target.value)} />
          <Button data-testid="save-lineup-btn" onClick={save} className="bg-orange-600 hover:bg-orange-700 gap-2">
            <FloppyDiskIcon size={18} weight="bold" /> Guardar
          </Button>
          <Button variant="outline" onClick={() => setPositions({})} className="gap-2"><ArrowsClockwiseIcon size={16} /> Limpiar</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className="zentia-card p-6 shadow-none">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Pista (vista entrenador)</div>
            <div className="vp-court mx-auto" style={{ aspectRatio: "1.6 / 1", maxWidth: "640px" }}
              data-testid="volleyball-court">
              <div className="three-meter" style={{ top: "50%" }} />
              <div className="net" />
              {COURT_SLOTS.map(slot => {
                const pid = positions[slot.id];
                const player = playerById(pid);
                return (
                  <div
                    key={slot.id}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => onSlotDrop(slot.id)}
                    onClick={() => player && removeSlot(slot.id)}
                    data-testid={`court-slot-${slot.id}`}
                    className={`vp-position ${player ? "" : "empty"}`}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    title={player ? `${player.name} (#${player.number})` : `${slot.label} - vacío`}
                  >
                    {player ? player.number : slot.label}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-slate-500 mt-3 text-center">Click en una posición ocupada para liberarla</div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="zentia-card p-4 shadow-none">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Banquillo</div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {players.length === 0 && <p className="text-slate-500 text-sm">Añade jugadores en Plantilla.</p>}
              {players.map(p => {
                const placed = placedIds.includes(p.player_id);
                return (
                  <div
                    key={p.player_id}
                    draggable
                    onDragStart={() => (dragId.current = p.player_id)}
                    data-testid={`bench-player-${p.player_id}`}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-grab border ${placed ? "bg-orange-50 border-orange-200 opacity-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-heading font-bold text-sm">{p.number}</div>
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.position}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="zentia-card p-4 shadow-none">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Alineaciones guardadas</div>
            {lineups.length === 0 ? <p className="text-slate-500 text-sm">Aún no hay alineaciones.</p> :
              <div className="space-y-1">
                {lineups.map(l => (
                  <div key={l.lineup_id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                    <button onClick={() => loadLineup(l)} className="text-sm font-semibold text-left flex-1">{l.name}</button>
                    <button onClick={() => del(l.lineup_id)} className="text-slate-400 hover:text-red-600"><TrashIcon size={14} /></button>
                  </div>
                ))}
              </div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
