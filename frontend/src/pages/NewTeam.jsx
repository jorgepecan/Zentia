import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatErr } from "../lib/api";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useTeam } from "../components/Layout";
import { toast } from "sonner";

export default function NewTeam() {
  const [form, setForm] = useState({ name: "", category: "Senior Femenino", season: "2025/26", color: "#EA580C" });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { reloadTeams, setActiveTeam } = useTeam() || {};

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/teams", form);
      await reloadTeams?.();
      setActiveTeam?.(data);
      toast.success("Equipo creado");
      navigate("/dashboard");
    } catch (err) { toast.error(formatErr(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-xl">
      <h2 className="font-heading text-3xl font-bold tracking-tight mb-2">Crear nuevo equipo</h2>
      <p className="text-slate-500 mb-6">Define la identidad de tu plantilla.</p>
      <Card className="zentia-card p-6 shadow-none">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs uppercase font-bold tracking-widest text-slate-600">Nombre del equipo</Label>
            <Input data-testid="team-name-input" required className="h-11 mt-1"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase font-bold tracking-widest text-slate-600">Categoría</Label>
              <Input className="h-11 mt-1" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs uppercase font-bold tracking-widest text-slate-600">Temporada</Label>
              <Input className="h-11 mt-1" value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase font-bold tracking-widest text-slate-600">Color</Label>
            <input type="color" className="h-11 mt-1 w-full rounded-md border border-slate-200" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          </div>
          <Button data-testid="create-team-submit" disabled={busy} className="bg-orange-600 hover:bg-orange-700">
            {busy ? "Creando..." : "Crear equipo"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
