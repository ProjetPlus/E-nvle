import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Conversation } from "./ConversationPanel";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const RightPanel = ({ conv, onOpenCall }: { conv: Conversation; onOpenCall: (type: string) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-[280px] bg-envle-card border-l border-envle-border flex flex-col overflow-y-auto p-4 scrollbar-thin max-lg:hidden"
    >
      <motion.div variants={stagger} initial="initial" animate="animate" className="flex flex-col items-center gap-2 pb-4 border-b border-envle-border">
        <motion.div variants={fadeUp} whileHover={{ scale: 1.08 }} className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-[3px] border-primary" style={{ background: conv.avatarStyle }}>{conv.avatar}</motion.div>
        <motion.div variants={fadeUp} className="text-base font-bold">{conv.name}</motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
        <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-2">Actions rapides</h4>
        {[
          { icon: "📹", label: "Appel vidéo", onClick: () => onOpenCall("video") },
          { icon: "📍", label: "Voir sur la carte", onClick: () => toast("📍 Carte") },
          { icon: "💸", label: "Envoyer de l'argent", onClick: () => toast("💸 Portefeuille") },
        ].map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            whileTap={{ scale: 0.96 }}
            className="w-full p-2.5 rounded-xl border border-envle-border/50 font-body text-xs cursor-pointer mb-1.5 transition-all bg-foreground/[0.02] hover:bg-primary/10 hover:border-primary/30 text-left"
            onClick={action.onClick}
          >
            {action.icon} {action.label}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default RightPanel;
