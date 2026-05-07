import React, { useEffect, useState, createContext, useContext } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  House, UsersThree, ChartBar, CalendarBlank, Megaphone,
  Strategy, ImagesSquare, SignOut, Volleyball, GearSix,
  Trophy, ClipboardText, ChatsCircle
} from "@phosphor-icons/react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";

export const TeamCtx = createContext(null);
export const useTeam = () => useContext(TeamCtx);

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: House, roles: ["head_coach", "assistant_coach", "player"] },
  { to: "/roster", label: "Plantilla", icon: UsersThree, roles: ["head_coach", "assistant_coach", "player"] },
  { to: "/lineup", label: "Alineaciones", icon: Strategy, roles: ["head_coach", "assistant_coach", "player"] },
  { to: "/schedule", label: "Horarios", icon: CalendarBlank, roles: ["head_coach", "assistant_coach", "player"] },
  { to: "/matches", label: "Partidos & Datavolley", icon: Volleyball, roles: ["head_coach", "assistant_coach", "player"] },
  { to: "/results", label: "Resultados", icon: Trophy, roles: ["head_coach", "assistant_coach", "player"] },
  { to: "/attendance", label: "Asistencia", icon: ClipboardText, roles: ["head_coach", "assistant_coach"] },
  { to: "/communications", label: "Comunicación", icon: ChatsCircle, roles: ["head_coach", "assistant_coach", "player"] },
  { to: "/announcements", label: "Anuncios", icon: Megaphone, roles: ["head_coach", "assistant_coach", "player"] },
  { to: "/gallery", label: "Galería", icon: ImagesSquare, roles: ["head_coach", "assistant_coach", "player"] },
  { to: "/analytics", label: "Analítica", icon: ChartBar, roles: ["head_coach", "assistant_coach"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);

  const loadTeams = async () => {
    const { data } = await api.get("/teams");
    setTeams(data);
    if (data.length && !activeTeam) setActiveTeam(data[0]);
  };

  useEffect(() => { loadTeams(); /* eslint-disable-line */ }, []);

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  const visibleNav = NAV.filter(n => n.roles.includes(user?.role || "player"));
  const initials = (user?.name || "U").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();

  return (
    <TeamCtx.Provider value={{ teams, activeTeam, setActiveTeam, reloadTeams: loadTeams }}>
      <div className="min-h-screen flex bg-slate-50">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                <Volleyball size={22} weight="duotone" />
              </div>
              <div>
                <div className="font-heading font-bold text-base leading-tight">Zentia</div>
                <div className="font-heading text-orange-600 text-sm font-bold leading-tight">VolleyPro</div>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-slate-200">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Equipo activo</div>
            <Select
              data-testid="team-selector"
              value={activeTeam?.team_id || ""}
              onValueChange={(v) => setActiveTeam(teams.find(t => t.team_id === v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona equipo" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(t => (
                  <SelectItem key={t.team_id} value={t.team_id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              data-testid="new-team-btn"
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => navigate("/teams/new")}
            >
              + Nuevo equipo
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {visibleNav.map(n => {
              const Icon = n.icon;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  data-testid={`nav-${n.to.replace("/", "")}`}
                  className={({ isActive }) => `zentia-nav-link ${isActive ? "active" : ""}`}
                >
                  <Icon size={19} weight="duotone" />
                  <span>{n.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-200">
            <div className="flex items-center gap-3 p-2">
              <Avatar className="w-9 h-9">
                <AvatarImage src={user?.picture} />
                <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{user?.name}</div>
                <div className="text-xs text-slate-500 truncate capitalize">{(user?.role || "").replace("_", " ")}</div>
              </div>
              <button onClick={onLogout} data-testid="logout-btn" className="text-slate-400 hover:text-red-600 transition-colors">
                <SignOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="zentia-header sticky top-0 z-20 px-6 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                {activeTeam ? `${activeTeam.category || "Senior"} • ${activeTeam.season || "2025/26"}` : "Sin equipo"}
              </div>
              <h1 className="font-heading text-xl font-bold tracking-tight">{activeTeam?.name || "Configura tu equipo"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} data-testid="settings-btn">
                <GearSix size={20} />
              </Button>
            </div>
          </header>
          <div className="p-6 sport-pattern flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </TeamCtx.Provider>
  );
}
