import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface CallLog {
  id: string;
  name: string;
  avatar: string;
  avatarStyle: string;
  type: "incoming" | "outgoing" | "missed";
  callType: "audio" | "video";
  time: string;
  duration?: string;
}

const tabs = ["Tous", "Manqués", "Entrants", "Sortants"];

interface Props {
  onBack: () => void;
  onStartCall?: (type: string) => void;
}

const CallsModule = ({ onBack, onStartCall }: Props) => {
  const [activeTab, setActiveTab] = useState("Tous");
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setCalls([]); setLoading(false); return; }
    fetchCalls();
  }, [user]);

  const fetchCalls = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("calls").select("*, profiles:caller_id(full_name)").or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`).order("started_at", { ascending: false }).limit(50);
    if (data) {
      setCalls(data.map((c: any) => ({
        id: c.id,
        name: c.profiles?.full_name || "Utilisateur",
        avatar: (c.profiles?.full_name || "U")[0],
        avatarStyle: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))",
        type: c.status === "missed" ? "missed" : c.caller_id === user.id ? "outgoing" : "incoming",
        callType: c.call_type === "video" ? "video" : "audio",
        time: c.started_at ? new Date(c.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "",
        duration: c.duration ? `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, "0")}` : undefined,
      })));
    }
    setLoading(false);
  };

  const filtered = calls.filter((c) => {
    if (activeTab === "Manqués") return c.type === "missed";
    if (activeTab === "Entrants") return c.type === "incoming";
    if (activeTab === "Sortants") return c.type === "outgoing";
    return true;
  });

  const typeIcon = (type: string) => type === "missed" ? "📵" : type === "incoming" ? "📲" : "📤";
  const typeColor = (type: string) => type === "missed" ? "text-envle-rouge" : "text-envle-vert-light";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 md:px-6 py-3 md:py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.85 }} className="w-9 h-9 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</motion.button>
        <h2 className="font-display text-xl md:text-2xl font-bold flex-1">Appels</h2>
        <motion.button whileTap={{ scale: 0.9 }} className="px-3 py-1.5 rounded-xl border-none font-body text-xs cursor-pointer font-semibold text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={() => onStartCall?.("audio")}>+ Appel</motion.button>
      </motion.div>

      <div className="flex px-4 md:px-6 gap-1 py-2 border-b border-envle-border overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {tabs.map((tab) => (
          <motion.button key={tab} whileTap={{ scale: 0.92 }} className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${activeTab === tab ? "bg-primary/20 text-envle-vert-light" : "bg-transparent text-envle-text-muted hover:bg-foreground/[0.04]"}`} onClick={() => setActiveTab(tab)}>{tab}</motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-40"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-3xl">⏳</motion.span></div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-40 text-center">
            <span className="text-4xl mb-3">📞</span>
            <p className="text-envle-text-muted text-sm">Aucun appel récent</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((call, i) => (
              <motion.div
                key={call.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 25 }}
                whileHover={{ x: 4, backgroundColor: "hsla(142, 47%, 33%, 0.03)" }}
                className="flex items-center gap-3 px-4 md:px-6 py-3 transition-colors cursor-pointer border-b border-envle-border/50"
                onClick={() => onStartCall?.("audio")}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base" style={{ background: call.avatarStyle }}>{call.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{call.name}</div>
                  <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${typeColor(call.type)}`}>
                    <span>{typeIcon(call.type)}</span>
                    <span>{call.callType === "video" ? "Vidéo" : "Audio"}</span>
                    {call.duration && <span className="text-envle-text-muted">· {call.duration}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] text-envle-text-muted">{call.time}</span>
                  <div className="flex gap-1.5">
                    <motion.button whileTap={{ scale: 0.75 }} className="w-7 h-7 rounded-full bg-primary/15 border-none text-sm cursor-pointer flex items-center justify-center" onClick={(e) => { e.stopPropagation(); onStartCall?.("audio"); }}>📞</motion.button>
                    <motion.button whileTap={{ scale: 0.75 }} className="w-7 h-7 rounded-full bg-primary/15 border-none text-sm cursor-pointer flex items-center justify-center" onClick={(e) => { e.stopPropagation(); onStartCall?.("video"); }}>📹</motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default CallsModule;
