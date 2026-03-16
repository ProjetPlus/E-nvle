import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Transaction {
  id: string;
  type: string;
  name: string;
  amount: number;
  currency: string;
  date: string;
  icon: string;
  status: string;
}

// West African & common African currencies
const CURRENCIES = [
  { code: "XOF", name: "Franc CFA (BCEAO)", symbol: "FCFA", flag: "🇨🇮" },
  { code: "XAF", name: "Franc CFA (BEAC)", symbol: "FCFA", flag: "🇨🇲" },
  { code: "GHS", name: "Cedi ghanéen", symbol: "₵", flag: "🇬🇭" },
  { code: "NGN", name: "Naira nigérian", symbol: "₦", flag: "🇳🇬" },
  { code: "GNF", name: "Franc guinéen", symbol: "FG", flag: "🇬🇳" },
  { code: "SLL", name: "Leone sierra-léonais", symbol: "Le", flag: "🇸🇱" },
  { code: "GMD", name: "Dalasi gambien", symbol: "D", flag: "🇬🇲" },
  { code: "MRU", name: "Ouguiya mauritanien", symbol: "UM", flag: "🇲🇷" },
  { code: "CVE", name: "Escudo cap-verdien", symbol: "$", flag: "🇨🇻" },
  { code: "LRD", name: "Dollar libérien", symbol: "L$", flag: "🇱🇷" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "USD", name: "Dollar US", symbol: "$", flag: "🇺🇸" },
];

const quickActions = [
  { icon: "📤", label: "Envoyer" },
  { icon: "📥", label: "Recevoir" },
  { icon: "🏦", label: "Recharger" },
  { icon: "📊", label: "Historique" },
];

const WalletModule = ({ onBack }: { onBack: () => void }) => {
  const [showSend, setShowSend] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("XOF");
  const [showCurrencies, setShowCurrencies] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setTransactions([]); setLoading(false); return; }
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    if (data) {
      setTransactions(data.map(tx => ({
        id: tx.id, type: tx.type || "credit", name: tx.description || "Transaction",
        amount: Number(tx.amount), currency: tx.currency || "XOF",
        date: tx.created_at ? new Date(tx.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "",
        icon: tx.type === "credit" ? "💰" : "📤", status: tx.status || "completed",
      })));
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!sendAmount || !sendTo || !user) return toast.error("Remplissez tous les champs");
    await supabase.from("wallet_transactions").insert({
      user_id: user.id, amount: -Number(sendAmount), currency: selectedCurrency,
      type: "debit", description: `Envoi à ${sendTo}`, status: "completed",
    });
    toast.success(`📤 ${sendAmount} ${selectedCurrency} envoyé à ${sendTo}`);
    setShowSend(false); setSendAmount(""); setSendTo("");
    fetchTransactions();
  };

  const formatAmount = (amount: number) => new Intl.NumberFormat("fr-FR").format(Math.abs(amount));
  const currencyInfo = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 md:px-6 py-3 md:py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.85 }} className="w-9 h-9 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</motion.button>
        <h2 className="font-display text-xl md:text-2xl font-bold flex-1">Portefeuille</h2>
        <motion.button whileTap={{ scale: 0.85 }} className="text-lg bg-transparent border-none cursor-pointer" onClick={() => setShowCurrencies(!showCurrencies)}>{currencyInfo.flag}</motion.button>
      </motion.div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mx-4 md:mx-6 mt-4 md:mt-6 rounded-3xl p-5 text-primary-foreground relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)), hsl(var(--envle-or)))" }}
        >
          <div className="relative z-10">
            <div className="text-xs opacity-80 mb-1">Solde disponible</div>
            <div className="text-3xl md:text-4xl font-bold font-display mb-1">0</div>
            <div className="text-xs opacity-70 mb-4">{currencyInfo.code} · {currencyInfo.name}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded-lg">📱 Mobile Money</span>
            </div>
          </div>
        </motion.div>

        {/* Currency selector */}
        <AnimatePresence>
          {showCurrencies && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mx-4 md:mx-6 mt-3 overflow-hidden">
              <div className="bg-envle-card border border-envle-border rounded-2xl p-3 max-h-[200px] overflow-y-auto scrollbar-thin">
                <p className="text-xs font-bold text-envle-text-muted mb-2">Devises</p>
                <div className="grid grid-cols-2 gap-1">
                  {CURRENCIES.map(c => (
                    <motion.button
                      key={c.code}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left cursor-pointer transition-all text-xs ${selectedCurrency === c.code ? "bg-primary/15 border-primary/40" : "bg-transparent border-envle-border/50"}`}
                      onClick={() => { setSelectedCurrency(c.code); setShowCurrencies(false); }}
                    >
                      <span>{c.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{c.code}</div>
                        <div className="text-[10px] text-envle-text-muted truncate">{c.name}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2 px-4 md:px-6 my-4">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileTap={{ scale: 0.88 }}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-envle-card border border-envle-border cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => { if (action.label === "Envoyer") setShowSend(true); else toast(`${action.icon} ${action.label}`); }}
            >
              <span className="text-xl">{action.icon}</span>
              <span className="text-[10px] font-medium text-envle-text-muted">{action.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Send modal */}
        <AnimatePresence>
          {showSend && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mx-4 md:mx-6 mb-4 overflow-hidden">
              <div className="bg-envle-card border border-envle-border rounded-2xl p-4">
                <h3 className="text-sm font-bold mb-3">Envoyer de l'argent</h3>
                <input className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm mb-2 outline-none focus:border-primary placeholder:text-envle-text-muted" placeholder="Destinataire" value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
                <input className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm mb-3 outline-none focus:border-primary placeholder:text-envle-text-muted" placeholder={`Montant (${selectedCurrency})`} type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} className="flex-1 py-2.5 rounded-xl border-none text-sm font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={handleSend}>Envoyer ➤</motion.button>
                  <button className="px-4 py-2.5 rounded-xl border border-envle-border bg-transparent text-envle-text-muted text-sm cursor-pointer font-body" onClick={() => setShowSend(false)}>Annuler</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions */}
        <div className="px-4 md:px-6 pb-6">
          <h3 className="text-xs font-bold mb-3">Transactions récentes</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="text-2xl">⏳</motion.span></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-envle-text-muted text-xs">Aucune transaction</div>
          ) : (
            <div className="flex flex-col gap-1">
              {transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 py-2.5 border-b border-envle-border/50 rounded-xl px-2"
                >
                  <div className="w-9 h-9 rounded-full bg-foreground/[0.08] flex items-center justify-center text-lg">{tx.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold">{tx.name}</div>
                    <div className="text-[11px] text-envle-text-muted">{tx.date}</div>
                  </div>
                  <span className={`text-sm font-bold ${tx.amount >= 0 ? "text-envle-vert-light" : "text-envle-rouge"}`}>
                    {tx.amount >= 0 ? "+" : "-"}{formatAmount(tx.amount)} {tx.currency}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModule;
