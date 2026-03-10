import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

interface MobileNavProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  onOpenAuth: () => void;
  onOpenCall: () => void;
}

const bottomNavItems = [
  { id: "chat", icon: "💬", label: "Messages", badge: 5 },
  { id: "stories", icon: "✨", label: "Stories" },
  { id: "community", icon: "👥", label: "Communauté" },
  { id: "shop", icon: "🛍️", label: "Boutique" },
  { id: "more", icon: "⋯", label: "Plus" },
];

const MobileNav = ({ activeNav, onNavChange, onOpenAuth, onOpenCall }: MobileNavProps) => {
  const { theme, toggleTheme } = useTheme();

  const handleNav = (id: string) => {
    if (id === "more") {
      toast("📋 Plus d'options bientôt");
      return;
    }
    onNavChange(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-envle-card border-t border-envle-border flex items-center justify-around py-2 px-1 md:hidden safe-area-bottom">
      {bottomNavItems.map((item) => (
        <motion.button
          key={item.id}
          whileTap={{ scale: 0.85 }}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl border-none cursor-pointer transition-colors relative ${
            activeNav === item.id
              ? "text-envle-vert-light"
              : "text-envle-text-muted"
          }`}
          style={{ background: "transparent" }}
          onClick={() => handleNav(item.id)}
        >
          {activeNav === item.id && (
            <motion.span
              layoutId="mobile-nav-indicator"
              className="absolute -top-2 w-8 h-1 rounded-full bg-primary"
            />
          )}
          <span className="text-xl relative">
            {item.icon}
            {item.badge && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-envle-rouge text-[8px] font-bold flex items-center justify-center text-foreground">
                {item.badge}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">{item.label}</span>
        </motion.button>
      ))}
    </nav>
  );
};

export default MobileNav;
