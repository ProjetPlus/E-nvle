import { toast } from "sonner";

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  onOpenAuth: () => void;
  onOpenCall: () => void;
}

const navItems = [
  { id: "chat", icon: "💬", label: "Messages", badge: 5 },
  { id: "calls", icon: "📞", label: "Appels" },
  { id: "stories", icon: "✨", label: "Stories & Reels" },
  { id: "community", icon: "👥", label: "Communautés" },
  { id: "shop", icon: "🛍️", label: "Boutique & Commerce", badge: 2 },
  { id: "jobs", icon: "💼", label: "Emplois & Pages Pro" },
  { id: "map", icon: "🗺️", label: "Carte & Localisation" },
];

const Sidebar = ({ activeNav, onNavChange, onOpenAuth, onOpenCall }: SidebarProps) => {
  const handleNav = (id: string, label: string) => {
    onNavChange(id);
    if (id !== "chat") toast(`${label} — Module en développement`);
  };

  return (
    <nav className="w-[72px] bg-envle-noir border-r border-envle-border flex flex-col items-center py-5 gap-2 z-[100] max-md:w-[60px]">
      <div
        className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[22px] mb-4 cursor-pointer hover:scale-[1.08] transition-transform"
        style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-or)))" }}
        onClick={() => toast("🌍 E'nvlé — Super App Africaine")}
      >
        🪶
      </div>

      <div className="w-10 h-px bg-envle-border my-2" />

      {navItems.map((item) => (
        <button
          key={item.id}
          className={`w-12 h-12 rounded-[14px] border-none text-[22px] cursor-pointer transition-all flex items-center justify-center relative ${
            activeNav === item.id
              ? "bg-primary/20 text-envle-vert-light"
              : "bg-transparent text-envle-text-muted hover:bg-envle-card hover:text-foreground"
          }`}
          onClick={() => handleNav(item.id, item.label)}
          title={item.label}
        >
          {activeNav === item.id && (
            <span className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-7 bg-primary rounded-r" />
          )}
          {item.icon}
          {item.badge && (
            <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full bg-envle-rouge text-[10px] font-bold flex items-center justify-center text-foreground">
              {item.badge}
            </span>
          )}
        </button>
      ))}

      <button
        className="w-12 h-12 rounded-[14px] border-none text-[22px] cursor-pointer transition-all flex items-center justify-center bg-transparent text-envle-text-muted hover:bg-envle-card hover:text-foreground"
        onClick={onOpenCall}
        title="Réunions (50 pers.)"
      >
        📹
      </button>

      <div className="flex-1" />

      <button
        className="w-12 h-12 rounded-[14px] border-none text-[22px] cursor-pointer transition-all flex items-center justify-center bg-transparent text-envle-text-muted hover:bg-envle-card hover:text-foreground"
        onClick={() => toast("⚙️ Paramètres")}
        title="Paramètres"
      >
        ⚙️
      </button>

      <div
        className="w-[42px] h-[42px] rounded-full border-2 border-primary cursor-pointer flex items-center justify-center font-bold text-base text-foreground hover:scale-[1.08] transition-transform mt-2"
        style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))" }}
        onClick={onOpenAuth}
      >
        KD
      </div>
    </nav>
  );
};

export default Sidebar;
