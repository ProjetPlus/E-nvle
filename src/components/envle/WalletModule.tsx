import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "sent" | "received" | "purchase" | "topup";
  name: string;
  amount: string;
  date: string;
  icon: string;
  status: "completed" | "pending";
}

const mockTransactions: Transaction[] = [
  { id: "1", type: "received", name: "Fatima Traoré", amount: "+25 000 FCFA", date: "Aujourd'hui, 14:30", icon: "💰", status: "completed" },
  { id: "2", type: "sent", name: "Kofi Mensah", amount: "-10 000 FCFA", date: "Aujourd'hui, 11:15", icon: "📤", status: "completed" },
  { id: "3", type: "purchase", name: "Tissu Wax Premium", amount: "-15 000 FCFA", date: "Hier, 16:42", icon: "🛍️", status: "completed" },
  { id: "4", type: "topup", name: "Recharge Mobile Money", amount: "+50 000 FCFA", date: "Hier, 09:00", icon: "🏦", status: "completed" },
  { id: "5", type: "sent", name: "Boubacar Sylla", amount: "-5 000 FCFA", date: "Lun., 18:20", icon: "📤", status: "pending" },
  { id: "6", type: "received", name: "TechHub Dakar (Salaire)", amount: "+800 000 FCFA", date: "01 Mars", icon: "💼", status: "completed" },
];

const quickActions = [
  { icon: "📤", label: "Envoyer", color: "primary" },
  { icon: "📥", label: "Recevoir", color: "envle-or" },
  { icon: "🏦", label: "Recharger", color: "envle-bleu" },
  { icon: "📊", label: "Historique", color: "envle-vert" },
];

const WalletModule = ({ onBack }: { onBack: () => void }) => {
  const [showSend, setShowSend] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [sendTo, setSendTo] = useState("");

  const handleSend = () => {
    if (!sendAmount || !sendTo) return toast.error("Remplissez tous les champs");
    toast.success(`📤 ${sendAmount} FCFA envoyé à ${sendTo}`);
    setShowSend(false);
    setSendAmount("");
    setSendTo("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <button className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</button>
        <h2 className="font-display text-2xl font-bold flex-1">Portefeuille</h2>
        <motion.button whileTap={{ scale: 0.9 }} className="text-xl" onClick={() => toast("⚙️ Paramètres du portefeuille")}>⚙️</motion.button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Balance card */}
        <div className="mx-6 mt-6 rounded-3xl p-6 text-primary-foreground relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)), hsl(var(--envle-or)))" }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 0%, transparent 50%)" }} />
          <div className="relative z-10">
            <div className="text-sm opacity-80 mb-1">Solde disponible</div>
            <div className="text-4xl font-bold font-display mb-1">845 000</div>
            <div className="text-sm opacity-70 mb-6">FCFA · ≈ €1 288</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded-lg">💳 •••• 4521</span>
              <span className="bg-white/20 px-2 py-1 rounded-lg">📱 Mobile Money</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-3 px-6 my-6">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.9 }}
              whileHover={{ y: -2 }}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-envle-card border border-envle-border cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => {
                if (action.label === "Envoyer") setShowSend(true);
                else if (action.label === "Recevoir") toast("📥 Partagez votre QR code pour recevoir");
                else if (action.label === "Recharger") toast("🏦 Rechargement via Mobile Money / Carte");
                else toast("📊 Historique complet");
              }}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium text-envle-text-muted">{action.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Send modal */}
        <AnimatePresence>
          {showSend && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mx-6 mb-4 overflow-hidden">
              <div className="bg-envle-card border border-envle-border rounded-2xl p-4">
                <h3 className="text-sm font-bold mb-3">Envoyer de l'argent</h3>
                <input className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-4 py-3 text-foreground font-body text-sm mb-2 outline-none focus:border-primary placeholder:text-envle-text-muted" placeholder="Nom ou numéro du destinataire" value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
                <input className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-4 py-3 text-foreground font-body text-sm mb-3 outline-none focus:border-primary placeholder:text-envle-text-muted" placeholder="Montant (FCFA)" type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} className="flex-1 py-2.5 rounded-xl border-none text-sm font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={handleSend}>Envoyer ➤</motion.button>
                  <button className="px-4 py-2.5 rounded-xl border border-envle-border bg-transparent text-envle-text-muted text-sm cursor-pointer font-body" onClick={() => setShowSend(false)}>Annuler</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-bold mb-3">Transactions récentes</h3>
          <div className="flex flex-col gap-1">
            {mockTransactions.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 py-3 border-b border-envle-border/50 cursor-pointer hover:bg-foreground/[0.02] transition-colors rounded-xl px-2" onClick={() => toast(`📋 Détails: ${tx.name}`)}>
                <div className="w-10 h-10 rounded-full bg-foreground/[0.08] flex items-center justify-center text-xl">{tx.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{tx.name}</div>
                  <div className="text-xs text-envle-text-muted">{tx.date}{tx.status === "pending" ? " · ⏳ En attente" : ""}</div>
                </div>
                <span className={`text-sm font-bold ${tx.type === "received" || tx.type === "topup" ? "text-envle-vert-light" : "text-envle-rouge"}`}>{tx.amount}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModule;
