import { useEffect, useState } from "react";

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
        <div
          className="w-[90px] h-[90px] rounded-[28px] flex items-center justify-center text-[48px]"
          style={{
            background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-or)))",
            animation: "logo-pulse 2s ease infinite",
          }}
        >
          🪶
        </div>
        <h1
          className="font-display text-[52px] font-extrabold tracking-tight"
          style={{
            background: "linear-gradient(135deg, #fff 30%, hsl(var(--envle-or)))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          E'nvlé
        </h1>
        <p className="text-envle-text-muted text-sm tracking-[3px] uppercase -mt-2">
          Connecté · Créé · Célébré
        </p>
        <div className="mt-12 w-[200px] h-[3px] rounded-full overflow-hidden bg-envle-border">
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
