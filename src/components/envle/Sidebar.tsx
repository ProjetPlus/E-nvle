import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

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
  const { theme, toggleTheme } = useTheme();

  const handleNav = (id: string, label: string) => {
    onNavChange(id);
    if (!["chat", "stories", "community", "shop"].includes(id)) {
      toast(`${label} — Module en développement`);
    }
  };

  return (
    <nav className="w-[72px] bg-envle-noir border-r border-envle-border flex flex-col items-center py-5 gap-2 z-[100] max-md:hidden">
      <motion.div
        whileHover={{ scale: 1.08, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[22px] mb-4 cursor-pointer"
        style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-or)))" }}
        onClick={() => toast("🌍 E'nvlé — Super App Africaine")}
      >
        🪶
      </motion.div>

      <div className="w-10 h-px bg-envle-border my-2" />

      {navItems.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          className={`w-12 h-12 rounded-[14px] border-none text-[22px] cursor-pointer transition-colors flex items-center justify-center relative ${
            activeNav === item.id
              ? "bg-primary/20 text-envle-vert-light"
              : "bg-transparent text-envle-text-muted hover:bg-envle-card hover:text-foreground"
          }`}
          onClick={() => handleNav(item.id, item.label)}
          title={item.label}
        >
          {activeNav === item.id && (
            <motion.span
              layoutId="nav-indicator"
              className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-7 bg-primary rounded-r"
            />
          )}
          {item.icon}
          {item.badge && (
            <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full bg-envle-rouge text-[10px] font-bold flex items-center justify-center text-foreground">
              {item.badge}
            </span>
          )}
        </motion.button>
      ))}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 rounded-[14px] border-none text-[22px] cursor-pointer transition-colors flex items-center justify-center bg-transparent text-envle-text-muted hover:bg-envle-card hover:text-foreground"
        onClick={onOpenCall}
        title="Réunions (50 pers.)"
      >
        📹
      </motion.button>

      <div className="flex-1" />

      {/* Theme toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9, rotate: 180 }}
        className="w-12 h-12 rounded-[14px] border-none text-[22px] cursor-pointer transition-colors flex items-center justify-center bg-transparent text-envle-text-muted hover:bg-envle-card hover:text-foreground"
        onClick={toggleTheme}
        title={theme === "dark" ? "Mode clair" : "Mode sombre"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 rounded-[14px] border-none text-[22px] cursor-pointer transition-colors flex items-center justify-center bg-transparent text-envle-text-muted hover:bg-envle-card hover:text-foreground"
        onClick={() => toast("⚙️ Paramètres")}
        title="Paramètres"
      >
        ⚙️
      </motion.button>

      <motion.div
        whileHover={{ scale: 1.08 }}
        className="w-[42px] h-[42px] rounded-full border-2 border-primary cursor-pointer flex items-center justify-center font-bold text-base text-foreground mt-2"
        style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))" }}
        onClick={onOpenAuth}
      >
        KD
      </motion.div>
    </nav>
  );
};

export default Sidebar;
