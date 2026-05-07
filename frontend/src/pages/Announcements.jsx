import React, { useEffect, useState } from "react";
import { api, formatErr } from "../lib/api";
import { useTeam } from "../components/Layout";
import { useAuth } from "../lib/auth";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Megaphone, PushPin, Trash } from "@phosphor-icons/react";

export default function Announcements() {
  const { activeTeam } = useTeam() || {};
  const { user } = useAuth();
  const isCoach = ["head_coach", "assistant_coach"].includes(user?.role);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", pinned: false });

  const load = async () => {
    if (!activeTeam) return;
    const { data } = await api.get(`/announcements?team_id=${activeTeam.team_id}`);
    setItems(data);
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, [activeTeam]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/announcements", { ...form, team_id: activeTeam.team_id });
      toast.success("Anuncio publicado");
      setOpen(false);
      setForm({ title: "", body: "", pinned: false });
      load();
    } catch (e) { toast.error(formatErr(e)); }
  };

  const del = async (id) => { await api.delete(`/announcements/${id}`); load(); };

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Anuncios</h2>
          <p className="text-slate-500 text-sm">Comunicaciones oficiales del cuerpo técnico.</p>
        </div>
        {isCoach && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-announcement-btn" className="bg-orange-600 hover:bg-orange-700 gap-2"><Plus size={18} weight="bold" /> Nuevo anuncio</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Publicar anuncio</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div><Label>Título</Label><Input data-testid="announcement-title-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
                <div><Label>Mensaje</Label><Textarea data-testid="announcement-body-input" required rows={4} value={form.body} onChange={e => setForm({...form, body: e.target.value})} /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pinned} onChange={e => setForm({...form, pinned: e.target.checked})} /> Fijar arriba</label>
                <Button type="submit" data-testid="publish-announcement-btn" className="bg-orange-600 hover:bg-orange-700">Publicar</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="zentia-card p-12 text-center shadow-none">
          <Megaphone size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Sin anuncios todavía.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.sort((a,b) => Number(b.pinned) - Number(a.pinned)).map(a => (
            <Card key={a.announcement_id} className="zentia-card p-5 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {a.pinned && <PushPin size={16} weight="fill" className="text-orange-600" />}
                    <h3 className="font-heading font-bold text-lg">{a.title}</h3>
                  </div>
                  <p className="text-slate-700 mt-1 whitespace-pre-wrap">{a.body}</p>
                  <div className="text-xs text-slate-500 mt-2">{a.author_name} • {new Date(a.created_at).toLocaleString("es-ES")}</div>
                </div>
                {isCoach && <button onClick={() => del(a.announcement_id)} className="text-slate-400 hover:text-red-600"><Trash size={16} /></button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
