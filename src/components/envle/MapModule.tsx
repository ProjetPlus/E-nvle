import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const categories = ["Tout", "Restaurants", "Coworking", "Culture", "Marchés", "Santé"];

const MapModule = ({ onBack }: { onBack: () => void }) => {
  const [activeCat, setActiveCat] = useState("Tout");
  const [showFriends, setShowFriends] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 md:px-6 py-3 md:py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.85 }} className="w-9 h-9 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</motion.button>
        <h2 className="font-display text-xl md:text-2xl font-bold flex-1">Carte & Localisation</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${showFriends ? "bg-primary/20 border-primary/30 text-envle-vert-light" : "border-envle-border text-envle-text-muted"}`}
          onClick={() => setShowFriends(!showFriends)}
        >
          👥 Amis
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[180px] md:h-[200px] relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-fond)))" }}>
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
          <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl">🗺️</motion.span>
          <span className="text-xs text-envle-text-muted">Carte interactive</span>
          <motion.span animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} className="text-[11px] text-envle-vert-light">📍 Position actuelle</motion.span>
        </div>
      </motion.div>

      <div className="flex px-4 md:px-6 gap-1.5 py-2 overflow-x-auto border-b border-envle-border" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <motion.button key={cat} whileTap={{ scale: 0.92 }} className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${activeCat === cat ? "bg-primary/20 text-envle-vert-light" : "bg-foreground/[0.04] text-envle-text-muted"}`} onClick={() => setActiveCat(cat)}>{cat}</motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-40 text-center">
          <span className="text-4xl mb-3">📍</span>
          <p className="text-envle-text-muted text-sm">Activez la géolocalisation</p>
          <p className="text-envle-text-muted text-xs mt-1">pour découvrir les lieux à proximité</p>
        </motion.div>
      </div>
    </div>
  );
};

export default MapModule;
