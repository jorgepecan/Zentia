import React, { useEffect, useRef, useState } from "react";
import { api, formatErr } from "../lib/api";
import { useTeam } from "../components/Layout";
import { useAuth } from "../lib/auth";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { toast } from "sonner";
import { PaperPlaneTilt, ChatsCircle } from "@phosphor-icons/react";

export default function Communications() {
  const { activeTeam } = useTeam() || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const endRef = useRef(null);

  // initial load + websocket
  useEffect(() => {
    if (!activeTeam) return;
    let alive = true;

    (async () => {
      try {
        const { data } = await api.get(`/messages?team_id=${activeTeam.team_id}`);
        if (alive) setMessages(data);
      } catch (_) {}
    })();

    const base = process.env.REACT_APP_BACKEND_URL.replace(/^http/, "ws");
    const ws = new WebSocket(`${base}/api/ws/chat/${activeTeam.team_id}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "message") setMessages((prev) => [...prev, msg.data]);
      } catch (_) {}
    };

    return () => {
      alive = false;
      try { ws.close(); } catch (_) {}
    };
  }, [activeTeam]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text;
    setText("");
    try {
      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({ body }));
      } else {
        await api.post("/messages", { team_id: activeTeam.team_id, body });
      }
    } catch (e) { toast.error(formatErr(e)); }
  };

  if (!activeTeam) return <p className="text-slate-500">Selecciona un equipo.</p>;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Comunicación</h2>
          <p className="text-slate-500 text-sm">Canal del equipo en tiempo real.</p>
        </div>
        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ${connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {connected ? "● en vivo" : "○ offline"}
        </span>
      </div>

      <Card className="zentia-card p-0 shadow-none flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ChatsCircle size={48} weight="duotone" />
              <p className="text-sm mt-2">Sé el primero en escribir.</p>
            </div>
          )}
          {messages.map(m => {
            const mine = m.author_id === user?.user_id;
            return (
              <div key={m.message_id} className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
                {!mine && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={m.author_picture} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">{(m.author_name || "U").slice(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                  {!mine && <div className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-0.5">{m.author_name}</div>}
                  <div>{m.body}</div>
                  <div className={`text-[10px] mt-1 ${mine ? "text-orange-100" : "text-slate-500"}`}>{new Date(m.created_at).toLocaleTimeString("es-ES", {hour:"2-digit", minute:"2-digit"})}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="p-3 border-t border-slate-200 flex gap-2">
          <Input data-testid="message-input" placeholder="Escribe un mensaje..." value={text} onChange={e => setText(e.target.value)} className="h-11" />
          <Button data-testid="send-message-btn" type="submit" className="bg-orange-600 hover:bg-orange-700 h-11 w-11 p-0"><PaperPlaneTilt size={18} weight="fill" /></Button>
        </form>
      </Card>
    </div>
  );
}
