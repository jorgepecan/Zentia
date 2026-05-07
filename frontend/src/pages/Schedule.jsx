import React, { useEffect, useState } from "react";
import { api, formatErr } from "../lib/api";
import { useTeam } from "../components/Layout";
import { useAuth } from "../lib/auth";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "../components/ui/dialog";
import { toast } from "sonner";
import { PlusIcon, CalendarBlankIcon, MapPinIcon } from "@phosphor-icons/react";

export default function Schedule() {
  const { activeTeam } = useTeam() || {};
  const { user } = useAuth();
  const isCoach = ["head_coach", "assistant_coach"].includes(user?.role);
  const [matches, setMatches] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "Entrenamiento", date: "", location: "", notes: "" });

  const load = async () => {
    if (!activeTeam) return;
    const [m, t] = await Promise.all([
      api.get(`/matches?team_id=${activeTeam.team_id}`),
      api.get(`/trainings?team_id=${activeTeam.team_id}`)
    ]);
    setMatches(m.data);
    setTrainings(t.data);
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, [activeTeam]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/trainings", { ...form, team_id: activeTeam.team_id });
      toast.success("Entrenamiento creado");
      setOpen(false);
      setForm({ title: "Entrenamiento", date: "", location: "", notes: "" });
      load();
    } catch (e) { toast.error(formatErr(e)); }
  };

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  const events = [
    ...matches.map(m => ({ kind: "match", date: m.date, title: `vs ${m.opponent}`, location: m.location, id: m.match_id })),
    ...trainings.map(t => ({ kind: "training", date: t.date, title: t.title, location: t.location, id: t.training_id }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Horarios</h2>
          <p className="text-slate-500 text-sm">Entrenamientos y partidos de la temporada.</p>
        </div>
        {isCoach && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-training-btn" className="bg-orange-600 hover:bg-orange-700 gap-2"><PlusIcon size={18} weight="bold" /> Entrenamiento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo entrenamiento</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div><Label>Título</Label><Input data-testid="training-title-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
                <div><Label>Fecha y hora</Label><Input data-testid="training-date-input" type="datetime-local" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
                <div><Label>Lugar</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
                <div><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
                <Button type="submit" data-testid="create-training-submit" className="bg-orange-600 hover:bg-orange-700">Crear</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {events.length === 0 ? (
        <Card className="zentia-card p-12 text-center shadow-none">
          <CalendarBlankIcon size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No hay eventos programados.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map(ev => (
            <Card key={`${ev.kind}-${ev.id}`} className="zentia-card p-4 shadow-none flex items-center gap-4">
              <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center font-heading ${ev.kind === "match" ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-700"}`}>
                <div className="text-xs font-bold uppercase">{new Date(ev.date).toLocaleString("es-ES", { month: "short" })}</div>
                <div className="text-2xl font-extrabold leading-none">{new Date(ev.date).getDate()}</div>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{ev.kind === "match" ? "Partido" : "Entrenamiento"}</div>
                <div className="font-heading font-bold text-lg">{ev.title}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1"><MapPinIcon size={14} /> {ev.location || "Por confirmar"} • {new Date(ev.date).toLocaleString("es-ES", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
