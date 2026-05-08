import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatErr } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, FloppyDisk, Trash } from "@phosphor-icons/react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";

const ACTIONS = [
  { id: "kill", label: "Kill (ATQ ✓)", action: "attack", quality: "kill", cls: "dv-btn-kill" },
  { id: "atk_err", label: "Error ATQ", action: "attack", quality: "error", cls: "dv-btn-error" },
  { id: "block", label: "Bloqueo ✓", action: "block", quality: "kill", cls: "dv-btn-block" },
  { id: "block_err", label: "Error BLQ", action: "block", quality: "error", cls: "dv-btn-error" },
  { id: "ace", label: "Ace ★", action: "serve", quality: "ace", cls: "dv-btn-ace" },
  { id: "serve_err", label: "Error SAQ", action: "serve", quality: "error", cls: "dv-btn-error" },
  { id: "rec_excellent", label: "rece#", action: "reception", quality: "kill", cls: "dv-btn-perfect" },
  { id: "rec_perfect", label: "rece+", action: "reception", quality: "perfect", cls: "dv-btn-kill" },
  { id: "rec_ok", label: "rece!", action: "reception", quality: "medium", cls: "dv-btn-medium" },
  { id: "rec_err", label: "Error REC", action: "reception", quality: "error", cls: "dv-btn-error" },
  { id: "dig", label: "Defensa ✓", action: "dig", quality: "perfect", cls: "dv-btn-dig" },
  { id: "set_perf", label: "Set ✓", action: "set", quality: "perfect", cls: "dv-btn-neutral" },
  { id: "set_err", label: "Error COL", action: "set", quality: "error", cls: "dv-btn-error" },
];

