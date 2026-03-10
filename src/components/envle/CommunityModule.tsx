import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Community {
  id: string;
  name: string;
  icon: string;
  bgStyle: string;
  members: number;
  description: string;
  category: string;
  isJoined: boolean;
  lastActivity: string;
  posts: number;
}

const mockCommunities: Community[] = [
  { id: "1", name: "Dev Africa 🌍", icon: "💻", bgStyle: "linear-gradient(135deg,#2D7D46,#1a5c30)", members: 12480, description: "La plus grande communauté de développeurs africains", category: "Tech", isJoined: true, lastActivity: "Il y a 5 min", posts: 342 },
  { id: "2", name: "Entrepreneuriat Sahel", icon: "🚀", bgStyle: "linear-gradient(135deg,#f59e0b,#b45309)", members: 8920, description: "Startups et business en Afrique de l'Ouest", category: "Business", isJoined: false, lastActivity: "Il y a 12 min", posts: 189 },
  { id: "3", name: "Art & Culture Africaine", icon: "🎨", bgStyle: "linear-gradient(135deg,#ec4899,#be185d)", members: 15600, description: "Célébrons l'art africain sous toutes ses formes", category: "Culture", isJoined: true, lastActivity: "Il y a 1h", posts: 567 },
  { id: "4", name: "Mode Wax & Design", icon: "👗", bgStyle: "linear-gradient(135deg,#7c3aed,#4c1d95)", members: 6340, description: "Tendances mode et créateurs africains", category: "Mode", isJoined: false, lastActivity: "Il y a 2h", posts: 234 },
  { id: "5", name: "Football Africain ⚽", icon: "⚽", bgStyle: "linear-gradient(135deg,#16a34a,#15803d)", members: 45200, description: "CAN, championnats locaux, transferts", category: "Sport", isJoined: true, lastActivity: "Il y a 30 min", posts: 1205 },
  { id: "6", name: "Diaspora Connect", icon: "✈️", bgStyle: "linear-gradient(135deg,#0ea5e9,#0369a1)", members: 21800, description: "Réseau pour les Africains de la diaspora", category: "Social", isJoined: false, lastActivity: "Il y a 45 min", posts: 890 },
];

const categories = ["Toutes", "Tech", "Business", "Culture", "Mode", "Sport"];

const CommunityModule = ({ onBack }: { onBack: () => void }) => {
  const [activeCat, setActiveCat] = useState("Toutes");
  const [communities, setCommunities] = useState(mockCommunities);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const filtered = activeCat === "Toutes" ? communities : communities.filter((c) => c.category === activeCat);

  const toggleJoin = (id: string) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, isJoined: !c.isJoined, members: c.isJoined ? c.members - 1 : c.members + 1 }
          : c
      )
    );
    const c = communities.find((c) => c.id === id);
    toast(c?.isJoined ? `👋 Vous avez quitté ${c.name}` : `✅ Bienvenue dans ${c?.name}!`);
  };

  const formatMembers = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString());

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <button
          className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden"
          onClick={onBack}
        >
          ←
        </button>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold">Communautés</h2>
          <p className="text-xs text-envle-text-muted">{communities.filter((c) => c.isJoined).length} communautés rejointes</p>
        </div>
        <button
          className="px-4 py-2 rounded-xl border-none font-body text-sm cursor-pointer font-semibold text-primary-foreground transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
          onClick={() => toast("🌍 Créer une communauté — Bientôt disponible")}
        >
          + Créer
        </button>
      </div>

      {/* Categories */}
      <div className="flex px-6 gap-2 py-3 overflow-x-auto border-b border-envle-border" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
              activeCat === cat
                ? "bg-primary/20 text-envle-vert-light"
                : "bg-foreground/[0.04] text-envle-text-muted"
            }`}
            onClick={() => setActiveCat(cat)}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Communities list */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map((community, i) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="bg-envle-card border border-envle-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setSelectedCommunity(community)}
              >
                {/* Banner */}
                <div
                  className="h-24 relative flex items-center justify-center text-4xl"
                  style={{ background: community.bgStyle }}
                >
                  {community.icon}
                  {community.isJoined && (
                    <span className="absolute top-2 right-2 bg-primary/80 text-[10px] font-bold px-2 py-0.5 rounded-full text-primary-foreground">
                      Membre
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-base font-bold mb-1">{community.name}</div>
                  <p className="text-xs text-envle-text-muted mb-3 line-clamp-2">{community.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-envle-text-muted">
                      <span>👥 {formatMembers(community.members)}</span>
                      <span>📝 {community.posts}</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className={`px-4 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        community.isJoined
                          ? "bg-transparent border-envle-border text-envle-text-muted hover:border-envle-rouge hover:text-envle-rouge"
                          : "border-transparent text-primary-foreground"
                      }`}
                      style={!community.isJoined ? { background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" } : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleJoin(community.id);
                      }}
                    >
                      {community.isJoined ? "Quitter" : "Rejoindre"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Community detail overlay */}
      <AnimatePresence>
        {selectedCommunity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setSelectedCommunity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-envle-card border border-envle-border rounded-3xl w-[480px] max-w-[95vw] max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="h-32 relative flex items-center justify-center text-5xl"
                style={{ background: selectedCommunity.bgStyle }}
              >
                {selectedCommunity.icon}
                <button
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border-none text-white cursor-pointer flex items-center justify-center"
                  onClick={() => setSelectedCommunity(null)}
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">{selectedCommunity.name}</h3>
                <p className="text-sm text-envle-text-muted mb-4">{selectedCommunity.description}</p>
                <div className="flex items-center gap-4 text-sm text-envle-text-muted mb-6">
                  <span>👥 {formatMembers(selectedCommunity.members)} membres</span>
                  <span>📝 {selectedCommunity.posts} publications</span>
                  <span>⏰ {selectedCommunity.lastActivity}</span>
                </div>

                {/* Mock posts */}
                <h4 className="text-sm font-bold mb-3">Publications récentes</h4>
                {[
                  { user: "Amadou K.", text: "Qui participe au hackathon de ce week-end? 🚀", time: "Il y a 5 min", likes: 24 },
                  { user: "Mariam D.", text: "Nouveau tutoriel React disponible sur ma chaîne 📺", time: "Il y a 1h", likes: 56 },
                ].map((post, i) => (
                  <div key={i} className="bg-foreground/[0.04] rounded-xl p-3 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">{post.user[0]}</div>
                      <span className="text-sm font-semibold">{post.user}</span>
                      <span className="text-xs text-envle-text-muted ml-auto">{post.time}</span>
                    </div>
                    <p className="text-sm mb-2">{post.text}</p>
                    <div className="flex items-center gap-4 text-xs text-envle-text-muted">
                      <span>❤️ {post.likes}</span>
                      <span>💬 Commenter</span>
                      <span>↗ Partager</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityModule;
