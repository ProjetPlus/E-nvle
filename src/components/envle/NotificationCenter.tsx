import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: "message" | "call" | "payment" | "system" | "social" | "job";
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: string;
}

const mockNotifications: Notification[] = [
  { id: "1", type: "message", title: "Amara Diallo", body: "T'a envoyé une photo 📷", time: "Il y a 2 min", read: false, icon: "💬" },
  { id: "2", type: "call", title: "Appel manqué", body: "Kofi Mensah · Appel audio", time: "Il y a 15 min", read: false, icon: "📵" },
  { id: "3", type: "payment", title: "Paiement reçu", body: "+25 000 FCFA de Fatima Traoré", time: "Il y a 1h", read: false, icon: "💰" },
  { id: "4", type: "social", title: "Nouvelle réaction", body: "Boubacar a aimé votre story", time: "Il y a 2h", read: true, icon: "❤️" },
  { id: "5", type: "job", title: "Candidature vue", body: "TechHub Dakar a consulté votre profil", time: "Il y a 3h", read: true, icon: "👀" },
  { id: "6", type: "system", title: "Mise à jour E'nvlé", body: "v2.5 disponible · Nouvelles fonctionnalités", time: "Il y a 5h", read: true, icon: "🚀" },
  { id: "7", type: "payment", title: "Achat confirmé", body: "Tissu Wax Premium · 15 000 FCFA", time: "Hier", read: true, icon: "🛍️" },
  { id: "8", type: "social", title: "Nouveau membre", body: "Diaspora Africa · +3 membres", time: "Hier", read: true, icon: "👥" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

const NotificationCenter = ({ open, onClose, notifications, onMarkAllRead, onClearAll }: Props) => {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[380px] max-w-[90vw] z-[201] bg-envle-card border-l border-envle-border flex flex-col"
          >
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 border-b border-envle-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl font-bold">Notifications</h2>
                <motion.button whileTap={{ scale: 0.85 }} whileHover={{ rotate: 90 }} className="w-8 h-8 rounded-lg bg-foreground/[0.06] border-none text-sm cursor-pointer flex items-center justify-center" onClick={onClose}>✕</motion.button>
              </div>
              <div className="flex items-center gap-2">
                {(["all", "unread"] as const).map((f) => (
                  <motion.button key={f} whileTap={{ scale: 0.92 }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all ${filter === f ? "bg-primary/20 text-envle-vert-light" : "bg-foreground/[0.04] text-envle-text-muted"}`} onClick={() => setFilter(f)}>
                    {f === "all" ? "Toutes" : `Non lues (${unreadCount})`}
                  </motion.button>
                ))}
                <div className="flex-1" />
                <motion.button whileTap={{ scale: 0.9 }} className="text-xs text-envle-text-muted border-none bg-transparent cursor-pointer hover:text-foreground font-body" onClick={onMarkAllRead}>Tout lire</motion.button>
                <motion.button whileTap={{ scale: 0.9 }} className="text-xs text-envle-rouge border-none bg-transparent cursor-pointer hover:text-foreground font-body" onClick={onClearAll}>Effacer</motion.button>
              </div>
            </motion.div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <AnimatePresence>
                {filtered.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30, height: 0 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ x: -3, backgroundColor: "hsla(142, 47%, 33%, 0.03)" }}
                    className={`flex items-start gap-3 px-5 py-4 border-b border-envle-border/50 cursor-pointer transition-colors ${!n.read ? "bg-primary/[0.04]" : ""}`}
                    onClick={() => toast(`📌 ${n.title}`)}
                  >
                    <motion.div whileHover={{ scale: 1.15, rotate: 10 }} className="w-10 h-10 rounded-full bg-foreground/[0.08] flex items-center justify-center text-xl shrink-0">{n.icon}</motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{n.title}</span>
                        {!n.read && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }} className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-envle-text-muted mt-0.5 truncate">{n.body}</p>
                      <span className="text-[10px] text-envle-text-muted mt-1 block">{n.time}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-envle-text-muted">
                  <span className="text-4xl mb-3">🔔</span>
                  <span className="text-sm">Aucune notification</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
export { mockNotifications };
