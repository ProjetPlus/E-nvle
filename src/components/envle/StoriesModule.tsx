import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
}

const mockStories: Story[] = [
  { id: "1", user: "Amara Diallo", avatar: "A", avatarStyle: "linear-gradient(135deg,#7c3aed,#ec4899)", type: "image", caption: "Sunset à Abidjan 🌅", time: "Il y a 2h", views: 142, liked: false },
  { id: "2", user: "Kofi Mensah", avatar: "K", avatarStyle: "linear-gradient(135deg,#f59e0b,#ef4444)", type: "reel", caption: "Coding session 🔥 #DevAfrica", time: "Il y a 4h", views: 891, liked: true },
  { id: "3", user: "Fatima Traoré", avatar: "F", avatarStyle: "linear-gradient(135deg,#10b981,#059669)", type: "video", caption: "Recette Attiéké maison 🍽️", time: "Il y a 6h", views: 2340, liked: false },
  { id: "4", user: "TechHub Dakar", avatar: "🏢", avatarStyle: "linear-gradient(135deg,#0ea5e9,#2563eb)", type: "reel", caption: "Hackathon highlights 🚀", time: "Il y a 8h", views: 5210, liked: true },
  { id: "5", user: "Awa Coulibaly", avatar: "🌸", avatarStyle: "linear-gradient(135deg,#f472b6,#db2777)", type: "image", caption: "Mode africaine 🧵✨", time: "Il y a 12h", views: 764, liked: false },
  { id: "6", user: "Boubacar Sylla", avatar: "B", avatarStyle: "linear-gradient(135deg,#8b5cf6,#6d28d9)", type: "reel", caption: "Danse Afrobeat 💃🕺", time: "Il y a 1j", views: 12800, liked: true },
];

const tabs = ["Tous", "Stories", "Reels", "En direct"];

const StoriesModule = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState("Tous");
  const [stories, setStories] = useState(mockStories);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);

  const filtered = stories.filter((s) => {
    if (activeTab === "Stories") return s.type === "image" || s.type === "video";
    if (activeTab === "Reels") return s.type === "reel";
    return true;
  });

  const toggleLike = (id: string) => {
    setStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, liked: !s.liked, views: s.liked ? s.views - 1 : s.views + 1 } : s))
    );
  };

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
        <h2 className="font-display text-2xl font-bold flex-1">Stories & Reels</h2>
        <button
          className="px-4 py-2 rounded-xl border-none font-body text-sm cursor-pointer font-semibold text-primary-foreground transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
          onClick={() => toast("📸 Créer une story — Bientôt disponible")}
        >
          + Créer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-6 gap-1 py-3 border-b border-envle-border">
        {tabs.map((tab) => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all ${
              activeTab === tab
                ? "bg-primary/20 text-envle-vert-light"
                : "bg-transparent text-envle-text-muted hover:bg-foreground/[0.04]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "En direct" && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-envle-rouge inline-block animate-pulse" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Content grid */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((story, i) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="bg-envle-card border border-envle-border rounded-2xl overflow-hidden cursor-pointer group hover:border-primary/30 transition-all"
                onClick={() => setViewingStory(story)}
              >
                {/* Thumbnail */}
                <div className="aspect-[4/5] relative overflow-hidden">
                  <div
                    className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500"
                    style={{ background: story.avatarStyle }}
                  >
                    {story.type === "reel" ? "🎬" : story.type === "video" ? "🎥" : "📸"}
                  </div>
                  {story.type === "reel" && (
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold">
                      🎵 Reel
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-sm font-medium">{story.caption}</p>
                  </div>
                </div>
                {/* Footer */}
                <div className="p-3 flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: story.avatarStyle }}
                  >
                    {story.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{story.user}</div>
                    <div className="text-xs text-envle-text-muted">{story.time}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-envle-text-muted">
                    <span>👁 {story.views >= 1000 ? `${(story.views / 1000).toFixed(1)}K` : story.views}</span>
                    <motion.button
                      whileTap={{ scale: 1.3 }}
                      className="border-none bg-transparent cursor-pointer text-base"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(story.id);
                      }}
                    >
                      {story.liked ? "❤️" : "🤍"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[380px] max-w-[95vw] h-[680px] max-h-[90vh] rounded-3xl overflow-hidden relative"
              style={{ background: viewingStory.avatarStyle }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar */}
              <div className="absolute top-3 left-3 right-3 h-1 bg-white/20 rounded-full overflow-hidden z-10">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  onAnimationComplete={() => setViewingStory(null)}
                />
              </div>
              {/* Header */}
              <div className="absolute top-6 left-4 right-4 flex items-center gap-2.5 z-10">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white/30"
                  style={{ background: viewingStory.avatarStyle }}
                >
                  {viewingStory.avatar}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{viewingStory.user}</div>
                  <div className="text-xs opacity-70">{viewingStory.time}</div>
                </div>
                <button
                  className="text-xl bg-transparent border-none cursor-pointer text-white"
                  onClick={() => setViewingStory(null)}
                >
                  ✕
                </button>
              </div>
              {/* Content */}
              <div className="w-full h-full flex items-center justify-center text-[80px]">
                {viewingStory.type === "reel" ? "🎬" : viewingStory.type === "video" ? "🎥" : "📸"}
              </div>
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-16">
                <p className="text-base font-medium mb-4">{viewingStory.caption}</p>
                <div className="flex items-center gap-3">
                  <input
                    className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/50 outline-none font-body"
                    placeholder="Répondre à la story..."
                    onClick={(e) => e.stopPropagation()}
                  />
                  <motion.button whileTap={{ scale: 1.2 }} className="text-2xl bg-transparent border-none cursor-pointer">
                    ❤️
                  </motion.button>
                  <motion.button whileTap={{ scale: 1.2 }} className="text-2xl bg-transparent border-none cursor-pointer">
                    ➤
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoriesModule;
