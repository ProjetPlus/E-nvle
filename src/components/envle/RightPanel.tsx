import { toast } from "sonner";
import type { Conversation } from "./ConversationPanel";

const RightPanel = ({ conv, onOpenCall }: { conv: Conversation; onOpenCall: (type: string) => void }) => {
  return (
    <div className="w-[300px] bg-envle-card border-l border-envle-border flex flex-col overflow-y-auto p-5 scrollbar-thin max-lg:hidden">
      {/* Profile */}
      <div className="flex flex-col items-center gap-2.5 pb-5 border-b border-envle-border">
        <div
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[28px] font-bold border-[3px] border-primary"
          style={{ background: conv.avatarStyle }}
        >
          {conv.avatar}
        </div>
        <div className="text-lg font-bold">{conv.name}</div>
        <span className="bg-primary/20 text-envle-vert-light text-[11px] px-2.5 py-[3px] rounded-full font-semibold">
          ✅ Profil Vérifié
        </span>
        <p className="text-xs text-envle-text-muted text-center">
          {conv.status || "Architecte & Designer"} · 🇨🇮
          <br />
          Passionnée de tech africaine
        </p>
      </div>

      {/* Info */}
      <div className="mt-5">
        <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-3">Infos</h4>
        {[
          { icon: "📞", label: "Téléphone", value: "+225 07 xx xx xx" },
          { icon: "📍", label: "Localisation", value: "Abidjan, Côte d'Ivoire" },
          { icon: "💼", label: "Profession", value: "Architecte Senior" },
        ].map((info) => (
          <div key={info.label} className="flex items-center gap-2.5 py-2">
            <span className="text-lg opacity-70">{info.icon}</span>
            <div>
              <div className="text-[13px] text-envle-text-muted">{info.label}</div>
              <div className="text-[13px] font-medium">{info.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Media */}
      <div className="mt-5">
        <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-3">Médias partagés</h4>
        <div className="grid grid-cols-3 gap-1">
          {["🏛️", "🌅", "🎨", "🏙️", "🌿", "+14"].map((icon) => (
            <div
              key={icon}
              className="aspect-square rounded-lg flex items-center justify-center text-[22px] cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: "linear-gradient(135deg, #1a2a1a, #2d4a2d)" }}
              onClick={() => toast("🖼️ Photo")}
            >
              {icon}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-5">
        <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-3">Actions rapides</h4>
        {[
          { icon: "📹", label: "Démarrer un appel vidéo", color: "primary", onClick: () => onOpenCall("video") },
          { icon: "📍", label: "Voir sur la carte", color: "secondary", onClick: () => toast("📍 Voir sur la carte") },
          { icon: "💸", label: "Envoyer de l'argent", color: "bleu", onClick: () => toast("💸 Envoi de fonds via Portefeuille E'nvlé") },
        ].map((action) => (
          <button
            key={action.label}
            className={`w-full p-2.5 rounded-xl border font-body text-[13px] cursor-pointer mb-2 transition-all ${
              action.color === "primary"
                ? "bg-primary/[0.15] border-primary/30 text-envle-vert-light hover:bg-primary/25"
                : action.color === "secondary"
                ? "bg-secondary/10 border-secondary/20 text-envle-or-light hover:bg-secondary/20"
                : "bg-envle-bleu/10 border-envle-bleu/20 text-blue-300 hover:bg-envle-bleu/20"
            }`}
            onClick={action.onClick}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RightPanel;
