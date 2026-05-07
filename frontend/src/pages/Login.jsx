import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { formatErr } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { VolleyballIcon, GoogleLogoIcon, EnvelopeIcon, LockKeyIcon, ArrowRightIcon } from "@phosphor-icons/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Bienvenido de nuevo");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatErr(err));
    } finally {
      setBusy(false);
    }
  };

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-[#1E3A8A] text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 10px, transparent 10px 20px)"
        }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center">
            <VolleyballIcon size={26} weight="duotone" />
          </div>
          <div className="font-heading text-2xl font-bold">Zentia<span className="text-orange-400">VolleyPro</span></div>
        </div>
        <div className="relative z-10">
          <div className="tag-chip mb-6 bg-white/10 border-white/20 text-orange-300">Edición Coach 2026</div>
          <h1 className="font-heading text-5xl font-extrabold leading-tight tracking-tight mb-4">
            La cabina de mando<br/>de tu equipo.
          </h1>
          <p className="text-lg text-blue-100 max-w-md font-body">
            Datavolley en tiempo real, alineaciones interactivas, comunicación con plantilla y analítica de temporada — en una sola app.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4 max-w-md">
          {[{n:"34", l:"Acciones / set"}, {n:"6", l:"Posiciones"}, {n:"∞", l:"Análisis"}].map((s,i)=>(
            <div key={i} className="border border-white/15 rounded-xl p-4 backdrop-blur-sm bg-white/5">
              <div className="font-heading text-3xl font-bold text-orange-300">{s.n}</div>
              <div className="text-xs uppercase tracking-widest text-blue-100 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-slate-50 hero-grid">
        <Card className="w-full max-w-md p-8 zentia-card shadow-none">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center">
              <VolleyballIcon size={22} weight="duotone" />
            </div>
            <div className="font-heading text-xl font-bold">Zentia VolleyPro</div>
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Iniciar sesión</h2>
          <p className="text-slate-500 mt-1 mb-6 text-sm">Accede a tu panel de entrenador o jugador</p>

          <Button
            onClick={googleLogin}
            data-testid="google-login-btn"
            type="button"
            variant="outline"
            className="w-full h-11 gap-2 border-slate-300 hover:bg-slate-100 font-medium"
          >
            <GoogleLogoIcon size={20} weight="bold" /> Continuar con Google
          </Button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs uppercase tracking-widest text-slate-400">o con email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-slate-600">Email</Label>
              <div className="relative mt-1">
                <EnvelopeIcon size={18} className="absolute left-3 top-3 text-slate-400" />
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  required
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="entrenador@club.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-widest font-bold text-slate-600">Contraseña</Label>
              <div className="relative mt-1">
                <LockKeyIcon size={18} className="absolute left-3 top-3 text-slate-400" />
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type="password"
                  required
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button
              data-testid="login-submit-btn"
              type="submit"
              disabled={busy}
              className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold gap-2"
            >
              {busy ? "Entrando..." : <>Entrar <ArrowRightIcon size={18} weight="bold" /></>}
            </Button>
          </form>

          <p className="text-sm text-slate-500 mt-6 text-center">
            ¿Aún no tienes cuenta?{" "}
            <Link to="/register" data-testid="go-to-register" className="text-orange-600 font-semibold hover:underline">
              Crea una gratis
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
