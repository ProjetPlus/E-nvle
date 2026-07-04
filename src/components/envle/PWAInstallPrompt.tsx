import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import envleLogo from "@/assets/envle-logo.png";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "envle_pwa_dismissed_at";
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000;

const PWAInstallPrompt = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (standalone) return;

    const last = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (last && Date.now() - last < DISMISS_TTL) return;

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setTimeout(() => setVisible(true), 6000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (iOS) setTimeout(() => setVisible(true), 8000);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(160deg, hsl(142 47% 8%), hsl(142 47% 14%))", border: "1px solid hsla(45, 90%, 55%, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <motion.img
                src={envleLogo}
                alt="E'nvlé One"
                className="w-24 h-24 object-contain mx-auto mb-4"
                animate={{ filter: ["drop-shadow(0 0 20px hsla(45, 90%, 55%, 0.4))", "drop-shadow(0 0 40px hsla(45, 90%, 55%, 0.7))", "drop-shadow(0 0 20px hsla(45, 90%, 55%, 0.4))"] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <h2 className="font-display text-2xl font-bold text-white mb-1">Installer E'nvlé One</h2>
              <p className="text-xs uppercase tracking-[2px]" style={{ color: "hsl(45 90% 65%)" }}>Connecter · Créer · Célébrer</p>

              <div className="grid grid-cols-2 gap-2 my-5 text-left">
                {[
                  { i: "⚡", t: "Ultra rapide" },
                  { i: "📴", t: "Fonctionne hors ligne" },
                  { i: "🌍", t: "Identité africaine" },
                  { i: "🔔", t: "Notifications" },
                ].map((f) => (
                  <div key={f.t} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-lg">{f.i}</span>
                    <span className="text-xs text-white/90 font-medium">{f.t}</span>
                  </div>
                ))}
              </div>

              {isIOS ? (
                <div className="text-xs text-white/80 bg-white/5 rounded-xl p-3 mb-4 leading-relaxed">
                  Sur iPhone : appuie sur <span className="font-bold">Partager</span> ⬆️ puis <span className="font-bold">« Sur l'écran d'accueil »</span>
                </div>
              ) : (
                <button
                  onClick={install}
                  className="w-full py-3 rounded-xl font-bold text-black mb-2 transition-transform active:scale-95"
                  style={{ background: "linear-gradient(90deg, hsl(45 90% 55%), hsl(45 95% 65%))" }}
                >
                  Installer maintenant
                </button>
              )}
              <button onClick={dismiss} className="w-full py-2 text-xs text-white/60 hover:text-white/90">
                Plus tard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
