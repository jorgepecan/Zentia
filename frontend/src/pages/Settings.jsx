import React, { useEffect, useState } from "react";
import { api, formatErr } from "../lib/api";
import { useTeam } from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from "../components/ui/alert-dialog";
import { toast } from "sonner";
import { FloppyDisk, Trash, GearSix, UsersThree } from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";

export default function Settings() {
  const { activeTeam, reloadTeams, setActiveTeam } = useTeam() || {};
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", category: "", season: "", color: "#EA580C" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTeam) {
      setForm({
        name: activeTeam.name || "",
        category: activeTeam.category || "",
        season: activeTeam.season || "",
        color: activeTeam.color || "#EA580C",
      });
    }
  }, [activeTeam]);

  if (!activeTeam) {
    return (
      <Card className="zentia-card p-12 text-center max-w-2xl mx-auto">
        <GearSix size={48} weight="duotone" className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">Selecciona un equipo desde el sidebar para configurarlo.</p>
      </Card>
    );
  }

  const isOwner = user?.user_id === activeTeam.owner_id;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/teams/${activeTeam.team_id}`, form);
      toast.success("Equipo actualizado");
      await reloadTeams?.();
      // refresh active team from updated list
      const updated = await api.get(`/teams/${activeTeam.team_id}`);
      setActiveTeam?.(updated.data);
    } catch (e) { toast.error(formatErr(e)); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    try {
      await api.delete(`/teams/${activeTeam.team_id}`);
      toast.success("Equipo eliminado");
      setActiveTeam?.(null);
      await reloadTeams?.();
      navigate("/dashboard");
    } catch (e) { toast.error(formatErr(e)); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-heading text-3xl font-bold tracking-tight">Ajustes del equipo</h2>
        <p className="text-slate-500 text-sm">Edita la información o elimina el equipo activo.</p>
      </div>

      <Card className="zentia-card p-6">
        <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
          <GearSix size={20} weight="duotone" className="text-orange-600" /> Información del equipo
        </h3>
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label className="text-xs uppercase font-bold tracking-widest text-slate-600">Nombre del equipo</Label>
            <Input
              data-testid="settings-team-name"
              required
              disabled={!isOwner}
              className="h-11 mt-1 glass-soft border-white/60"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase font-bold tracking-widest text-slate-600">Categoría</Label>
              <Input disabled={!isOwner} className="h-11 mt-1 glass-soft border-white/60" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs uppercase font-bold tracking-widest text-slate-600">Temporada</Label>
              <Input disabled={!isOwner} className="h-11 mt-1 glass-soft border-white/60" value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase font-bold tracking-widest text-slate-600">Color principal</Label>
            <input
              type="color"
              disabled={!isOwner}
              className="h-11 mt-1 w-full rounded-lg border border-white/60"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
            />
          </div>
          {isOwner ? (
            <Button data-testid="settings-save-btn" type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700 gap-2">
              <FloppyDisk size={18} weight="bold" /> {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          ) : (
            <p className="text-xs text-slate-500">Solo el propietario del equipo puede editar.</p>
          )}
        </form>
      </Card>

      <Card className="zentia-card p-6 border-red-200/70">
        <h3 className="font-heading font-bold text-lg mb-2 text-red-700 flex items-center gap-2">
          <Trash size={20} weight="duotone" /> Zona peligrosa
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Eliminar el equipo borrará permanentemente <strong>todos</strong> sus jugadores, partidos, alineaciones, estadísticas, mensajes, anuncios y galería. Esta acción no se puede deshacer.
        </p>
        {isOwner ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button data-testid="settings-delete-btn" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 gap-2">
                <Trash size={18} weight="bold" /> Eliminar equipo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar “{activeTeam.name}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrarán todos los datos asociados (jugadores, partidos, estadísticas, alineaciones, entrenamientos, asistencia, anuncios, mensajes y galería). Esta acción es irreversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="settings-delete-cancel">Cancelar</AlertDialogCancel>
                <AlertDialogAction data-testid="settings-delete-confirm" onClick={remove} className="bg-red-600 hover:bg-red-700">
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <p className="text-xs text-slate-500">Solo el propietario puede eliminar el equipo.</p>
        )}
      </Card>

      <Card className="zentia-card p-6">
        <h3 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
          <UsersThree size={20} weight="duotone" className="text-blue-700" /> Miembros
        </h3>
        <div className="space-y-1 text-sm">
          {(activeTeam.members || []).map((m, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg glass-soft">
              <div className="font-medium">
                {m.user_id === activeTeam.owner_id ? "👑 " : ""}<code className="text-xs text-slate-500">{m.user_id}</code>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 capitalize">{m.role.replace("_", " ")}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">Para invitar nuevos miembros, ve a la pestaña <strong>Plantilla</strong> y usa “Invitar al equipo”.</p>
      </Card>
    </div>
  );
}
