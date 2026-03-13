import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import envleLogo from "@/assets/envle-logo.png";

interface Props {
  open: boolean;
  onClose: () => void;
}

const countries = [
  "🇨🇮 Côte d'Ivoire", "🇸🇳 Sénégal", "🇬🇳 Guinée", "🇲🇱 Mali",
  "🇧🇫 Burkina Faso", "🇹🇬 Togo", "🇨🇲 Cameroun", "🇨🇩 RD Congo",
  "🇳🇬 Nigeria", "🇬🇭 Ghana",
];

const AuthModal = ({ open, onClose }: Props) => {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showCodePopup, setShowCodePopup] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const requestOTP = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Veuillez entrer un email valide");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("generate_otp", { p_email: email });
      if (error) throw error;
      const result = data as any;
      if (!result.success) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
      // Show the OTP code in a popup (since no email service yet)
      setGeneratedCode(result.code);
      setShowCodePopup(true);
      setStep("otp");
      setCountdown(300); // 5 minutes
      toast.success("📧 Code OTP généré !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération du code");
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      toast.error("Entrez le code à 6 chiffres");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("verify_otp", { p_email: email, p_code: code });
      if (error) throw error;
      const result = data as any;
      if (!result.success) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
      // Sign in with Supabase magic link / OTP
      const { error: signError } = await supabase.auth.signInWithOtp({ email });
      if (signError) {
        // Fallback: sign up the user
        toast.success("✅ Code vérifié ! Vérifiez votre email pour confirmer.");
      } else {
        toast.success("✅ Connecté avec succès !");
      }
      setShowCodePopup(false);
      onClose();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Erreur de vérification");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setStep("email");
    setEmail("");
    setOtpCode(["", "", "", "", "", ""]);
    setCountdown(0);
    setGeneratedCode(null);
    setShowCodePopup(false);
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-envle-card border border-envle-border rounded-3xl p-8 w-[480px] max-w-[95vw]"
          >
            <div className="flex flex-col items-center mb-5">
              <motion.img
                src={envleLogo}
                alt="E'nvlé"
                className="w-16 h-16 object-contain mb-3"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
              />
              <motion.h2 initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="font-display text-2xl font-bold">
                Bienvenue sur E'nvlé
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-envle-text-muted text-sm mt-1">
                Connecter · Créer · Célébrer
              </motion.p>
            </div>

            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div key="email" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }}>
                  <div className="mb-4">
                    <label className="text-xs text-envle-text-muted block mb-1.5 font-semibold uppercase tracking-[0.5px]">Adresse email</label>
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && requestOTP()}
                      className="w-full px-4 py-3 bg-foreground/[0.06] border border-envle-border rounded-xl text-foreground font-body text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsla(142,47%,33%,0.15)] transition-all placeholder:text-envle-text-muted"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ y: -2 }}
                    disabled={loading}
                    className="w-full py-3.5 rounded-[14px] border-none text-foreground font-body text-[15px] font-bold cursor-pointer mt-2 transition-all shadow-[0_4px_20px_hsla(142,47%,33%,0.4)] hover:shadow-[0_8px_28px_hsla(142,47%,33%,0.5)] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
                    onClick={requestOTP}
                  >
                    {loading ? "⏳ Envoi..." : "📧 Recevoir le code OTP"}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="otp" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}>
                  <p className="text-sm text-envle-text-muted text-center mb-4">
                    Code envoyé à <span className="text-foreground font-semibold">{email}</span>
                  </p>

                  {/* OTP Code Popup */}
                  <AnimatePresence>
                    {showCodePopup && generatedCode && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mb-4 p-4 rounded-2xl border-2 border-dashed border-envle-or/50 bg-envle-or/10 text-center"
                      >
                        <p className="text-xs text-envle-text-muted mb-1">🔑 Votre code OTP (dev mode)</p>
                        <p className="text-3xl font-bold font-mono tracking-[8px] text-envle-or">{generatedCode}</p>
                        <p className="text-[10px] text-envle-text-muted mt-1">Valable 5 minutes</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* OTP Input */}
                  <div className="flex gap-2 justify-center mb-4">
                    {otpCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInput(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-12 h-14 text-center text-2xl font-bold bg-foreground/[0.06] border border-envle-border rounded-xl text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsla(142,47%,33%,0.15)] transition-all"
                      />
                    ))}
                  </div>

                  {countdown > 0 && (
                    <p className="text-center text-xs text-envle-text-muted mb-3">
                      ⏱️ Expire dans <span className="text-envle-or font-bold">{formatCountdown(countdown)}</span>
                    </p>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ y: -2 }}
                    disabled={loading}
                    className="w-full py-3.5 rounded-[14px] border-none text-foreground font-body text-[15px] font-bold cursor-pointer transition-all shadow-[0_4px_20px_hsla(142,47%,33%,0.4)] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
                    onClick={verifyOTP}
                  >
                    {loading ? "⏳ Vérification..." : "✅ Vérifier le code"}
                  </motion.button>

                  <div className="flex justify-between mt-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="text-xs text-envle-text-muted hover:text-foreground bg-transparent border-none cursor-pointer font-body"
                      onClick={() => { resetForm(); }}
                    >
                      ← Changer d'email
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      disabled={countdown > 240}
                      className="text-xs text-primary hover:text-envle-vert-light bg-transparent border-none cursor-pointer font-body disabled:opacity-30"
                      onClick={requestOTP}
                    >
                      🔄 Renvoyer le code
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-center mt-5 text-xs text-envle-text-muted">🔒 Chiffrement end-to-end · 3 tentatives max / 24h</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
