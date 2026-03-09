import { useState } from "react";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread?: number;
  avatar: string;
  avatarStyle: string;
  isOnline?: boolean;
  isSquare?: boolean;
  status?: string;
}

const conversations: Conversation[] = [
  { id: "1", name: "Amara Diallo", lastMsg: "✓✓ Ok je regarde ça maintenant 🙏", time: "09:42", unread: 3, avatar: "A", avatarStyle: "linear-gradient(135deg,#7c3aed,#ec4899)", isOnline: true, status: "Architecte à Abidjan" },
  { id: "2", name: "🏢 TechHub Dakar", lastMsg: "Moussa: Réunion demain à 10h !", time: "09:15", unread: 12, avatar: "🏢", avatarStyle: "linear-gradient(135deg,#0ea5e9,#2563eb)", isSquare: true, status: "Groupe · 247 membres" },
  { id: "3", name: "Kofi Mensah", lastMsg: "🎤 Message vocal · 0:42", time: "Hier", avatar: "K", avatarStyle: "linear-gradient(135deg,#f59e0b,#ef4444)", status: "Développeur Full-Stack" },
  { id: "4", name: "📢 E'nvlé Officiel", lastMsg: "🚀 Nouvelle mise à jour disponible!", time: "Hier", avatar: "🪶", avatarStyle: "linear-gradient(135deg,#2D7D46,#F5A623)", isSquare: true, status: "Chaîne · 14K abonnés" },
  { id: "5", name: "Fatima Traoré", lastMsg: "📷 Photo", time: "Lun.", avatar: "F", avatarStyle: "linear-gradient(135deg,#10b981,#059669)", isOnline: true, status: "Médecin — Bamako" },
  { id: "6", name: "🛍️ Boutique Wax&Style", lastMsg: "Votre commande #1042 est confirmée", time: "Dim.", avatar: "🛍️", avatarStyle: "linear-gradient(135deg,#f97316,#dc2626)", isSquare: true, status: "Page Entreprise" },
  { id: "7", name: "🌍 Diaspora Africa", lastMsg: "Ibou: Quelqu'un à Paris ce week-end?", time: "Sam.", avatar: "🌍", avatarStyle: "linear-gradient(135deg,#2D7D46,#1a5c30)", isSquare: true, status: "Communauté · 1 248 membres" },
];

const stories = [
  { name: "Ma story", icon: "+", isAdd: true },
  { name: "Kofi D.", icon: "👤" },
  { name: "Amara", icon: "👩" },
  { name: "TechHub", icon: "🏢" },
  { name: "Diallo", icon: "🧑" },
];

const tabs = ["Tous", "Non lus", "Groupes", "Chaînes"];

interface Props {
  activeConvId: string;
  onSelectConv: (conv: Conversation) => void;
}

const ConversationPanel = ({ activeConvId, onSelectConv }: Props) => {
  const [activeTab, setActiveTab] = useState("Tous");

  return (
    <div className="w-[340px] bg-envle-card border-r border-envle-border flex flex-col overflow-hidden max-lg:w-[280px] max-md:hidden">
      <div className="px-5 pt-5">
        <h2 className="font-display text-[26px] font-bold">Messages</h2>
        <p className="text-xs text-envle-text-muted mt-0.5">5 non lus · 12 conversations</p>
      </div>

      <div className="mx-5 my-4 bg-foreground/[0.06] border border-envle-border rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
        <span>🔍</span>
        <input
          type="text"
          placeholder="Chercher ou démarrer une conv..."
          className="bg-transparent border-none outline-none text-foreground font-body text-sm flex-1 placeholder:text-envle-text-muted"
        />
      </div>

      <div className="flex px-5 gap-1 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all ${
              activeTab === tab
                ? "bg-primary/20 text-envle-vert-light"
                : "bg-transparent text-envle-text-muted"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stories */}
      <div className="flex gap-3 px-4 pt-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {stories.map((s) => (
          <div
            key={s.name}
            className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
            onClick={() => !s.isAdd && toast(`📖 Story de ${s.name}`)}
          >
            <div
              className={`w-14 h-14 rounded-full p-0.5 hover:scale-[1.08] transition-transform ${
                s.isAdd ? "border-2 border-dashed border-envle-border" : ""
              }`}
              style={!s.isAdd ? { background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-or)), hsl(var(--envle-rouge)))" } : undefined}
            >
              <div className="w-full h-full rounded-full bg-envle-card flex items-center justify-center text-[22px] border-2 border-background">
                {s.isAdd ? <span className="text-[26px] text-envle-vert-light">+</span> : s.icon}
              </div>
            </div>
            <span className="text-[11px] text-envle-text-muted max-w-[60px] text-center truncate">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 pb-5 scrollbar-thin">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`flex items-center gap-3 p-3 rounded-[14px] cursor-pointer transition-all ${
              activeConvId === conv.id ? "bg-primary/[0.12]" : "hover:bg-foreground/[0.04]"
            }`}
            onClick={() => onSelectConv(conv)}
          >
            <div
              className={`w-12 h-12 shrink-0 flex items-center justify-center font-bold text-lg relative ${
                conv.isSquare ? "rounded-[14px]" : "rounded-full"
              }`}
              style={{ background: conv.avatarStyle }}
            >
              {conv.avatar}
              {conv.isOnline && (
                <span className="absolute bottom-px right-px w-3 h-3 rounded-full bg-green-500 border-2 border-envle-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{conv.name}</div>
              <div className="text-xs text-envle-text-muted truncate mt-0.5">{conv.lastMsg}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] text-envle-text-muted">{conv.time}</span>
              {conv.unread && (
                <span className="bg-primary text-[11px] font-bold px-[7px] py-[2px] rounded-full text-foreground">
                  {conv.unread}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationPanel;
