import React, { useEffect, useState } from "react";
import { api, formatErr } from "../lib/api";
import { useTeam } from "../components/Layout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { CheckCircleIcon, XCircleIcon, ClockIcon, ClipboardTextIcon } from "@phosphor-icons/react";

const STATUSES = [
  { v: "present", l: "Presente", icon: CheckCircleIcon, color: "text-emerald-600" },
  { v: "late", l: "Tarde", icon: ClockIcon, color: "text-amber-600" },
  { v: "excused", l: "Justificado", icon: ClockIcon, color: "text-blue-600" },
  { v: "absent", l: "Ausente", icon: XCircleIcon, color: "text-red-600" },
];

export default function Attendance() {
  const { activeTeam } = useTeam() || {};
  const [trainings, setTrainings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [players, setPlayers] = useState([]);
  const [att, setAtt] = useState({});

  const loadAll = async () => {
    if (!activeTeam) return;
    const [t, p] = await Promise.all([
      api.get(`/trainings?team_id=${activeTeam.team_id}`),
      api.get(`/players?team_id=${activeTeam.team_id}`)
    ]);
    setTrainings(t.data);
    setPlayers(p.data.sort((a,b) => a.number - b.number));
    if (t.data.length && !selected) setSelected(t.data[0].training_id);
  };
  useEffect(() => { loadAll(); /* eslint-disable-line */ }, [activeTeam]);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const { data } = await api.get(`/attendance?training_id=${selected}`);
      const map = {};
      data.forEach(a => { map[a.player_id] = a.status; });
      setAtt(map);
    })();
  }, [selected]);

  const mark = async (player_id, status) => {
    setAtt(prev => ({ ...prev, [player_id]: status }));
    try { await api.post("/attendance", { training_id: selected, player_id, status }); }
    catch (e) { toast.error(formatErr(e)); }
  };

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h2 className="font-heading text-3xl font-bold tracking-tight">Asistencia</h2>
        <p className="text-slate-500 text-sm">Registro de presencias en entrenamientos.</p>
      </div>

      <Card className="zentia-card p-4 shadow-none flex items-center gap-3">
        <span className="text-xs uppercase font-bold tracking-widest text-slate-500">Entrenamiento</span>
        <Select value={selected || ""} onValueChange={setSelected}>
          <SelectTrigger data-testid="training-select" className="max-w-sm"><SelectValue placeholder="Selecciona entrenamiento" /></SelectTrigger>
          <SelectContent>
            {trainings.map(t => (
              <SelectItem key={t.training_id} value={t.training_id}>
                {t.title} • {new Date(t.date).toLocaleDateString("es-ES")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {trainings.length === 0 ? (
        <Card className="zentia-card p-12 text-center shadow-none">
          <ClipboardTextIcon size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Crea un entrenamiento en Horarios para registrar asistencia.</p>
        </Card>
      ) : (
        <Card className="zentia-card p-4 shadow-none">
          <div className="space-y-2">
            {players.map(p => (
              <div key={p.player_id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-heading font-bold text-sm">{p.number}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.position}</div>
                </div>
                <div className="flex gap-1">
                  {STATUSES.map(s => {
                    const Icon = s.icon;
                    const active = att[p.player_id] === s.v;
                    return (
                      <Button key={s.v} variant={active ? "default" : "outline"}
                        data-testid={`attendance-${s.v}-${p.player_id}`}
                        onClick={() => mark(p.player_id, s.v)}
                        size="sm"
                        className={`gap-1 text-xs ${active ? "bg-orange-600 hover:bg-orange-700" : ""}`}>
                        <Icon size={14} className={active ? "text-white" : s.color} /> {s.l}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