export default function MatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState({});
  const [setNum, setSetNum] = useState(1);
  const [activePlayer, setActivePlayer] = useState(null);
  const [advCode, setAdvCode] = useState("");
  const [scoreEdit, setScoreEdit] = useState({ home: 0, away: 0 });
  const [live, setLive] = useState(false);
  const wsRef = useRef(null);

  const load = async () => {
    const m = await api.get(`/matches/${id}`);
    setMatch(m.data);
    setScoreEdit({ home: m.data.home_score, away: m.data.away_score });
    const ps = await api.get(`/players?team_id=${m.data.team_id}`);
    setPlayers(ps.data.sort((a,b)=>a.number-b.number));
    const st = await api.get(`/stats?match_id=${id}`);
    setStats(st.data);
    const sm = await api.get(`/stats/summary?match_id=${id}`);
    setSummary(sm.data);
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, [id]);

  useEffect(() => {
    const base = process.env.REACT_APP_BACKEND_URL.replace(/^http/, "ws");
    const ws = new WebSocket(`${base}/api/ws/datavolley/${id}`);
    wsRef.current = ws;
    ws.onopen = () => setLive(true);
    ws.onclose = () => setLive(false);
    ws.onerror = () => setLive(false);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "stat_added") {
          setStats(prev => [...prev, msg.data]);
          setSummary(msg.summary || {});
        } else if (msg.type === "stat_deleted") {
          setStats(prev => prev.filter(s => s.stat_id !== msg.stat_id));
          setSummary(msg.summary || {});
        } else if (msg.type === "match_update") {
          setMatch(msg.data);
          setScoreEdit({ home: msg.data.home_score, away: msg.data.away_score });
        }
      } catch (_) {}
    };
    // keepalive ping every 25s
    const ping = setInterval(() => {
      if (ws.readyState === 1) ws.send("ping");
    }, 25000);
    return () => { clearInterval(ping); try { ws.close(); } catch (_) {} };
  }, [id]);

  const log = async (act) => {
    if (!activePlayer) { toast.error("Selecciona un jugador"); return; }
    try {
      await api.post("/stats", {
        match_id: id, player_id: activePlayer, set_number: setNum,
        action: act.action, quality: act.quality
      });
      toast.success(`${act.label} • #${players.find(p => p.player_id === activePlayer)?.number}`);
      // WS will push the update; no need to reload
    } catch (e) { toast.error(formatErr(e)); }
  };

  const logAdvanced = async () => {
    if (!activePlayer) { toast.error("Selecciona jugador"); return; }
    if (!advCode.trim()) return;
    try {
      // Parse simple Data Project-like code: e.g. "01a#hp+" - first 2 chars = action, last char quality
      const code = advCode.trim();
      const lastChar = code[code.length - 1];
      const qualityMap = { "#": "kill", "+": "perfect", "!": "medium", "-": "medium", "/": "error", "=": "error" };
      const quality = qualityMap[lastChar] || "neutral";
      const actionLetter = code[2] || "";
      const actionMap = { a: "attack", s: "serve", r: "reception", b: "block", d: "dig", e: "set" };
      const action = actionMap[actionLetter.toLowerCase()] || "attack";
      await api.post("/stats", {
        match_id: id, player_id: activePlayer, set_number: setNum,
        action, quality, code
      });
      setAdvCode("");
      toast.success(`Codificada: ${code}`);
    } catch (e) { toast.error(formatErr(e)); }
  };

  const undo = async () => {
    const last = stats[stats.length - 1];
    if (!last) return;
    await api.delete(`/stats/${last.stat_id}`);
    toast.success("Última acción eliminada");
  };

  const saveScore = async () => {
    await api.patch(`/matches/${id}`, { home_score: Number(scoreEdit.home), away_score: Number(scoreEdit.away) });
    toast.success("Marcador actualizado");
  };

  const setStatus = async (status) => {
    await api.patch(`/matches/${id}`, { status });
    toast.success(`Partido marcado como ${status}`);
  };

  if (!match) return <p>Cargando...</p>;
  const playerNum = (pid) => players.find(p => p.player_id === pid)?.number || "?";

  return (
    <div className="max-w-7xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/matches"><Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button></Link>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-2">
              Datavolley • Set {setNum}
              <span className={`text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${live ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {live ? "● en vivo" : "○ offline"}
              </span>
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">{match.opponent}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(setNum)} onValueChange={v => setSetNum(Number(v))}>
            <SelectTrigger data-testid="set-selector" className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>Set {n}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setStatus("live")} data-testid="set-live-btn">Live</Button>
          <Button variant="outline" onClick={() => setStatus("finished")} data-testid="set-finished-btn">Finalizar</Button>
        </div>
      </div>

      {/* Score */}
      <Card className="zentia-card p-4 shadow-none flex items-center gap-4 flex-wrap">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Marcador</div>
        <Input type="number" className="w-20 h-10 text-center font-heading font-bold text-lg" value={scoreEdit.home} onChange={e => setScoreEdit({...scoreEdit, home: e.target.value})} data-testid="home-score-input" />
        <span className="text-slate-400 font-bold">vs</span>
        <Input type="number" className="w-20 h-10 text-center font-heading font-bold text-lg" value={scoreEdit.away} onChange={e => setScoreEdit({...scoreEdit, away: e.target.value})} data-testid="away-score-input" />
        <Button onClick={saveScore} data-testid="save-score-btn" size="sm" className="bg-orange-600 hover:bg-orange-700 gap-2"><FloppyDisk size={16} /> Guardar</Button>
      </Card>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Players column */}
        <Card className="zentia-card p-4 shadow-none lg:col-span-3">
          <div className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Jugador activo</div>
          <div className="grid grid-cols-3 lg:grid-cols-2 gap-2 max-h-[450px] overflow-y-auto">
            {players.map(p => (
              <button
                key={p.player_id}
                data-testid={`select-player-${p.player_id}`}
                onClick={() => setActivePlayer(p.player_id)}
                className={`p-2 rounded-lg border text-center transition-all ${activePlayer === p.player_id ? "border-orange-500 bg-orange-50 ring-2 ring-orange-300" : "border-slate-200 hover:border-slate-300"}`}
              >
                <div className="font-heading font-bold text-2xl">{p.number}</div>
                <div className="text-[10px] truncate font-semibold">{p.name.split(" ")[0]}</div>
                <div className="text-[10px] text-slate-500">{p.position}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Datavolley */}
        <div className="lg:col-span-9 space-y-4">
          <Card className="zentia-card p-4 shadow-none">
            <Tabs defaultValue="basic">
              <TabsList>
                <TabsTrigger value="basic" data-testid="tab-basic">Modo Botones</TabsTrigger>
                <TabsTrigger value="advanced" data-testid="tab-advanced">Modo Avanzado</TabsTrigger>
              </TabsList>
              <TabsContent value="basic">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                  {ACTIONS.map(a => (
                    <button key={a.id} onClick={() => log(a)} data-testid={`dv-${a.id}`} className={`dv-btn ${a.cls}`}>{a.label}</button>
                  ))}
                </div>
                <div className="flex justify-end mt-3">
                  <Button variant="outline" onClick={undo} data-testid="undo-btn" className="gap-2"><Trash size={16} /> Deshacer última</Button>
                </div>
              </TabsContent>
              <TabsContent value="advanced">
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-slate-600">Codificación rápida estilo profesional. Ej: <code className="bg-slate-100 px-1 rounded">01a#hp+</code> — los 2 primeros chars son ID acción, char 3 = tipo (a=attack, s=serve, r=reception, b=block, d=dig, e=set), último char = calidad (#=kill, +=perfect, !=ok, -=poor, /=blocked, ==error).</p>
                  <div className="flex gap-2">
                    <Input data-testid="adv-code-input" value={advCode} onChange={e => setAdvCode(e.target.value)} placeholder="01a#hp+" className="font-mono" />
                    <Button onClick={logAdvanced} data-testid="adv-log-btn" className="bg-orange-600 hover:bg-orange-700">Registrar</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Live summary */}
          <Card className="zentia-card p-4 shadow-none">
            <div className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-3">Estadísticas en vivo</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-slate-500">
                  <tr><th className="py-2">#</th><th>Jugador</th><th className="text-center">Kills</th><th className="text-center">Aces</th><th className="text-center">Bloqueos</th><th className="text-center">Defensas</th><th className="text-center">Errores</th><th className="text-center">Total</th></tr>
                </thead>
                <tbody>
                  {Object.entries(summary).map(([pid, s]) => {
                    const p = players.find(x => x.player_id === pid);
                    if (!p) return null;
                    return (
                      <tr key={pid} className="border-t border-slate-100">
                        <td className="py-2 font-heading font-bold">{p.number}</td>
                        <td className="font-semibold">{p.name}</td>
                        <td className="text-center">{s.kills}</td>
                        <td className="text-center">{s.aces}</td>
                        <td className="text-center">{s.blocks}</td>
                        <td className="text-center">{s.digs}</td>
                        <td className="text-center text-red-600">{s.errors}</td>
                        <td className="text-center font-bold">{s.total}</td>
                      </tr>
                    );
                  })}
                  {Object.keys(summary).length === 0 && (
                    <tr><td colSpan={8} className="py-6 text-center text-slate-500">Empieza a registrar para ver estadísticas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent log */}
          <Card className="zentia-card p-4 shadow-none">
            <div className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Log reciente</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {stats.slice(-15).reverse().map(s => (
                <div key={s.stat_id} className="flex items-center justify-between text-sm py-1 border-b border-slate-50">
                  <span>Set {s.set_number} • <strong>#{playerNum(s.player_id)}</strong> {s.action} → <em>{s.quality}</em>{s.code ? <code className="ml-2 text-xs bg-slate-100 px-1 rounded">{s.code}</code> : ""}</span>
                  <button onClick={async () => { await api.delete(`/stats/${s.stat_id}`); }} className="text-slate-400 hover:text-red-600"><Trash size={14} /></button>
                </div>
              ))}
              {stats.length === 0 && <p className="text-slate-500 text-sm py-2">Sin registros.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
