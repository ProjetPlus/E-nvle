import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import QRCodeDisplay from "./QRCodeDisplay";

const languages = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
  { code: "wo", label: "Wolof", flag: "🇸🇳" },
];

const detectSystemLanguage = (): string => {
  const lang = navigator.language?.slice(0, 2) || "fr";
  return languages.find((l) => l.code === lang)?.code || "fr";
};

export const getAppLanguage = (): string => {
  return localStorage.getItem("envle-language") || detectSystemLanguage();
};

export const setAppLanguage = (code: string) => {
  localStorage.setItem("envle-language", code);
};

const connectedDevices = [
  { id: "1", name: "iPhone 15 Pro", type: "📱", lastActive: "Actif maintenant", isCurrent: true },
  { id: "2", name: "MacBook Pro 14\"", type: "💻", lastActive: "Actif maintenant", isCurrent: false },
  { id: "3", name: "iPad Air", type: "📱", lastActive: "Il y a 2h", isCurrent: false },
  { id: "4", name: "Chrome · Windows", type: "🖥️", lastActive: "Il y a 1 jour", isCurrent: false },
];

interface Props {
  onBack: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  bio: string;
  avatar: string;
  avatarStyle: string;
  location: string;
  profession: string;
}

const SettingsModule = ({ onBack, userProfile, onUpdateProfile }: Props) => {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [profile, setProfile] = useState(userProfile);
  const [selectedLang, setSelectedLang] = useState(getAppLanguage());
  const [showQR, setShowQR] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(localStorage.getItem("envle-auto-translate") !== "false");

  useEffect(() => { setProfile(userProfile); }, [userProfile]);

  const saveProfile = () => { onUpdateProfile(profile); toast.success("✅ Profil mis à jour"); setActiveSection(null); };
  const changeLang = (code: string) => { setSelectedLang(code); setAppLanguage(code); toast.success(`🌍 Langue changée: ${languages.find((l) => l.code === code)?.label}`); };
  const toggleAutoTranslate = () => { const v = !autoTranslate; setAutoTranslate(v); localStorage.setItem("envle-auto-translate", String(v)); toast.success(v ? "🌐 Traduction automatique activée" : "🌐 Traduction automatique désactivée"); };

  const sections = [
    { id: "profile", icon: "👤", label: "Mon profil", desc: "Nom, photo, bio, profession" },
    { id: "language", icon: "🌍", label: "Langue & Traduction", desc: `${languages.find((l) => l.code === selectedLang)?.label} · Trad. auto ${autoTranslate ? "ON" : "OFF"}` },
    { id: "devices", icon: "📱", label: "Appareils connectés", desc: `${connectedDevices.length}/10 appareils` },
    { id: "theme", icon: theme === "dark" ? "🌙" : "☀️", label: "Apparence", desc: theme === "dark" ? "Mode sombre" : "Mode clair" },
    { id: "privacy", icon: "🔒", label: "Confidentialité", desc: "Dernière connexion, photo de profil" },
    { id: "notifications", icon: "🔔", label: "Notifications", desc: "Sons, badges, alertes" },
    { id: "storage", icon: "💾", label: "Stockage & Données", desc: "1.2 Go utilisés" },
    { id: "qr", icon: "📱", label: "Mon QR Code", desc: "Scanner ou partager" },
    { id: "help", icon: "❓", label: "Aide & Support", desc: "FAQ, contacter le support" },
    { id: "about", icon: "ℹ️", label: "À propos", desc: "E'nvlé v2.5 · Super App Africaine" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.85 }} className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</motion.button>
        <h2 className="font-display text-2xl font-bold flex-1">Paramètres</h2>
      </motion.div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring" }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="mx-6 mt-6 bg-envle-card border border-envle-border rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-all"
          onClick={() => setActiveSection("profile")}
        >
          <motion.div whileHover={{ scale: 1.08, rotate: 3 }} className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-primary" style={{ background: profile.avatarStyle }}>{profile.avatar}</motion.div>
          <div className="flex-1">
            <div className="text-lg font-bold">{profile.name}</div>
            <div className="text-xs text-envle-text-muted">{profile.bio}</div>
          </div>
          <span className="text-envle-text-muted">›</span>
        </motion.div>

        {/* Sections */}
        <div className="px-6 py-4 flex flex-col gap-0.5">
          {sections.map((section, i) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.03, type: "spring", stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.98 }}
              whileHover={{ x: 4 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer hover:bg-foreground/[0.04] transition-colors"
              onClick={() => {
                if (section.id === "theme") { toggleTheme(); return; }
                if (section.id === "qr") { setShowQR(true); return; }
                setActiveSection(section.id);
              }}
            >
              <motion.span whileHover={{ scale: 1.15, rotate: 10 }} className="text-xl">{section.icon}</motion.span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{section.label}</div>
                <div className="text-xs text-envle-text-muted">{section.desc}</div>
              </div>
              <span className="text-envle-text-muted text-sm">›</span>
            </motion.div>
          ))}
        </div>

        {/* Logout */}
        <div className="px-6 pb-8">
          <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} className="w-full py-3 rounded-xl border border-envle-rouge/30 bg-envle-rouge/10 text-envle-rouge text-sm font-semibold cursor-pointer font-body hover:bg-envle-rouge/20 transition-all" onClick={() => toast("👋 Déconnexion...")}>
            🚪 Se déconnecter
          </motion.button>
        </div>
      </div>

      {/* Profile edit overlay */}
      <AnimatePresence>
        {activeSection === "profile" && (
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ type: "spring", damping: 25 }} className="absolute inset-0 z-50 bg-background flex flex-col">
            <div className="px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.85 }} className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center" onClick={() => setActiveSection(null)}>←</motion.button>
              <h3 className="font-display text-xl font-bold flex-1">Mon profil</h3>
              <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} className="px-4 py-2 rounded-xl border-none text-sm font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={saveProfile}>Sauvegarder</motion.button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 mb-4">
                <motion.div whileHover={{ scale: 1.08, rotate: 3 }} className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold border-3 border-primary" style={{ background: profile.avatarStyle }}>{profile.avatar}</motion.div>
                <motion.button whileTap={{ scale: 0.9 }} className="text-xs text-primary font-semibold border-none bg-transparent cursor-pointer font-body" onClick={() => toast("📷 Changer la photo de profil")}>📷 Changer la photo</motion.button>
              </motion.div>
              {[
                { key: "name", label: "Nom complet", placeholder: "Votre nom" },
                { key: "phone", label: "Téléphone", placeholder: "+225 XX XX XX XX" },
                { key: "email", label: "Email", placeholder: "votre@email.com" },
                { key: "profession", label: "Profession", placeholder: "Votre profession" },
                { key: "location", label: "Localisation", placeholder: "Ville, Pays" },
              ].map((field, i) => (
                <motion.div key={field.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <label className="text-xs text-envle-text-muted font-semibold block mb-1.5">{field.label}</label>
                  <input className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-4 py-3 text-foreground font-body text-sm outline-none focus:border-primary placeholder:text-envle-text-muted" placeholder={field.placeholder} value={(profile as any)[field.key]} onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })} />
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <label className="text-xs text-envle-text-muted font-semibold block mb-1.5">Bio</label>
                <textarea className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-4 py-3 text-foreground font-body text-sm outline-none focus:border-primary resize-none h-20 placeholder:text-envle-text-muted" placeholder="Parlez de vous..." value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language overlay */}
      <AnimatePresence>
        {activeSection === "language" && (
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ type: "spring", damping: 25 }} className="absolute inset-0 z-50 bg-background flex flex-col">
            <div className="px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.85 }} className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center" onClick={() => setActiveSection(null)}>←</motion.button>
              <h3 className="font-display text-xl font-bold">Langue & Traduction</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-3">Langue de l'application</h4>
              <p className="text-xs text-envle-text-muted mb-4">La langue est auto-détectée selon votre appareil. Vous pouvez la changer manuellement.</p>
              <div className="flex flex-col gap-1 mb-6">
                {languages.map((lang, i) => (
                  <motion.button
                    key={lang.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ x: 3 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${selectedLang === lang.code ? "bg-primary/15 border-primary/40 text-envle-vert-light" : "bg-transparent border-envle-border/50 text-foreground"}`}
                    onClick={() => changeLang(lang.code)}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm font-medium flex-1 text-left">{lang.label}</span>
                    {selectedLang === lang.code && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-primary">✓</motion.span>}
                  </motion.button>
                ))}
              </div>
              <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-3">Traduction automatique</h4>
              <p className="text-xs text-envle-text-muted mb-3">Les messages reçus seront traduits automatiquement dans votre langue.</p>
              <motion.button whileTap={{ scale: 0.98 }} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border cursor-pointer transition-all ${autoTranslate ? "bg-primary/15 border-primary/40" : "bg-transparent border-envle-border"}`} onClick={toggleAutoTranslate}>
                <span className="text-xl">🌐</span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold">Traduction automatique</div>
                  <div className="text-xs text-envle-text-muted">Messages traduits en temps réel</div>
                </div>
                <div className={`w-12 h-7 rounded-full relative transition-colors ${autoTranslate ? "bg-primary" : "bg-foreground/20"}`}>
                  <motion.div animate={{ x: autoTranslate ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-1 w-5 h-5 rounded-full bg-white shadow" />
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Devices overlay */}
      <AnimatePresence>
        {activeSection === "devices" && (
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ type: "spring", damping: 25 }} className="absolute inset-0 z-50 bg-background flex flex-col">
            <div className="px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.85 }} className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center" onClick={() => setActiveSection(null)}>←</motion.button>
              <h3 className="font-display text-xl font-bold">Appareils connectés</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6">
                <div className="text-sm font-semibold text-envle-vert-light mb-1">📱 Multi-appareils E'nvlé</div>
                <p className="text-xs text-envle-text-muted">Connectez jusqu'à <strong>10 appareils</strong> en même temps.</p>
              </motion.div>
              <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-3">Appareils ({connectedDevices.length}/10)</h4>
              {connectedDevices.map((device, i) => (
                <motion.div key={device.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ x: 3 }} className="flex items-center gap-3 py-3 border-b border-envle-border/50">
                  <motion.span whileHover={{ scale: 1.15 }} className="text-2xl">{device.type}</motion.span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold flex items-center gap-2">{device.name} {device.isCurrent && <span className="text-[10px] bg-primary/20 text-envle-vert-light px-2 py-0.5 rounded-full">Cet appareil</span>}</div>
                    <div className="text-xs text-envle-text-muted">{device.lastActive}</div>
                  </div>
                  {!device.isCurrent && <motion.button whileTap={{ scale: 0.9 }} className="text-xs text-envle-rouge border-none bg-transparent cursor-pointer font-body" onClick={() => toast(`❌ ${device.name} déconnecté`)}>Déconnecter</motion.button>}
                </motion.div>
              ))}
              <motion.button whileTap={{ scale: 0.95 }} whileHover={{ y: -1 }} className="w-full mt-4 py-3 rounded-xl border border-dashed border-envle-border bg-transparent text-sm text-envle-text-muted cursor-pointer font-body hover:border-primary/40 transition-all" onClick={() => toast("📱 Scannez le QR code sur le nouvel appareil")}>+ Connecter un nouvel appareil</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code overlay */}
      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowQR(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-envle-card border border-envle-border rounded-3xl p-8 w-[340px] max-w-[90vw] text-center" onClick={(e) => e.stopPropagation()}>
              <QRCodeDisplay value={`envle://user/${profile.name.replace(/\s/g, "")}`} size={200} />
              <div className="text-lg font-bold mt-4">{profile.name}</div>
              <div className="text-xs text-envle-text-muted mt-1">Scannez pour ajouter en contact</div>
              <div className="flex gap-2 mt-5 justify-center">
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} className="px-4 py-2 rounded-xl border-none text-sm font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={() => toast("📷 Scanner un QR code")}>📷 Scanner</motion.button>
                <motion.button whileTap={{ scale: 0.9 }} className="px-4 py-2 rounded-xl border border-envle-border bg-transparent text-sm text-foreground cursor-pointer font-body" onClick={() => toast("📤 QR code partagé")}>📤 Partager</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsModule;
