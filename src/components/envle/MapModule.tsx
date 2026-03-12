import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Place {
  id: string;
  name: string;
  type: string;
  distance: string;
  icon: string;
  bgStyle: string;
  rating: number;
  address: string;
  isOpen: boolean;
}

const mockPlaces: Place[] = [
  { id: "1", name: "TechHub Coworking", type: "Espace de travail", distance: "0.3 km", icon: "💻", bgStyle: "linear-gradient(135deg,#0ea5e9,#2563eb)", rating: 4.8, address: "Plateau, Abidjan", isOpen: true },
  { id: "2", name: "Café Afrique", type: "Restaurant", distance: "0.5 km", icon: "☕", bgStyle: "linear-gradient(135deg,#78350f,#451a03)", rating: 4.6, address: "Cocody, Abidjan", isOpen: true },
  { id: "3", name: "Galerie Wax Art", type: "Culture", distance: "1.2 km", icon: "🎨", bgStyle: "linear-gradient(135deg,#ec4899,#be185d)", rating: 4.9, address: "Zone 4, Abidjan", isOpen: false },
  { id: "4", name: "Marché de Treichville", type: "Marché", distance: "2.1 km", icon: "🛒", bgStyle: "linear-gradient(135deg,#f59e0b,#b45309)", rating: 4.3, address: "Treichville, Abidjan", isOpen: true },
  { id: "5", name: "Stadium FHB", type: "Sport", distance: "3.5 km", icon: "⚽", bgStyle: "linear-gradient(135deg,#16a34a,#15803d)", rating: 4.7, address: "Plateau, Abidjan", isOpen: true },
  { id: "6", name: "Pharmacie du Plateau", type: "Santé", distance: "0.8 km", icon: "💊", bgStyle: "linear-gradient(135deg,#ef4444,#b91c1c)", rating: 4.5, address: "Plateau, Abidjan", isOpen: true },
];

const nearbyFriends = [
  { name: "Amara D.", avatar: "A", avatarStyle: "linear-gradient(135deg,#7c3aed,#ec4899)", distance: "200m" },
  { name: "Kofi M.", avatar: "K", avatarStyle: "linear-gradient(135deg,#f59e0b,#ef4444)", distance: "1.5 km" },
  { name: "Fatima T.", avatar: "F", avatarStyle: "linear-gradient(135deg,#10b981,#059669)", distance: "3 km" },
];

const categories = ["Tout", "Restaurants", "Coworking", "Culture", "Marchés", "Santé"];

const MapModule = ({ onBack }: { onBack: () => void }) => {
  const [activeCat, setActiveCat] = useState("Tout");
  const [showFriends, setShowFriends] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.85 }} className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</motion.button>
        <h2 className="font-display text-2xl font-bold flex-1">Carte & Localisation</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className={`px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${showFriends ? "bg-primary/20 border-primary/30 text-envle-vert-light" : "border-envle-border text-envle-text-muted"}`}
          onClick={() => setShowFriends(!showFriends)}
        >
          👥 Amis
        </motion.button>
      </motion.div>

      {/* Map placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="h-[200px] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-fond)))" }}
      >
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
          <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="text-6xl">🗺️</motion.span>
          <span className="text-sm text-envle-text-muted">Carte interactive — Abidjan, CI</span>
          <motion.span animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs text-envle-vert-light">📍 Position actuelle: Plateau</motion.span>
        </div>
        {[{ top: "20%", left: "30%", icon: "📍" }, { top: "40%", left: "60%", icon: "📍" }, { top: "60%", left: "45%", icon: "📍" }, { top: "35%", left: "75%", icon: "👤" }].map((pin, i) => (
          <motion.div key={i} className="absolute text-xl cursor-pointer" style={{ top: pin.top, left: pin.left }} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} whileHover={{ scale: 1.3 }}>{pin.icon}</motion.div>
        ))}
      </motion.div>

      {/* Nearby friends */}
      <AnimatePresence>
        {showFriends && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="overflow-hidden border-b border-envle-border">
            <div className="px-6 py-3 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {nearbyFriends.map((f, i) => (
                <motion.div key={f.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} whileTap={{ scale: 0.92 }} whileHover={{ y: -2 }} className="flex items-center gap-2 bg-envle-card border border-envle-border rounded-full px-3 py-2 shrink-0 cursor-pointer" onClick={() => toast(`📍 ${f.name} est à ${f.distance}`)}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: f.avatarStyle }}>{f.avatar}</div>
                  <span className="text-xs font-semibold">{f.name}</span>
                  <span className="text-[10px] text-envle-text-muted">{f.distance}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="flex px-6 gap-2 py-3 overflow-x-auto border-b border-envle-border" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat, i) => (
          <motion.button key={cat} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.92 }} whileHover={{ y: -1 }} className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${activeCat === cat ? "bg-primary/20 text-envle-vert-light" : "bg-foreground/[0.04] text-envle-text-muted"}`} onClick={() => setActiveCat(cat)}>{cat}</motion.button>
        ))}
      </div>

      {/* Places list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {mockPlaces.map((place, i) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
            whileHover={{ x: 4, backgroundColor: "hsla(142, 47%, 33%, 0.03)" }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-6 py-3.5 transition-colors cursor-pointer border-b border-envle-border/50"
            onClick={() => toast(`📍 Navigation vers ${place.name}`)}
          >
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl shrink-0" style={{ background: place.bgStyle }}>{place.icon}</motion.div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold flex items-center gap-2">
                {place.name}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${place.isOpen ? "bg-primary/20 text-envle-vert-light" : "bg-envle-rouge/20 text-envle-rouge"}`}>
                  {place.isOpen ? "Ouvert" : "Fermé"}
                </span>
              </div>
              <div className="text-xs text-envle-text-muted mt-0.5">{place.type} · {place.address}</div>
              <div className="text-xs text-envle-or mt-0.5">⭐ {place.rating}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-envle-vert-light">{place.distance}</div>
              <motion.button whileTap={{ scale: 0.85 }} className="text-xs text-envle-text-muted mt-1 bg-transparent border-none cursor-pointer hover:text-envle-vert-light" onClick={(e) => { e.stopPropagation(); toast("🧭 Navigation démarrée"); }}>Itinéraire →</motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MapModule;
