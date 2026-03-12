import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const countries = [
  "🇨🇮 Côte d'Ivoire", "🇸🇳 Sénégal", "🇬🇳 Guinée", "🇲🇱 Mali",
  "🇧🇫 Burkina Faso", "🇹🇬 Togo", "🇨🇲 Cameroun", "🇨🇩 RD Congo",
  "🇳🇬 Nigeria", "🇬🇭 Ghana",
];

const AuthModal = ({ open, onClose }: Props) => {
  const [tab, setTab] = useState<"login" | "register">("login");

  const doAuth = () => {
    onClose();
    toast("✅ Connecté — Toutes vos données sont synchronisées!");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-envle-card border border-envle-border rounded-3xl p-8 w-[480px] max-w-[95vw]"
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring" }} className="text-4xl mb-3">🪶</motion.div>
            <motion.h2 initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="font-display text-2xl font-bold mb-2">Bienvenue sur E'nvlé</motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-envle-text-muted text-sm mb-7">La super-app africaine · Connecté pour toujours</motion.p>

            <div className="flex gap-1 mb-6 bg-foreground/[0.04] rounded-xl p-1">
              {(["login", "register"] as const).map((t) => (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 py-2.5 rounded-[10px] border-none font-body text-sm cursor-pointer transition-all font-medium ${
                    tab === t ? "bg-primary text-foreground" : "bg-transparent text-envle-text-muted"
                  }`}
                  onClick={() => setTab(t)}
                >
                  {t === "login" ? "Connexion" : "Inscription"}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, x: tab === "login" ? -15 : 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: tab === "login" ? 15 : -15 }} transition={{ duration: 0.2 }}>
                {tab === "login" ? (
                  <>
                    <InputGroup label="Numéro de téléphone ou Email" placeholder="+225 07 00 00 00 ou email@domaine.com" />
                    <InputGroup label="Mot de passe" placeholder="••••••••" type="password" />
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ y: -2 }}
                      className="w-full py-3.5 rounded-[14px] border-none text-foreground font-body text-[15px] font-bold cursor-pointer mt-2 transition-all shadow-[0_4px_20px_hsla(142,47%,33%,0.4)] hover:shadow-[0_8px_28px_hsla(142,47%,33%,0.5)]"
                      style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
                      onClick={doAuth}
                    >
                      🚀 Connexion sécurisée
                    </motion.button>
                    <div className="text-center text-envle-text-muted text-[13px] my-5 relative">
                      <span className="relative z-10 bg-envle-card px-3">ou continuer avec</span>
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-envle-border" />
                    </div>
                    <div className="flex gap-2.5">
                      {[{ icon: "📱", label: "WhatsApp OTP" }, { icon: "📧", label: "Email OTP" }].map((s) => (
                        <motion.button
                          key={s.label}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ y: -1 }}
                          className="flex-1 py-2.5 rounded-xl border border-envle-border bg-foreground/[0.04] text-foreground font-body text-[13px] cursor-pointer transition-all hover:border-primary flex items-center justify-center gap-2"
                          onClick={() => toast(`${s.icon} Code envoyé`)}
                        >
                          {s.icon} {s.label}
                        </motion.button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <InputGroup label="Prénom & Nom" placeholder="Ex: Amara Diallo" />
                    <InputGroup label="Numéro de téléphone" placeholder="+225 07 00 00 00" />
                    <InputGroup label="Email (optionnel)" placeholder="email@domaine.com" type="email" />
                    <div className="mb-4">
                      <label className="text-xs text-envle-text-muted block mb-1.5 font-semibold uppercase tracking-[0.5px]">Pays</label>
                      <select className="w-full px-4 py-3 bg-foreground/[0.06] border border-envle-border rounded-xl text-foreground font-body text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsla(142,47%,33%,0.15)] transition-all">
                        {countries.map((c) => (<option key={c} className="bg-envle-card">{c}</option>))}
                      </select>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ y: -2 }}
                      className="w-full py-3.5 rounded-[14px] border-none text-foreground font-body text-[15px] font-bold cursor-pointer mt-2 transition-all shadow-[0_4px_20px_hsla(142,47%,33%,0.4)]"
                      style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
                      onClick={doAuth}
                    >
                      📱 Recevoir le code OTP
                    </motion.button>
                    <p className="text-[11px] text-envle-text-muted text-center mt-3">Le code sera envoyé via WhatsApp ou SMS selon votre numéro</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <p className="text-center mt-5 text-xs text-envle-text-muted">🔒 Chiffrement end-to-end · Données sauvegardées à vie</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const InputGroup = ({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) => (
  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
    <label className="text-xs text-envle-text-muted block mb-1.5 font-semibold uppercase tracking-[0.5px]">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-foreground/[0.06] border border-envle-border rounded-xl text-foreground font-body text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsla(142,47%,33%,0.15)] transition-all placeholder:text-envle-text-muted"
    />
  </motion.div>
);

export default AuthModal;
