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
      <div className="px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <button className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</button>
        <h2 className="font-display text-2xl font-bold flex-1">Carte & Localisation</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className={`px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${showFriends ? "bg-primary/20 border-primary/30 text-envle-vert-light" : "border-envle-border text-envle-text-muted"}`}
          onClick={() => setShowFriends(!showFriends)}
        >
          👥 Amis
        </motion.button>
      </div>

      {/* Map placeholder */}
      <div className="h-[200px] relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-fond)))" }}>
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
          <span className="text-6xl">🗺️</span>
          <span className="text-sm text-envle-text-muted">Carte interactive — Abidjan, CI</span>
          <span className="text-xs text-envle-vert-light">📍 Position actuelle: Plateau</span>
        </div>
        {/* Floating pins */}
        {[{ top: "20%", left: "30%", icon: "📍" }, { top: "40%", left: "60%", icon: "📍" }, { top: "60%", left: "45%", icon: "📍" }, { top: "35%", left: "75%", icon: "👤" }].map((pin, i) => (
          <motion.div key={i} className="absolute text-xl" style={{ top: pin.top, left: pin.left }} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>{pin.icon}</motion.div>
        ))}
      </div>

      {/* Nearby friends */}
      <AnimatePresence>
        {showFriends && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-envle-border">
            <div className="px-6 py-3 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {nearbyFriends.map((f) => (
                <motion.div key={f.name} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 bg-envle-card border border-envle-border rounded-full px-3 py-2 shrink-0 cursor-pointer" onClick={() => toast(`📍 ${f.name} est à ${f.distance}`)}>
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
        {categories.map((cat) => (
          <motion.button key={cat} whileTap={{ scale: 0.95 }} className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${activeCat === cat ? "bg-primary/20 text-envle-vert-light" : "bg-foreground/[0.04] text-envle-text-muted"}`} onClick={() => setActiveCat(cat)}>{cat}</motion.button>
        ))}
      </div>

      {/* Places list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {mockPlaces.map((place, i) => (
          <motion.div key={place.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 px-6 py-3.5 hover:bg-foreground/[0.03] transition-colors cursor-pointer border-b border-envle-border/50" onClick={() => toast(`📍 Navigation vers ${place.name}`)}>
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl shrink-0" style={{ background: place.bgStyle }}>{place.icon}</div>
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
              <motion.button whileTap={{ scale: 0.9 }} className="text-xs text-envle-text-muted mt-1 bg-transparent border-none cursor-pointer hover:text-envle-vert-light" onClick={(e) => { e.stopPropagation(); toast("🧭 Navigation démarrée"); }}>Itinéraire →</motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MapModule;
