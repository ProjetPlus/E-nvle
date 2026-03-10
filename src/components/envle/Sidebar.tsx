import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import envleLogo from "@/assets/envle-logo.jpg";

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  onOpenAuth: () => void;
  onOpenCall: () => void;
  isOpen?: boolean;
  onClose?: () => void;
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

const Sidebar = ({ activeNav, onNavChange, onOpenAuth, onOpenCall, isOpen, onClose }: SidebarProps) => {
  const { theme, toggleTheme } = useTheme();

  const handleNav = (id: string, label: string) => {
    onNavChange(id);
    onClose?.();
  };

  const sidebarContent = (
    <nav className="w-[72px] bg-envle-noir border-r border-envle-border flex flex-col items-center py-5 gap-2 z-[100] h-full">
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-11 h-11 rounded-[14px] overflow-hidden mb-4 cursor-pointer"
        onClick={() => toast("🌍 E'nvlé — Super App Africaine")}
      >
        <img src={envleLogo} alt="E'nvlé" className="w-full h-full object-cover" />
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

  return (
    <>
      {/* Desktop sidebar */}
      <div className="max-md:hidden">{sidebarContent}</div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -80 }}
              animate={{ x: 0 }}
              exit={{ x: -80 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-[151] md:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
