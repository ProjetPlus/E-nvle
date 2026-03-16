import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Story {
  id: string;
  user: string;
  avatar: string;
  avatarStyle: string;
  type: "image" | "video" | "reel";
  caption: string;
  time: string;
  views: number;
  liked: boolean;
  mediaUrl?: string;
  userId?: string;
}

const tabs = ["Tous", "Stories", "Reels", "En direct"];

const StoriesModule = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState("Tous");
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stories")
      .select("*, profiles:user_id(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setStories(data.map((s: any) => ({
        id: s.id,
        user: s.profiles?.full_name || "Utilisateur",
        avatar: (s.profiles?.full_name || "U")[0],
        avatarStyle: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))",
        type: s.media_type === "video" ? "video" : s.media_type === "reel" ? "reel" : "image",
        caption: s.caption || "",
        time: s.created_at ? getRelativeTime(s.created_at) : "",
        views: s.views_count || 0,
        liked: false,
        mediaUrl: s.media_url,
        userId: s.user_id,
      })));
    }
    setLoading(false);
  };

  const getRelativeTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setCreating(true);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error("❌ Erreur upload"); setCreating(false); return; }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    const mediaType = file.type.startsWith("video/") ? "video" : "image";

    const caption = prompt("Ajouter une légende (optionnel):") || "";

    await supabase.from("stories").insert({
      user_id: user.id,
      media_url: urlData.publicUrl,
      media_type: mediaType,
      caption,
    });

    toast.success("✅ Story publiée!");
    setCreating(false);
    fetchStories();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleView = async (story: Story) => {
    setViewingStory(story);
    if (user && story.userId !== user.id) {
      await supabase.from("story_views").insert({ story_id: story.id, viewer_id: user.id });
      await supabase.from("stories").update({ views_count: story.views + 1 }).eq("id", story.id);
    }
  };

  const toggleLike = (id: string) => {
    setStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, liked: !s.liked, views: s.liked ? s.views - 1 : s.views + 1 } : s))
    );
  };

  const filtered = stories.filter((s) => {
    if (activeTab === "Stories") return s.type === "image" || s.type === "video";
    if (activeTab === "Reels") return s.type === "reel";
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleCreateStory} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 md:px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.85 }} className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</motion.button>
        <h2 className="font-display text-xl md:text-2xl font-bold flex-1">Stories & Reels</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05, y: -1 }}
          disabled={creating}
          className="px-3 py-2 rounded-xl border-none font-body text-xs md:text-sm cursor-pointer font-semibold text-primary-foreground transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
          onClick={() => fileInputRef.current?.click()}
        >
          {creating ? "⏳" : "+ Créer"}
        </motion.button>
      </motion.div>

      <div className="flex px-4 md:px-6 gap-1 py-2 md:py-3 border-b border-envle-border overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {tabs.map((tab, i) => (
          <motion.button
            key={tab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.92 }}
            className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
              activeTab === tab ? "bg-primary/20 text-envle-vert-light" : "bg-transparent text-envle-text-muted hover:bg-foreground/[0.04]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "En direct" && (
              <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="ml-1.5 w-2 h-2 rounded-full bg-envle-rouge inline-block" />
            )}
          </motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-3xl">⏳</motion.span>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-40 text-center">
            <span className="text-4xl mb-3">✨</span>
            <p className="text-envle-text-muted text-sm">Aucune story pour le moment</p>
            <p className="text-envle-text-muted text-xs mt-1">Soyez le premier à partager!</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((story, i) => (
                <motion.div
                  key={story.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-envle-card border border-envle-border rounded-2xl overflow-hidden cursor-pointer group hover:border-primary/30 transition-all hover:shadow-[0_4px_20px_hsla(142,47%,33%,0.1)]"
                  onClick={() => handleView(story)}
                >
                  <div className="aspect-[3/4] relative overflow-hidden">
                    {story.mediaUrl ? (
                      <img src={story.mediaUrl} alt={story.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <motion.div
                        className="w-full h-full flex items-center justify-center text-4xl transition-transform duration-700"
                        whileHover={{ scale: 1.08 }}
                        style={{ background: story.avatarStyle }}
                      >
                        {story.type === "reel" ? "🎬" : story.type === "video" ? "🎥" : "📸"}
                      </motion.div>
                    )}
                    {story.type === "reel" && (
                      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] font-semibold">🎵 Reel</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 md:p-3">
                      <p className="text-xs font-medium line-clamp-2">{story.caption}</p>
                    </div>
                  </div>
                  <div className="p-2 md:p-2.5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: story.avatarStyle }}>{story.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold truncate">{story.user}</div>
                      <div className="text-[10px] text-envle-text-muted">{story.time}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-envle-text-muted shrink-0">
                      <span>👁 {story.views >= 1000 ? `${(story.views / 1000).toFixed(1)}K` : story.views}</span>
                      <motion.button
                        whileTap={{ scale: 1.5 }}
                        className="border-none bg-transparent cursor-pointer text-sm"
                        onClick={(e) => { e.stopPropagation(); toggleLike(story.id); }}
                      >
                        {story.liked ? "❤️" : "🤍"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Story viewer overlay */}
      <AnimatePresence>
        {viewingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center"
            onClick={() => setViewingStory(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-[340px] max-w-[92vw] h-[600px] max-h-[85vh] rounded-3xl overflow-hidden relative"
              style={{ background: viewingStory.avatarStyle }}
              onClick={(e) => e.stopPropagation()}
            >
              {viewingStory.mediaUrl && (
                <img src={viewingStory.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute top-3 left-3 right-3 h-1 bg-white/20 rounded-full overflow-hidden z-10">
                <motion.div className="h-full bg-white rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear" }} onAnimationComplete={() => setViewingStory(null)} />
              </div>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="absolute top-6 left-4 right-4 flex items-center gap-2.5 z-10">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white/30" style={{ background: viewingStory.avatarStyle }}>{viewingStory.avatar}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{viewingStory.user}</div>
                  <div className="text-xs text-white/70">{viewingStory.time}</div>
                </div>
                <div className="text-xs text-white/70">👁 {viewingStory.views}</div>
                <motion.button whileTap={{ scale: 0.8 }} className="text-xl bg-transparent border-none cursor-pointer text-white" onClick={() => setViewingStory(null)}>✕</motion.button>
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center text-[80px]">
                {!viewingStory.mediaUrl && (viewingStory.type === "reel" ? "🎬" : viewingStory.type === "video" ? "🎥" : "📸")}
              </div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                <p className="text-sm font-medium mb-3 text-white">{viewingStory.caption}</p>
                <div className="flex items-center gap-2">
                  <input className="flex-1 bg-white/10 border border-white/20 rounded-full px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none font-body" placeholder="Répondre..." onClick={(e) => e.stopPropagation()} />
                  <motion.button whileTap={{ scale: 1.3 }} className="text-xl bg-transparent border-none cursor-pointer">❤️</motion.button>
                  <motion.button whileTap={{ scale: 1.3 }} className="text-xl bg-transparent border-none cursor-pointer">➤</motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoriesModule;
