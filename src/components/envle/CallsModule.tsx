import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

const mockCalls: CallLog[] = [
  { id: "1", name: "Amara Diallo", avatar: "A", avatarStyle: "linear-gradient(135deg,#7c3aed,#ec4899)", type: "outgoing", callType: "video", time: "Aujourd'hui, 09:15", duration: "12:34" },
  { id: "2", name: "Kofi Mensah", avatar: "K", avatarStyle: "linear-gradient(135deg,#f59e0b,#ef4444)", type: "missed", callType: "audio", time: "Aujourd'hui, 08:42" },
  { id: "3", name: "TechHub Dakar", avatar: "🏢", avatarStyle: "linear-gradient(135deg,#0ea5e9,#2563eb)", type: "incoming", callType: "video", time: "Hier, 16:30", duration: "45:12" },
  { id: "4", name: "Fatima Traoré", avatar: "F", avatarStyle: "linear-gradient(135deg,#10b981,#059669)", type: "outgoing", callType: "audio", time: "Hier, 14:20", duration: "3:45" },
  { id: "5", name: "Boubacar Sylla", avatar: "B", avatarStyle: "linear-gradient(135deg,#8b5cf6,#6d28d9)", type: "missed", callType: "video", time: "Lun., 11:00" },
  { id: "6", name: "Mariam Diop", avatar: "M", avatarStyle: "linear-gradient(135deg,#f472b6,#db2777)", type: "incoming", callType: "audio", time: "Lun., 09:15", duration: "8:22" },
];

const tabs = ["Tous", "Manqués", "Entrants", "Sortants"];

const CallsModule = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState("Tous");

  const filtered = mockCalls.filter((c) => {
    if (activeTab === "Manqués") return c.type === "missed";
    if (activeTab === "Entrants") return c.type === "incoming";
    if (activeTab === "Sortants") return c.type === "outgoing";
    return true;
  });

  const typeIcon = (type: string) => type === "missed" ? "📵" : type === "incoming" ? "📲" : "📤";
  const typeColor = (type: string) => type === "missed" ? "text-envle-rouge" : "text-envle-vert-light";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <button className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</button>
        <h2 className="font-display text-2xl font-bold flex-1">Appels</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="px-4 py-2 rounded-xl border-none font-body text-sm cursor-pointer font-semibold text-primary-foreground"
          style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
          onClick={() => toast("📞 Nouvel appel")}
        >
          + Appel
        </motion.button>
      </div>

      <div className="flex px-6 gap-1 py-3 border-b border-envle-border">
        {tabs.map((tab) => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all ${
              activeTab === tab ? "bg-primary/20 text-envle-vert-light" : "bg-transparent text-envle-text-muted hover:bg-foreground/[0.04]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {filtered.map((call, i) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-6 py-3.5 hover:bg-foreground/[0.03] transition-colors cursor-pointer border-b border-envle-border/50"
              onClick={() => toast(`📞 Rappeler ${call.name}`)}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: call.avatarStyle }}>
                {call.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{call.name}</div>
                <div className={`text-xs flex items-center gap-1.5 mt-0.5 ${typeColor(call.type)}`}>
                  <span>{typeIcon(call.type)}</span>
                  <span>{call.callType === "video" ? "Vidéo" : "Audio"}</span>
                  {call.duration && <span className="text-envle-text-muted">· {call.duration}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-envle-text-muted">{call.time}</span>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.8 }} className="w-8 h-8 rounded-full bg-primary/15 border-none text-sm cursor-pointer flex items-center justify-center" onClick={(e) => { e.stopPropagation(); toast(`📞 Appel audio → ${call.name}`); }}>📞</motion.button>
                  <motion.button whileTap={{ scale: 0.8 }} className="w-8 h-8 rounded-full bg-primary/15 border-none text-sm cursor-pointer flex items-center justify-center" onClick={(e) => { e.stopPropagation(); toast(`📹 Appel vidéo → ${call.name}`); }}>📹</motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CallsModule;
