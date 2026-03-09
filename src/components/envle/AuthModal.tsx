import { useState } from "react";
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
    <div
      className={`fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-envle-card border border-envle-border rounded-3xl p-8 w-[480px] max-w-[95vw] transition-transform duration-300 ${
          open ? "translate-y-0 scale-100" : "translate-y-5 scale-[0.96]"
        }`}
      >
        <div className="text-4xl mb-3">🪶</div>
        <h2 className="font-display text-2xl font-bold mb-2">Bienvenue sur E'nvlé</h2>
        <p className="text-envle-text-muted text-sm mb-7">La super-app africaine · Connecté pour toujours</p>

        <div className="flex gap-1 mb-6 bg-foreground/[0.04] rounded-xl p-1">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              className={`flex-1 py-2.5 rounded-[10px] border-none font-body text-sm cursor-pointer transition-all font-medium ${
                tab === t ? "bg-primary text-foreground" : "bg-transparent text-envle-text-muted"
              }`}
              onClick={() => setTab(t)}
            >
              {t === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <>
            <InputGroup label="Numéro de téléphone ou Email" placeholder="+225 07 00 00 00 ou email@domaine.com" />
            <InputGroup label="Mot de passe" placeholder="••••••••" type="password" />
            <button
              className="w-full py-3.5 rounded-[14px] border-none text-foreground font-body text-[15px] font-bold cursor-pointer mt-2 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_hsla(142,47%,33%,0.4)] hover:shadow-[0_8px_28px_hsla(142,47%,33%,0.5)]"
              style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
              onClick={doAuth}
            >
              🚀 Connexion sécurisée
            </button>
            <div className="text-center text-envle-text-muted text-[13px] my-5 relative">
              <span className="relative z-10 bg-envle-card px-3">ou continuer avec</span>
              <div className="absolute top-1/2 left-0 right-0 h-px bg-envle-border" />
            </div>
            <div className="flex gap-2.5">
              {[{ icon: "📱", label: "WhatsApp OTP" }, { icon: "📧", label: "Email OTP" }].map((s) => (
                <button
                  key={s.label}
                  className="flex-1 py-2.5 rounded-xl border border-envle-border bg-foreground/[0.04] text-foreground font-body text-[13px] cursor-pointer transition-all hover:border-primary flex items-center justify-center gap-2"
                  onClick={() => toast(`${s.icon} Code envoyé`)}
                >
                  {s.icon} {s.label}
                </button>
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
                {countries.map((c) => (
                  <option key={c} className="bg-envle-card">{c}</option>
                ))}
              </select>
            </div>
            <button
              className="w-full py-3.5 rounded-[14px] border-none text-foreground font-body text-[15px] font-bold cursor-pointer mt-2 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_hsla(142,47%,33%,0.4)]"
              style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
              onClick={doAuth}
            >
              📱 Recevoir le code OTP
            </button>
            <p className="text-[11px] text-envle-text-muted text-center mt-3">
              Le code sera envoyé via WhatsApp ou SMS selon votre numéro
            </p>
          </>
        )}

        <p className="text-center mt-5 text-xs text-envle-text-muted">
          🔒 Chiffrement end-to-end · Données sauvegardées à vie
        </p>
      </div>
    </div>
  );
};

const InputGroup = ({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) => (
  <div className="mb-4">
    <label className="text-xs text-envle-text-muted block mb-1.5 font-semibold uppercase tracking-[0.5px]">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-foreground/[0.06] border border-envle-border rounded-xl text-foreground font-body text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsla(142,47%,33%,0.15)] transition-all placeholder:text-envle-text-muted"
    />
  </div>
);

export default AuthModal;
