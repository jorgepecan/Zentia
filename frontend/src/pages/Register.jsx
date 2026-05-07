import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { formatErr } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { Volleyball, User, Envelope, LockKey, Megaphone as Whistle } from "@phosphor-icons/react";

const ROLES = [
  { v: "head_coach", l: "Entrenador principal", icon: Whistle },
  { v: "assistant_coach", l: "Entrenador asistente", icon: User },
  { v: "player", l: "Jugador/a", icon: Volleyball },
];

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "head_coach" });
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success("Cuenta creada. ¡Bienvenido!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatErr(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 hero-grid">
      <Card className="w-full max-w-lg p-8 zentia-card shadow-none">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center">
            <Volleyball size={22} weight="duotone" />
          </div>
          <div className="font-heading text-xl font-bold">Zentia VolleyPro</div>
        </div>
        <h2 className="font-heading text-3xl font-bold tracking-tight mt-4">Crea tu cuenta</h2>
        <p className="text-slate-500 text-sm mb-6">Configura tu equipo en menos de 60 segundos</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest font-bold text-slate-600">Nombre completo</Label>
            <Input data-testid="register-name-input" required className="h-11 mt-1"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest font-bold text-slate-600">Email</Label>
            <Input data-testid="register-email-input" type="email" required className="h-11 mt-1"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest font-bold text-slate-600">Contraseña</Label>
            <Input data-testid="register-password-input" type="password" required minLength={6} className="h-11 mt-1"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest font-bold text-slate-600">Tu rol</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = form.role === r.v;
                return (
                  <button type="button" key={r.v} data-testid={`register-role-${r.v}`}
                    onClick={() => setForm({ ...form, role: r.v })}
                    className={`p-3 rounded-lg border text-left transition-all ${active ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <Icon size={22} weight="duotone" className={active ? "text-orange-600" : "text-slate-500"} />
                    <div className={`text-xs mt-2 font-semibold leading-tight ${active ? "text-orange-700" : "text-slate-700"}`}>{r.l}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button data-testid="register-submit-btn" type="submit" disabled={busy}
            className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold">
            {busy ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-orange-600 font-semibold hover:underline">Inicia sesión</Link>
        </p>
      </Card>
    </div>
  );
}
