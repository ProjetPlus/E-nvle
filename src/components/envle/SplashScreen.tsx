import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import envleLogo from "@/assets/envle-logo.jpg";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHiding(true);
      setTimeout(onFinish, 800);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: hiding ? 0 : 1 }}
      transition={{ duration: 0.8 }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-envle-noir ${hiding ? "pointer-events-none" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-5"
      >
        <motion.img
          src={envleLogo}
          alt="E'nvlé Logo"
          className="w-[140px] h-[140px] object-contain rounded-[28px]"
          animate={{
            boxShadow: [
              "0 0 60px hsla(142, 47%, 33%, 0.5), 0 0 120px hsla(37, 90%, 58%, 0.2)",
              "0 0 80px hsla(142, 47%, 33%, 0.8), 0 0 160px hsla(37, 90%, 58%, 0.4)",
              "0 0 60px hsla(142, 47%, 33%, 0.5), 0 0 120px hsla(37, 90%, 58%, 0.2)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-envle-text-muted text-sm tracking-[3px] uppercase -mt-2"
        >
          Connecté · Créé · Célébré
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 w-[200px] h-[3px] rounded-full overflow-hidden bg-envle-border"
        >
          <motion.div
            className="h-full rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            style={{ background: "linear-gradient(90deg, hsl(var(--envle-vert)), hsl(var(--envle-or)))" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
