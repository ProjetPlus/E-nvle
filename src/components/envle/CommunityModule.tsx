import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Community {
  id: string;
  name: string;
  icon: string;
  bgStyle: string;
  members: number;
  description: string;
  category: string;
  isJoined: boolean;
}

const categories = ["Toutes", "Tech", "Business", "Culture", "Mode", "Sport"];

const CommunityModule = ({ onBack }: { onBack: () => void }) => {
  const [activeCat, setActiveCat] = useState("Toutes");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const { user } = useAuth();

  useEffect(() => { fetchCommunities(); }, [user]);

  const fetchCommunities = async () => {
    setLoading(true);
    const { data } = await supabase.from("communities").select("*").order("member_count", { ascending: false });
    let joinedIds: string[] = [];
    if (user) {
      const { data: memberships } = await supabase.from("community_members").select("community_id").eq("user_id", user.id);
      joinedIds = (memberships || []).map(m => m.community_id);
    }
    if (data) {
      setCommunities(data.map(c => ({
        id: c.id, name: c.name, icon: c.name.includes("Tech") ? "💻" : c.name.includes("Art") ? "🎨" : "🌍",
        bgStyle: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))",
        members: c.member_count || 0, description: c.description || "", category: "Toutes",
        isJoined: joinedIds.includes(c.id),
      })));
    }
    setLoading(false);
  };

  const toggleJoin = async (id: string) => {
    if (!user) { toast.error("Connectez-vous d'abord"); return; }
    const c = communities.find(c => c.id === id);
    if (!c) return;
    if (c.isJoined) {
      await supabase.from("community_members").delete().eq("community_id", id).eq("user_id", user.id);
      toast(`👋 Vous avez quitté ${c.name}`);
    } else {
      await supabase.from("community_members").insert({ community_id: id, user_id: user.id });
      toast(`✅ Bienvenue dans ${c.name}!`);
    }
    fetchCommunities();
  };

  const formatMembers = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString());

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 md:px-6 py-3 md:py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.85 }} className="w-9 h-9 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</motion.button>
        <div className="flex-1">
          <h2 className="font-display text-xl md:text-2xl font-bold">Communautés</h2>
          <p className="text-[11px] text-envle-text-muted">{communities.filter(c => c.isJoined).length} rejointes</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} className="px-3 py-1.5 rounded-xl border-none font-body text-xs cursor-pointer font-semibold text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={() => toast("🌍 Créer une communauté — Bientôt disponible")}>+ Créer</motion.button>
      </motion.div>

      <div className="flex px-4 md:px-6 gap-1.5 py-2 overflow-x-auto border-b border-envle-border" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <motion.button key={cat} whileTap={{ scale: 0.92 }} className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${activeCat === cat ? "bg-primary/20 text-envle-vert-light" : "bg-foreground/[0.04] text-envle-text-muted"}`} onClick={() => setActiveCat(cat)}>{cat}</motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-40"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-3xl">⏳</motion.span></div>
        ) : communities.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-40 text-center">
            <span className="text-4xl mb-3">👥</span>
            <p className="text-envle-text-muted text-sm">Aucune communauté disponible</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {communities.map((community, i) => (
                <motion.div
                  key={community.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="bg-envle-card border border-envle-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => setSelectedCommunity(community)}
                >
                  <div className="h-20 relative flex items-center justify-center text-3xl overflow-hidden" style={{ background: community.bgStyle }}>
                    <span className="group-hover:scale-110 transition-transform duration-500">{community.icon}</span>
                    {community.isJoined && (
                      <span className="absolute top-2 right-2 bg-primary/80 text-[10px] font-bold px-2 py-0.5 rounded-full text-primary-foreground">Membre</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-bold mb-1">{community.name}</div>
                    <p className="text-[11px] text-envle-text-muted mb-2 line-clamp-2">{community.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-envle-text-muted">👥 {formatMembers(community.members)}</span>
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        className={`px-3 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                          community.isJoined ? "bg-transparent border-envle-border text-envle-text-muted" : "border-transparent text-primary-foreground"
                        }`}
                        style={!community.isJoined ? { background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" } : undefined}
                        onClick={(e) => { e.stopPropagation(); toggleJoin(community.id); }}
                      >
                        {community.isJoined ? "Quitter" : "Rejoindre"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedCommunity && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedCommunity(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }} className="bg-envle-card border border-envle-border rounded-3xl w-full max-w-[440px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="h-28 relative flex items-center justify-center text-4xl" style={{ background: selectedCommunity.bgStyle }}>
                {selectedCommunity.icon}
                <motion.button whileTap={{ scale: 0.8 }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border-none text-white cursor-pointer flex items-center justify-center" onClick={() => setSelectedCommunity(null)}>✕</motion.button>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold mb-1">{selectedCommunity.name}</h3>
                <p className="text-sm text-envle-text-muted mb-3">{selectedCommunity.description}</p>
                <div className="text-sm text-envle-text-muted">👥 {formatMembers(selectedCommunity.members)} membres</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityModule;
