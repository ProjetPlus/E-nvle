import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Conversation } from "./ConversationPanel";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const RightPanel = ({ conv, onOpenCall }: { conv: Conversation; onOpenCall: (type: string) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-[300px] bg-envle-card border-l border-envle-border flex flex-col overflow-y-auto p-5 scrollbar-thin max-lg:hidden"
    >
      {/* Profile */}
      <motion.div variants={stagger} initial="initial" animate="animate" className="flex flex-col items-center gap-2.5 pb-5 border-b border-envle-border">
        <motion.div
          variants={fadeUp}
          whileHover={{ scale: 1.08, rotate: 2 }}
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[28px] font-bold border-[3px] border-primary"
          style={{ background: conv.avatarStyle }}
        >
          {conv.avatar}
        </motion.div>
        <motion.div variants={fadeUp} className="text-lg font-bold">{conv.name}</motion.div>
        <motion.span
          variants={fadeUp}
          whileHover={{ scale: 1.05 }}
          className="bg-primary/20 text-envle-vert-light text-[11px] px-2.5 py-[3px] rounded-full font-semibold"
        >
          ✅ Profil Vérifié
        </motion.span>
        <motion.p variants={fadeUp} className="text-xs text-envle-text-muted text-center">
          {conv.status || "Architecte & Designer"} · 🇨🇮<br />
          Passionnée de tech africaine
        </motion.p>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-5"
      >
        <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-3">Infos</h4>
        {[
          { icon: "📞", label: "Téléphone", value: "+225 07 xx xx xx" },
          { icon: "📍", label: "Localisation", value: "Abidjan, Côte d'Ivoire" },
          { icon: "💼", label: "Profession", value: "Architecte Senior" },
        ].map((info, i) => (
          <motion.div
            key={info.label}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.06 }}
            whileHover={{ x: 3 }}
            className="flex items-center gap-2.5 py-2 cursor-pointer"
          >
            <span className="text-lg opacity-70">{info.icon}</span>
            <div>
              <div className="text-[13px] text-envle-text-muted">{info.label}</div>
              <div className="text-[13px] font-medium">{info.value}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Media */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5"
      >
        <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-3">Médias partagés</h4>
        <div className="grid grid-cols-3 gap-1">
          {["🏛️", "🌅", "🎨", "🏙️", "🌿", "+14"].map((icon, i) => (
            <motion.div
              key={icon}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + i * 0.04, type: "spring", stiffness: 400 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="aspect-square rounded-lg flex items-center justify-center text-[22px] cursor-pointer"
              style={{ background: "linear-gradient(135deg, #1a2a1a, #2d4a2d)" }}
              onClick={() => toast("🖼️ Photo")}
            >
              {icon}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-5"
      >
        <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-3">Actions rapides</h4>
        {[
          { icon: "📹", label: "Démarrer un appel vidéo", color: "primary", onClick: () => onOpenCall("video") },
          { icon: "📍", label: "Voir sur la carte", color: "secondary", onClick: () => toast("📍 Voir sur la carte") },
          { icon: "💸", label: "Envoyer de l'argent", color: "bleu", onClick: () => toast("💸 Envoi de fonds via Portefeuille E'nvlé") },
        ].map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 + i * 0.06 }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02, y: -1 }}
            className={`w-full p-2.5 rounded-xl border font-body text-[13px] cursor-pointer mb-2 transition-all ${
              action.color === "primary"
                ? "bg-primary/[0.15] border-primary/30 text-envle-vert-light hover:bg-primary/25"
                : action.color === "secondary"
                ? "bg-secondary/10 border-secondary/20 text-envle-or-light hover:bg-secondary/20"
                : "bg-envle-bleu/10 border-envle-bleu/20 text-blue-300 hover:bg-envle-bleu/20"
            }`}
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
