import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import QRCodeDisplay from "./QRCodeDisplay";
import { processProfileImage } from "@/lib/image-processing";

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

type ConnectedDevice = { id: string; name: string; type: string; lastActive: string; isCurrent: boolean };

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
  avatarUrl?: string;
  coverUrl?: string;
  avatarStyle: string;
  location: string;
  profession: string;
}

interface SettingsProps extends Props {
  requireProfile?: boolean;
  onProfileSaved?: () => void;
}

const SettingsModule = ({ onBack, userProfile, onUpdateProfile, requireProfile = false, onProfileSaved }: SettingsProps) => {
  const { theme, toggleTheme } = useTheme();
  const { user, profile: dbProfile, refreshProfile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(requireProfile ? "profile" : null);
  const [profile, setProfile] = useState(userProfile);
  const [selectedLang, setSelectedLang] = useState(getAppLanguage());
  const [showQR, setShowQR] = useState(false);
  const [showPairingQR, setShowPairingQR] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [autoTranslate, setAutoTranslate] = useState(localStorage.getItem("envle-auto-translate") !== "false");
  const draftKey = user ? `envle-profile-draft-${user.id}` : "envle-profile-draft";

  useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    setProfile(draft ? { ...userProfile, ...JSON.parse(draft) } : userProfile);
  }, [userProfile, draftKey]);
  useEffect(() => { if (requireProfile) setActiveSection("profile"); }, [requireProfile]);
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(draftKey, JSON.stringify(profile));
  }, [draftKey, profile, user]);

  useEffect(() => {
    if (!user) return;
    const loadDevices = async () => {
      const { data } = await supabase.from("user_devices").select("id, device_name, device_type, is_current, last_active").eq("user_id", user.id).order("last_active", { ascending: false });
      setConnectedDevices((data || []).map((device) => ({
        id: device.id,
        name: device.device_name,
        type: device.device_type === "mobile" ? "📱" : "💻",
        isCurrent: !!device.is_current,
        lastActive: device.is_current ? "Actif maintenant" : device.last_active ? new Date(device.last_active).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Inconnu",
      })));
    };
    void loadDevices();
    const channel = supabase.channel(`devices-${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "user_devices", filter: `user_id=eq.${user.id}` }, () => void loadDevices()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const uploadProfileMedia = async (file: File, kind: "avatar" | "cover") => {
    if (!user) { toast.error("Connectez-vous d'abord"); return; }
    const processed = await processProfileImage(file, kind);
    const path = `${user.id}/${kind}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(path, processed, { upsert: true, cacheControl: "3600", contentType: "image/jpeg" });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const next = kind === "avatar" ? { ...profile, avatarUrl: data.publicUrl } : { ...profile, coverUrl: data.publicUrl };
    setProfile(next);
    await supabase.from("profiles").update(kind === "avatar" ? { avatar_url: data.publicUrl } : { cover_url: data.publicUrl } as any).eq("id", user.id);
    await refreshProfile();
    toast.success(kind === "avatar" ? "Photo de profil mise à jour" : "Photo de couverture mise à jour");
  };

  const saveProfile = async () => {
    if (!user) { toast.error("Connectez-vous d'abord"); return; }
    const missing = [
      !profile.name.trim() && "nom",
      !profile.phone.trim() && "numéro",
      !profile.location.trim() && "ville",
      !profile.profession.trim() && "activité",
      !profile.avatarUrl && "photo de profil",
      !profile.coverUrl && "photo de couverture",
    ].filter(Boolean);
    if (missing.length) { toast.error(`Profil obligatoire incomplet: ${missing.join(", ")}`); return; }
    const { error } = await supabase.from("profiles").update({
      full_name: profile.name,
      phone: profile.phone,
      email: profile.email.trim() || null,
      bio: profile.bio || null,
      location: profile.location,
      profession: profile.profession,
      avatar_url: profile.avatarUrl,
      cover_url: profile.coverUrl,
      phone_changed_at: dbProfile?.phone && dbProfile.phone !== profile.phone ? new Date().toISOString() : undefined,
    } as any).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    onUpdateProfile(profile);
    await refreshProfile();
    localStorage.removeItem(draftKey);
    toast.success("✅ Profil mis à jour");
    if (!requireProfile) setActiveSection(null);
    onProfileSaved?.();
  };
  const changeLang = (code: string) => { setSelectedLang(code); setAppLanguage(code); toast.success(`🌍 Langue changée: ${languages.find((l) => l.code === code)?.label}`); };
  const toggleAutoTranslate = () => { const v = !autoTranslate; setAutoTranslate(v); localStorage.setItem("envle-auto-translate", String(v)); toast.success(v ? "🌐 Traduction automatique activée" : "🌐 Traduction automatique désactivée"); };

  const sections = [
    { id: "profile", icon: "👤", label: "Mon profil", desc: "Nom, photo, bio, profession" },
    { id: "language", icon: "🌍", label: "Langue & Traduction", desc: `${languages.find((l) => l.code === selectedLang)?.label} · Trad. auto ${autoTranslate ? "ON" : "OFF"}` },
    { id: "devices", icon: "📱", label: "Appareils connectés", desc: `${connectedDevices.length}/1 actif · QR pour ajouter` },
    { id: "theme", icon: theme === "dark" ? "🌙" : "☀️", label: "Apparence", desc: theme === "dark" ? "Mode sombre" : "Mode clair" },
    { id: "privacy", icon: "🔒", label: "Confidentialité", desc: "Dernière connexion, photo de profil" },
    { id: "notifications", icon: "🔔", label: "Notifications", desc: "Sons, badges, alertes" },
    { id: "storage", icon: "💾", label: "Stockage & Données", desc: "Synchronisé Supabase" },
    { id: "qr", icon: "📱", label: "Mon QR Code", desc: "Scanner ou partager" },
    { id: "help", icon: "❓", label: "Aide & Support", desc: "FAQ, contacter le support" },
    { id: "about", icon: "ℹ️", label: "À propos", desc: "Version production" },
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
          <motion.div whileHover={{ scale: 1.08, rotate: 3 }} className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-primary overflow-hidden" style={{ background: profile.avatarStyle }}>{profile.avatarUrl ? <img src={profile.avatarUrl} alt="Profil" className="w-full h-full object-cover" /> : profile.avatar}</motion.div>
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
          <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} className="w-full py-3 rounded-xl border border-envle-rouge/30 bg-envle-rouge/10 text-envle-rouge text-sm font-semibold cursor-pointer font-body hover:bg-envle-rouge/20 transition-all" onClick={() => signOut()}>
            🚪 Se déconnecter
          </motion.button>
        </div>
      </div>

      {/* Profile edit overlay */}
      <AnimatePresence>
        {activeSection === "profile" && (
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ type: "spring", damping: 25 }} className="absolute inset-0 z-50 bg-background flex flex-col">
            <div className="px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3">
              {!requireProfile && <motion.button whileTap={{ scale: 0.85 }} className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center" onClick={() => setActiveSection(null)}>←</motion.button>}
              <h3 className="font-display text-xl font-bold flex-1">Mon profil</h3>
              <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} className="px-4 py-2 rounded-xl border-none text-sm font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={saveProfile}>Sauvegarder</motion.button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin">
              {requireProfile && <div className="rounded-2xl border border-envle-or/30 bg-envle-or/10 p-3 text-sm text-envle-or">Complétez votre profil pour accéder à E'nvlé One.</div>}
              <label className="relative min-h-40 rounded-2xl border border-envle-border overflow-hidden cursor-pointer bg-foreground/[0.06] flex items-center justify-center group">
                {profile.coverUrl ? <img src={profile.coverUrl} alt="Photo de couverture" className="absolute inset-0 w-full h-full object-cover" /> : <span className="text-xs text-envle-text-muted">Photo de couverture obligatoire</span>}
                <span className="absolute inset-x-4 bottom-3 px-3 py-2 rounded-xl bg-background/90 border border-envle-border text-xs font-semibold text-center">📷 Importer une photo de couverture obligatoire</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadProfileMedia(e.target.files[0], "cover")} />
              </label>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 mb-4">
                <label className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-primary overflow-hidden cursor-pointer" style={{ background: profile.avatarStyle }}>
                  {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Photo profil" className="w-full h-full object-cover" /> : profile.avatar}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadProfileMedia(e.target.files[0], "avatar")} />
                </label>
                <span className="text-xs text-primary font-semibold">📷 Importer une photo de profil obligatoire</span>
              </motion.div>
              {[
                { key: "name", label: "Nom complet", placeholder: "Votre nom" },
                { key: "phone", label: "Téléphone", placeholder: "+225 XX XX XX XX" },
                { key: "email", label: "Email", placeholder: "Optionnel" },
                { key: "profession", label: "Profession / activité", placeholder: "Votre activité" },
                { key: "location", label: "Ville", placeholder: "Votre ville" },
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
                <p className="text-xs text-envle-text-muted">Un seul appareil est actif par défaut. Pour autoriser un second appareil, générez un QR et scannez-le avec l'appareil déjà connecté.</p>
              </motion.div>
              <h4 className="text-xs font-bold text-envle-text-muted uppercase tracking-wider mb-3">Appareils ({connectedDevices.length}/1 actif)</h4>
              {connectedDevices.map((device, i) => (
                <motion.div key={device.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ x: 3 }} className="flex items-center gap-3 py-3 border-b border-envle-border/50">
                  <motion.span whileHover={{ scale: 1.15 }} className="text-2xl">{device.type}</motion.span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold flex items-center gap-2">{device.name} {device.isCurrent && <span className="text-[10px] bg-primary/20 text-envle-vert-light px-2 py-0.5 rounded-full">Cet appareil</span>}</div>
                    <div className="text-xs text-envle-text-muted">{device.lastActive}</div>
                  </div>
                  {!device.isCurrent && <motion.button whileTap={{ scale: 0.9 }} className="text-xs text-envle-rouge border-none bg-transparent cursor-pointer font-body" onClick={async () => { await supabase.from("user_devices").delete().eq("id", device.id).eq("user_id", user?.id || ""); toast(`❌ ${device.name} déconnecté`); }}>Déconnecter</motion.button>}
                </motion.div>
              ))}
              {showPairingQR && <div className="mt-4 rounded-2xl border border-envle-border bg-foreground/[0.04] p-4 text-center"><QRCodeDisplay value={`envle-device://${user?.id}/${crypto.randomUUID()}`} size={180} /><p className="mt-3 text-xs text-envle-text-muted">Scannez depuis le nouvel appareil pour autoriser la connexion.</p></div>}
              <motion.button whileTap={{ scale: 0.95 }} whileHover={{ y: -1 }} className="w-full mt-4 py-3 rounded-xl border border-dashed border-envle-border bg-transparent text-sm text-envle-text-muted cursor-pointer font-body hover:border-primary/40 transition-all" onClick={() => setShowPairingQR((v) => !v)}>+ Connecter un autre appareil par QR</motion.button>
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
