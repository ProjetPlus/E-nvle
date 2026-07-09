import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import envleLogo from "@/assets/envle-logo.png";
import { isValidPhone, normalizePhone, phoneToDisplayName } from "@/lib/phone";
import QRCodeDisplay from "./QRCodeDisplay";

interface Props {
  open: boolean;
  onClose: () => void;
  locked?: boolean;
}

const countries = [
  { flag: "🇨🇮", code: "+225", label: "Côte d'Ivoire" },
  { flag: "🇸🇳", code: "+221", label: "Sénégal" },
  { flag: "🇬🇳", code: "+224", label: "Guinée" },
  { flag: "🇲🇱", code: "+223", label: "Mali" },
  { flag: "🇧🇫", code: "+226", label: "Burkina Faso" },
  { flag: "🇹🇬", code: "+228", label: "Togo" },
  { flag: "🇧🇯", code: "+229", label: "Bénin" },
  { flag: "🇨🇲", code: "+237", label: "Cameroun" },
  { flag: "🇳🇬", code: "+234", label: "Nigeria" },
  { flag: "🇬🇭", code: "+233", label: "Ghana" },
];

const AuthModal = ({ open, onClose, locked = false }: Props) => {
  const { user } = useAuth();
  useEffect(() => { if (user && open) onClose(); }, [user, open, onClose]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState(countries[0].code);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [pairingOpen, setPairingOpen] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fullPhone = normalizePhone(phone.startsWith("+") ? phone : `${countryCode}${phone}`);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const requestOTP = async () => {
    if (!isValidPhone(fullPhone)) {
      toast.error("Entrez un numéro de téléphone valide");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("phone-auth", { body: { action: "request", phone: fullPhone } });
    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Impossible de générer le code");
      return;
    }
    setGeneratedCode(data.code);
    setStep("otp");
    setCountdown(data.expiresIn || 300);
    toast.success("📱 Code OTP simulé généré");
  };

  const verifyOTP = async (codeOverride?: string) => {
    const code = codeOverride ?? otpCode.join("");
    if (code.length !== 6) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("phone-auth", {
      body: { action: "verify", phone: fullPhone, code, fullName: fullName || phoneToDisplayName(fullPhone) },
    });
    if (error || data?.error) {
      setLoading(false);
      toast.error(data?.error || error?.message || "Code invalide");
      return;
    }
    const { error: signError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    setLoading(false);
    if (signError) {
      toast.error(signError.message);
      return;
    }
    toast.success("✅ Connexion réussie");
    resetForm();
    onClose();
  };

  // Auto-verify when 6 digits entered
  useEffect(() => {
    const code = otpCode.join("");
    if (step === "otp" && code.length === 6 && !loading) void verifyOTP(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode, step]);


  const resetForm = () => {
    setStep("phone");
    setPhone("");
    setFullName("");
    setOtpCode(["", "", "", "", "", ""]);
    setCountdown(0);
    setGeneratedCode(null);
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3" onClick={(e) => e.target === e.currentTarget && !locked && onClose()}>
          <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-envle-card border border-envle-border rounded-3xl p-6 md:p-8 w-[480px] max-w-[95vw]">
            <div className="flex flex-col items-center mb-5">
              <motion.img src={envleLogo} alt="E'nvlé" className="w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring" }} />
            </div>

            {pairingOpen && (
              <div className="mb-4 rounded-2xl border border-envle-border bg-foreground/[0.04] p-4 text-center">
                <QRCodeDisplay value={`envle-pair://${crypto.randomUUID()}`} size={160} />
                <p className="mt-3 text-xs text-envle-text-muted">Scannez ce code depuis un appareil déjà connecté.</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.div key="phone" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-3">
                  <div>
                    <label className="text-xs text-envle-text-muted block mb-1.5 font-semibold uppercase tracking-[0.5px]">Pays</label>
                    <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-full px-4 py-3 bg-foreground/[0.06] border border-envle-border rounded-xl text-foreground font-body text-sm outline-none focus:border-primary">
                      {countries.map((country) => <option key={country.code} value={country.code}>{country.flag} {country.label} · {country.code}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-envle-text-muted block mb-1.5 font-semibold uppercase tracking-[0.5px]">Numéro téléphone</label>
                    <input type="tel" inputMode="tel" placeholder="07 00 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && requestOTP()} className="w-full px-4 py-3 bg-foreground/[0.06] border border-envle-border rounded-xl text-foreground font-body text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsla(142,47%,33%,0.15)] transition-all placeholder:text-envle-text-muted" />
                  </div>
                  <div>
                    <label className="text-xs text-envle-text-muted block mb-1.5 font-semibold uppercase tracking-[0.5px]">Nom complet</label>
                    <input placeholder="Votre nom (optionnel)" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 bg-foreground/[0.06] border border-envle-border rounded-xl text-foreground font-body text-sm outline-none focus:border-primary placeholder:text-envle-text-muted" />
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} whileHover={{ y: -2 }} disabled={loading} className="w-full py-3.5 rounded-[14px] border-none text-primary-foreground font-body text-[15px] font-bold cursor-pointer mt-2 transition-all shadow-[0_4px_20px_hsla(142,47%,33%,0.4)] disabled:opacity-50 bg-primary" onClick={requestOTP}>{loading ? "⏳ Envoi..." : "📱 Recevoir le code"}</motion.button>
                  <button className="w-full py-2.5 rounded-xl border border-envle-border bg-transparent text-xs text-envle-text-muted cursor-pointer font-body" onClick={() => setPairingOpen((v) => !v)}>📱 Connecter second appareil par QR</button>
                </motion.div>
              ) : (
                <motion.div key="otp" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}>
                  <p className="text-sm text-envle-text-muted text-center mb-4">Code envoyé à <span className="text-foreground font-semibold">{fullPhone}</span></p>
                  {generatedCode && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-4 rounded-2xl border-2 border-dashed border-envle-or/50 bg-envle-or/10 text-center"><p className="text-xs text-envle-text-muted mb-1">🔑 Code OTP simulé</p><p className="text-3xl font-bold font-mono tracking-[8px] text-envle-or">{generatedCode}</p><p className="text-[10px] text-envle-text-muted mt-1">Valable 5 minutes</p></motion.div>}
                  <div className="flex gap-2 justify-center mb-4">
                    {otpCode.map((digit, i) => <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpInput(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} className="w-11 md:w-12 h-14 text-center text-2xl font-bold bg-foreground/[0.06] border border-envle-border rounded-xl text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsla(142,47%,33%,0.15)] transition-all" />)}
                  </div>
                  {countdown > 0 && <p className="text-center text-xs text-envle-text-muted mb-3">⏱️ Expire dans <span className="text-envle-or font-bold">{formatCountdown(countdown)}</span></p>}
                  <motion.button whileTap={{ scale: 0.97 }} whileHover={{ y: -2 }} disabled={loading} className="w-full py-3.5 rounded-[14px] border-none text-primary-foreground font-body text-[15px] font-bold cursor-pointer transition-all shadow-[0_4px_20px_hsla(142,47%,33%,0.4)] disabled:opacity-50 bg-primary" onClick={() => verifyOTP()}>{loading ? "⏳ Connexion..." : "Entrer"}</motion.button>
                  <div className="flex justify-between mt-3">
                    <motion.button whileTap={{ scale: 0.95 }} className="text-xs text-envle-text-muted hover:text-foreground bg-transparent border-none cursor-pointer font-body" onClick={resetForm}>← Changer de numéro</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} disabled={countdown > 240} className="text-xs text-primary hover:text-envle-vert-light bg-transparent border-none cursor-pointer font-body disabled:opacity-30" onClick={requestOTP}>🔄 Renvoyer</motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-center mt-5 text-xs text-envle-text-muted">🔒 Session conservée jusqu'à déconnexion manuelle</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
