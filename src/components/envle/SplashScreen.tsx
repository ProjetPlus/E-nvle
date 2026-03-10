import { useEffect, useState } from "react";
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
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-envle-noir transition-opacity duration-[800ms] ${
        hiding ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className="flex flex-col items-center gap-5"
        style={{ animation: "splash-in 1s ease forwards" }}
      >
        <img
          src={envleLogo}
          alt="E'nvlé Logo"
          className="w-[140px] h-[140px] object-contain"
          style={{ animation: "logo-pulse 2s ease infinite", borderRadius: "28px" }}
        />
        <p className="text-envle-text-muted text-sm tracking-[3px] uppercase -mt-2">
          Connecté · Créé · Célébré
        </p>
        <div className="mt-8 w-[200px] h-[3px] rounded-full overflow-hidden bg-envle-border">
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, hsl(var(--envle-vert)), hsl(var(--envle-or)))",
              animation: "splash-load 2.5s ease forwards",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
