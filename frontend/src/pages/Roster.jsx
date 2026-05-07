import React, { useEffect, useState } from "react";
import { api, formatErr } from "../lib/api";
import { useTeam } from "../components/Layout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";
import { toast } from "sonner";
import { PlusIcon, TrashIcon, UsersThreeIcon, EnvelopePlusIcon } from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";

const POSITIONS = [
  { v: "OH", l: "Receptor (OH)" },
  { v: "OPP", l: "Opuesto" },
  { v: "MB", l: "Central" },
  { v: "S", l: "Colocador" },
  { v: "L", l: "Líbero" },
  { v: "DS", l: "Defensa" },
];

export default function Roster() {
  const { activeTeam } = useTeam() || {};
  const { user } = useAuth();
  const isCoach = ["head_coach", "assistant_coach"].includes(user?.role);
  const [players, setPlayers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", number: 1, position: "OH", height_cm: "" });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "player" });

  const load = async () => {
    if (!activeTeam) return;
    const { data } = await api.get(`/players?team_id=${activeTeam.team_id}`);
    setPlayers(data.sort((a,b)=>a.number-b.number));
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, [activeTeam]);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post("/players", { ...form, team_id: activeTeam.team_id, number: Number(form.number), height_cm: form.height_cm ? Number(form.height_cm) : null });
      toast.success("Jugador añadido");
      setOpen(false);
      setForm({ name: "", number: 1, position: "OH", height_cm: "" });
      load();
    } catch (e) { toast.error(formatErr(e)); }
  };

  const del = async (id) => {
    await api.delete(`/players/${id}`);
    toast.success("Jugador eliminado");
    load();
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/teams/${activeTeam.team_id}/invite`, invite);
      toast.success("Miembro añadido al equipo");
      setInviteOpen(false);
      setInvite({ email: "", role: "player" });
    } catch (e) { toast.error(formatErr(e)); }
  };

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Plantilla</h2>
          <p className="text-slate-500 text-sm">{players.length} jugadores en {activeTeam.name}</p>
        </div>
        {isCoach && (
          <div className="flex gap-2">
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="invite-member-btn" className="gap-2">
                  <EnvelopePlusIcon size={18} weight="bold" /> Invitar al equipo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invitar miembro</DialogTitle></DialogHeader>
                <form onSubmit={sendInvite} className="space-y-3">
                  <div>
                    <Label>Email</Label>
                    <Input data-testid="invite-email-input" type="email" required value={invite.email} onChange={e => setInvite({...invite, email: e.target.value})} />
                  </div>
                  <div>
                    <Label>Rol</Label>
                    <Select value={invite.role} onValueChange={v => setInvite({...invite, role: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="player">Jugador</SelectItem>
                        <SelectItem value="assistant_coach">Asistente</SelectItem>
                        <SelectItem value="head_coach">Entrenador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button data-testid="send-invite-submit" type="submit" className="bg-orange-600 hover:bg-orange-700">Añadir</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-player-btn" className="bg-orange-600 hover:bg-orange-700 gap-2"><PlusIcon size={18} weight="bold" /> Añadir jugador</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo jugador</DialogTitle></DialogHeader>
                <form onSubmit={add} className="space-y-3">
                  <div><Label>Nombre</Label><Input data-testid="player-name-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Dorsal</Label><Input data-testid="player-number-input" type="number" min="1" max="99" required value={form.number} onChange={e => setForm({...form, number: e.target.value})} /></div>
                    <div><Label>Altura (cm)</Label><Input type="number" value={form.height_cm} onChange={e => setForm({...form, height_cm: e.target.value})} /></div>
                  </div>
                  <div>
                    <Label>Posición</Label>
                    <Select value={form.position} onValueChange={v => setForm({...form, position: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{POSITIONS.map(p => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button data-testid="save-player-btn" type="submit" className="bg-orange-600 hover:bg-orange-700">Guardar</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {players.length === 0 ? (
        <Card className="zentia-card p-12 text-center shadow-none">
          <UsersThreeIcon size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Aún no has añadido jugadores.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {players.map(p => (
            <Card key={p.player_id} className="zentia-card p-4 shadow-none flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-heading font-bold text-lg">{p.number}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs text-slate-500">{POSITIONS.find(x => x.v === p.position)?.l || p.position}{p.height_cm ? ` • ${p.height_cm}cm` : ""}</div>
              </div>
              {isCoach && <button onClick={() => del(p.player_id)} className="text-slate-400 hover:text-red-600" data-testid={`delete-player-${p.player_id}`}><TrashIcon size={18} /></button>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
