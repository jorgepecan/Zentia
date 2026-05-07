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
import { PlusIcon, ImagesSquareIcon, TrashIcon } from "@phosphor-icons/react";

export default function Gallery() {
  const { activeTeam } = useTeam() || {};
  const { user } = useAuth();
  const isCoach = ["head_coach", "assistant_coach"].includes(user?.role);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ url: "", caption: "", kind: "image" });

  const load = async () => {
    if (!activeTeam) return;
    const { data } = await api.get(`/gallery?team_id=${activeTeam.team_id}`);
    setItems(data);
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, [activeTeam]);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post("/gallery", { ...form, team_id: activeTeam.team_id });
      toast.success("Añadido a galería");
      setOpen(false);
      setForm({ url: "", caption: "", kind: "image" });
      load();
    } catch (e) { toast.error(formatErr(e)); }
  };

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Galería</h2>
          <p className="text-slate-500 text-sm">Fotos y vídeos del equipo.</p>
        </div>
        {isCoach && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-gallery-btn" className="bg-orange-600 hover:bg-orange-700 gap-2"><PlusIcon size={18} weight="bold" /> Añadir</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Añadir a galería</DialogTitle></DialogHeader>
              <form onSubmit={add} className="space-y-3">
                <div><Label>URL de la imagen/video</Label><Input data-testid="gallery-url-input" required value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://..." /></div>
                <div><Label>Descripción</Label><Input value={form.caption} onChange={e => setForm({...form, caption: e.target.value})} /></div>
                <Button type="submit" data-testid="save-gallery-btn" className="bg-orange-600 hover:bg-orange-700">Añadir</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="zentia-card p-12 text-center shadow-none">
          <ImagesSquareIcon size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">La galería está vacía.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map(it => (
            <div key={it.gallery_id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white">
              <img src={it.url} alt={it.caption} className="w-full h-44 object-cover" />
              {it.caption && <div className="p-2 text-xs text-slate-700 truncate">{it.caption}</div>}
              {isCoach && (
                <button onClick={async () => { await api.delete(`/gallery/${it.gallery_id}`); load(); }}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-md text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrashIcon size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
