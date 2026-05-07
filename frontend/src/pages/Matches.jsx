import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { PlusIcon, VolleyballIcon, ChartBarIcon } from "@phosphor-icons/react";

export default function Matches() {
  const { activeTeam } = useTeam() || {};
  const { user } = useAuth();
  const isCoach = ["head_coach", "assistant_coach"].includes(user?.role);
  const [matches, setMatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ opponent: "", date: "", location: "", home: true });

  const load = async () => {
    if (!activeTeam) return;
    const { data } = await api.get(`/matches?team_id=${activeTeam.team_id}`);
    setMatches(data);
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, [activeTeam]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/matches", { ...form, team_id: activeTeam.team_id });
      toast.success("Partido creado");
      setOpen(false);
      setForm({ opponent: "", date: "", location: "", home: true });
      load();
    } catch (e) { toast.error(formatErr(e)); }
  };

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Partidos & Datavolley</h2>
          <p className="text-slate-500 text-sm">Gestiona partidos y registra estadísticas en directo.</p>
        </div>
        {isCoach && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-match-btn" className="bg-orange-600 hover:bg-orange-700 gap-2"><PlusIcon size={18} weight="bold" /> Nuevo partido</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear partido</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div><Label>Rival</Label><Input data-testid="match-opponent-input" required value={form.opponent} onChange={e => setForm({...form, opponent: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Fecha</Label><Input data-testid="match-date-input" type="datetime-local" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
                  <div><Label>Sede</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2"><input type="radio" checked={form.home} onChange={() => setForm({...form, home: true})} /> Local</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={!form.home} onChange={() => setForm({...form, home: false})} /> Visitante</label>
                </div>
                <Button data-testid="create-match-submit" type="submit" className="bg-orange-600 hover:bg-orange-700">Crear</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {matches.length === 0 ? (
        <Card className="zentia-card p-12 text-center shadow-none">
          <VolleyballIcon size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Sin partidos. Crea el primero para empezar.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {matches.map(m => (
            <Card key={m.match_id} className="zentia-card p-4 shadow-none flex items-center justify-between">
              <div>
                <div className="font-heading font-bold text-lg">{m.home ? activeTeam.name : m.opponent} <span className="text-slate-400 text-sm">vs</span> {m.home ? m.opponent : activeTeam.name}</div>
                <div className="text-xs text-slate-500">{new Date(m.date).toLocaleString("es-ES")} • {m.location || "TBD"}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${m.status === "live" ? "bg-red-100 text-red-700" : m.status === "finished" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{m.status}</span>
                  <span className="font-heading font-bold">{m.home_score} - {m.away_score}</span>
                </div>
              </div>
              <Link to={`/matches/${m.match_id}`}>
                <Button data-testid={`open-datavolley-${m.match_id}`} variant="outline" className="gap-2"><ChartBarIcon size={16} /> Datavolley</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
