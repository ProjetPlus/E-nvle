import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread?: number;
  avatar: string;
  avatarStyle: string;
  isOnline?: boolean;
  isSquare?: boolean;
  status?: string;
}

const tabs = ["Tous", "Non lus", "Groupes", "Chaînes"];

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const staggerItem = {
  initial: { opacity: 0, x: -20, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

interface Props {
  activeConvId: string;
  onSelectConv: (conv: Conversation) => void;
}

const ConversationPanel = ({ activeConvId, onSelectConv }: Props) => {
  const [activeTab, setActiveTab] = useState("Tous");
  const [searchFocused, setSearchFocused] = useState(false);

  // No test data — conversations will come from Supabase
  const conversations: Conversation[] = [];

  return (
    <div className="w-[340px] bg-envle-card border-r border-envle-border flex flex-col overflow-hidden max-lg:w-[280px] max-md:w-full max-md:border-r-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="px-5 pt-5">
        <h2 className="font-display text-[26px] font-bold">Messages</h2>
        <p className="text-xs text-envle-text-muted mt-0.5">{conversations.length} conversations</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className={`mx-5 my-4 bg-foreground/[0.06] border rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 transition-all duration-300 ${searchFocused ? "border-primary shadow-[0_0_0_3px_hsla(142,47%,33%,0.12)]" : "border-envle-border"}`}
      >
        <motion.span animate={{ scale: searchFocused ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 400 }}>🔍</motion.span>
        <input
          type="text"
          placeholder="Chercher ou démarrer une conv..."
          className="bg-transparent border-none outline-none text-foreground font-body text-sm flex-1 placeholder:text-envle-text-muted"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </motion.div>

      <div className="flex px-5 gap-1 mb-3">
        {tabs.map((tab, i) => (
          <motion.button
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -1 }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors ${
              activeTab === tab
                ? "bg-primary/20 text-envle-vert-light"
                : "bg-transparent text-envle-text-muted hover:bg-foreground/[0.04]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      {/* Conversations */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex-1 overflow-y-auto px-2 pb-5 scrollbar-thin">
        {conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center px-6"
          >
            <span className="text-5xl mb-4">💬</span>
            <p className="text-envle-text-muted text-sm">Aucune conversation</p>
            <p className="text-envle-text-muted text-xs mt-1">Connectez-vous pour commencer à discuter</p>
          </motion.div>
        ) : (
          conversations.map((conv) => (
            <motion.div
              key={conv.id}
              variants={staggerItem}
              whileTap={{ scale: 0.97 }}
              whileHover={{ x: 4, backgroundColor: "hsla(142, 47%, 33%, 0.04)" }}
              className={`flex items-center gap-3 p-3 rounded-[14px] cursor-pointer transition-colors ${
                activeConvId === conv.id ? "bg-primary/[0.12]" : ""
              }`}
              onClick={() => onSelectConv(conv)}
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={`w-12 h-12 shrink-0 flex items-center justify-center font-bold text-lg relative ${
                  conv.isSquare ? "rounded-[14px]" : "rounded-full"
                }`}
                style={{ background: conv.avatarStyle }}
              >
                {conv.avatar}
                {conv.isOnline && (
                  <span
                    className="absolute bottom-px right-px w-3 h-3 rounded-full bg-green-500 border-2 border-envle-card"
                    style={{ animation: "pulse-status 2s ease-in-out infinite" }}
                  />
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{conv.name}</div>
                <div className="text-xs text-envle-text-muted truncate mt-0.5">{conv.lastMsg}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-envle-text-muted">{conv.time}</span>
                {conv.unread && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="bg-primary text-[11px] font-bold px-[7px] py-[2px] rounded-full text-foreground"
                  >
                    {conv.unread}
                  </motion.span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default ConversationPanel;
