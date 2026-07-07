import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import ContactDiscoveryModal from "./ContactDiscoveryModal";

export interface Conversation {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread?: number;
  avatar: string;
  avatarStyle: string;
  isOnline?: boolean;
  isSquare?: boolean;
  status?: string;
  contactId?: string;
  phone?: string;
}

const tabs = ["Tous", "Non lus", "Groupes", "Chaînes"];

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const staggerItem = {
  initial: { opacity: 0, x: -20, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

interface Props {
  activeConvId: string;
  onSelectConv: (conv: Conversation) => void;
}

const ConversationPanel = ({ activeConvId, onSelectConv }: Props) => {
  const [activeTab, setActiveTab] = useState("Tous");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewConv, setShowNewConv] = useState(false);
  const [newConvName, setNewConvName] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<{ id: string; name: string; email: string; avatarUrl?: string | null; isOnline?: boolean }[]>([]);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setConversations([]); setLoading(false); return; }
    fetchConversations();
    const channel = supabase
      .channel("conversations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchConversations())
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    const { data: memberships } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", user.id);
    if (!memberships || memberships.length === 0) { setConversations([]); setLoading(false); return; }
    const convIds = memberships.map((m) => m.conversation_id);
    const { data: convData } = await supabase.from("conversations").select("*").in("id", convIds).order("updated_at", { ascending: false });
    const { data: allMembers } = await supabase.from("conversation_members").select("conversation_id, user_id").in("conversation_id", convIds);
    const otherIds = Array.from(new Set((allMembers || []).map((m) => m.user_id).filter((id) => id !== user.id)));
    const { data: profiles } = otherIds.length
      ? await supabase.from("profiles").select("id, full_name, phone, avatar_url, status, last_seen").in("id", otherIds)
      : { data: [] as any[] };
    const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
    if (convData) {
      const convList: Conversation[] = await Promise.all(
        convData.map(async (c) => {
          const { data: lastMsgs } = await supabase.from("messages").select("content, created_at").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1);
          const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", c.id).eq("is_read", false).neq("sender_id", user.id);
          const lastMsg = lastMsgs?.[0];
          const time = lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
          const otherMember = (allMembers || []).find((m) => m.conversation_id === c.id && m.user_id !== user.id);
          const otherProfile = otherMember ? profileById.get(otherMember.user_id) : null;
          const displayName = !c.is_group && otherProfile ? otherProfile.full_name || otherProfile.phone || c.name : c.name || "Conversation";
          const lastSeen = otherProfile?.last_seen ? new Date(otherProfile.last_seen).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
          return {
            id: c.id, name: displayName, lastMsg: lastMsg?.content || "", time,
            unread: count && count > 0 ? count : undefined,
            avatar: displayName?.charAt(0)?.toUpperCase() || "💬",
            avatarStyle: c.avatar_style || "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))",
            isOnline: otherProfile?.status === "online", isSquare: c.is_group || false,
            status: otherProfile?.status === "online" ? "Connecté" : lastSeen ? `Vu ${lastSeen}` : "",
            contactId: otherProfile?.id,
            phone: otherProfile?.phone,
          };
        })
      );
      setConversations(convList);
    }
    setLoading(false);
  };

  const searchContacts = async (q: string) => {
    setContactSearch(q);
    if (q.length < 2) { setContacts([]); return; }
    setSearchingContacts(true);
    const safe = q.replace(/[%,()]/g, "");
    const normalized = safe.replace(/[^+\d]/g, "");
    const filters = [`full_name.ilike.%${safe}%`, `phone.ilike.%${safe}%`];
    if (normalized.length >= 2) filters.push(`searchable_phone.ilike.%${normalized}%`);
    const { data } = await supabase.from("profiles").select("id, full_name, email, phone, avatar_url, status").or(filters.join(",")).limit(12);
    setContacts((data || []).filter(p => p.id !== user?.id).map((p: any) => ({ id: p.id, name: p.full_name || p.phone || "Contact", email: p.phone || p.email || "", avatarUrl: p.avatar_url, isOnline: p.status === "online" })));
    setSearchingContacts(false);
  };

  const createConversation = async (contactId?: string) => {
    if (!user) { toast.error("Connectez-vous d'abord"); return; }
    const name = newConvName.trim() || "Nouvelle conversation";

    const { data: conv, error } = await supabase.from("conversations").insert({ name, created_by: user.id, is_group: !!newConvName.trim() }).select().single();
    if (error || !conv) { toast.error("❌ Erreur de création"); return; }

    const { error: memberError } = await supabase.from("conversation_members").insert([{ conversation_id: conv.id, user_id: user.id, role: "admin" }] as any);
    if (memberError) { toast.error(memberError.message); return; }
    if (contactId) {
      const { error: contactError } = await supabase.from("conversation_members").insert({ conversation_id: conv.id, user_id: contactId, role: "member" });
      if (contactError) { toast.error(contactError.message); return; }
    }

    toast.success("✅ Conversation créée!");
    setShowNewConv(false);
    setNewConvName("");
    setContactSearch("");
    setContacts([]);
    fetchConversations();

    onSelectConv({
      id: conv.id, name, lastMsg: "", time: "", avatar: name[0]?.toUpperCase() || "💬",
      avatarStyle: conv.avatar_style || "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))",
      isSquare: false, status: "",
    });
  };

  const filtered = conversations.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.lastMsg.toLowerCase().includes(q)) return false;
    }
    if (activeTab === "Non lus") return (c.unread ?? 0) > 0;
    if (activeTab === "Groupes") return c.isSquare;
    return true;
  });

  return (
    <div className="w-[340px] bg-envle-card border-r border-envle-border flex flex-col overflow-hidden max-lg:w-[280px] max-md:w-full max-md:border-r-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="px-4 md:px-5 pt-4 md:pt-5 flex items-center gap-2">
        <div className="flex-1">
          <h2 className="font-display text-xl md:text-[26px] font-bold">Messages</h2>
          <p className="text-[11px] text-envle-text-muted mt-0.5">{conversations.length} conversations</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="w-9 h-9 rounded-xl border-none text-lg cursor-pointer flex items-center justify-center text-primary-foreground"
          style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
          onClick={() => setShowNewConv(true)}
          title="Nouvelle conversation"
        >
          +
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="w-9 h-9 rounded-xl border border-envle-border text-base cursor-pointer flex items-center justify-center bg-foreground/[0.04]"
          onClick={() => setContactsOpen(true)}
          title="Détecter les contacts"
        >
          📇
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`mx-4 md:mx-5 my-3 bg-foreground/[0.06] border rounded-xl px-3 py-2 flex items-center gap-2 transition-all ${searchFocused ? "border-primary shadow-[0_0_0_3px_hsla(142,47%,33%,0.12)]" : "border-envle-border"}`}
      >
        <span className="text-sm">🔍</span>
        <input
          type="text"
          placeholder="Chercher ou démarrer une conv..."
          className="bg-transparent border-none outline-none text-foreground font-body text-xs md:text-sm flex-1 placeholder:text-envle-text-muted"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </motion.div>

      <div className="flex px-4 md:px-5 gap-1 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {tabs.map((tab, i) => (
          <motion.button
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            whileTap={{ scale: 0.92 }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border-none transition-colors whitespace-nowrap ${
              activeTab === tab ? "bg-primary/20 text-envle-vert-light" : "bg-transparent text-envle-text-muted hover:bg-foreground/[0.04]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex-1 overflow-y-auto px-2 pb-5 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-3xl">⏳</motion.span>
            <p className="text-envle-text-muted text-xs mt-2">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center px-6">
            <span className="text-5xl mb-4">💬</span>
            <p className="text-envle-text-muted text-sm">Aucune conversation</p>
            <p className="text-envle-text-muted text-xs mt-1">
              {user ? "Appuyez sur + pour démarrer" : "Connectez-vous pour commencer"}
            </p>
          </motion.div>
        ) : (
          filtered.map((conv) => (
            <motion.div
              key={conv.id}
              variants={staggerItem}
              whileTap={{ scale: 0.97 }}
              whileHover={{ x: 4, backgroundColor: "hsla(142, 47%, 33%, 0.04)" }}
              className={`flex items-center gap-3 p-2.5 md:p-3 rounded-[14px] cursor-pointer transition-colors ${
                activeConvId === conv.id ? "bg-primary/[0.12]" : ""
              }`}
              onClick={() => onSelectConv(conv)}
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={`w-11 h-11 shrink-0 flex items-center justify-center font-bold text-base relative ${
                  conv.isSquare ? "rounded-[14px]" : "rounded-full"
                }`}
                style={{ background: conv.avatarStyle }}
              >
                {conv.avatar}
                {conv.isOnline && (
                  <span className="absolute bottom-px right-px w-3 h-3 rounded-full bg-green-500 border-2 border-envle-card" style={{ animation: "pulse-status 2s ease-in-out infinite" }} />
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{conv.name}</div>
                <div className="text-xs text-envle-text-muted truncate mt-0.5">{conv.lastMsg}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-envle-text-muted">{conv.time}</span>
                {conv.unread && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="bg-primary text-[11px] font-bold px-[7px] py-[2px] rounded-full text-foreground">
                    {conv.unread}
                  </motion.span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* New conversation modal */}
      <AnimatePresence>
        {showNewConv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewConv(false)}>
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-envle-card border border-envle-border rounded-3xl w-full max-w-[400px] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-bold mb-4">Nouvelle conversation</h3>
              <input
                className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-4 py-3 text-foreground font-body text-sm mb-3 outline-none focus:border-primary placeholder:text-envle-text-muted"
                placeholder="Nom de la conversation (optionnel)"
                value={newConvName}
                onChange={(e) => setNewConvName(e.target.value)}
              />
              <input
                className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-4 py-3 text-foreground font-body text-sm mb-3 outline-none focus:border-primary placeholder:text-envle-text-muted"
                placeholder="🔍 Rechercher un contact..."
                value={contactSearch}
                onChange={(e) => searchContacts(e.target.value)}
              />
              {searchingContacts && <p className="text-xs text-envle-text-muted mb-2">Recherche...</p>}
              {contacts.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto mb-3 flex flex-col gap-1">
                  {contacts.map((c) => (
                    <motion.button
                      key={c.id}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ x: 3 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border-none bg-foreground/[0.04] hover:bg-primary/10 cursor-pointer w-full text-left transition-colors"
                      onClick={() => createConversation(c.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold overflow-hidden relative">{c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" /> : c.name[0]}{c.isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary border border-envle-card" />}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{c.name} <span className="text-primary text-[10px]">◉</span></div>
                        <div className="text-[11px] text-envle-text-muted truncate">{c.email}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-2.5 rounded-xl border-none text-sm font-semibold cursor-pointer text-primary-foreground"
                  style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
                  onClick={() => createConversation()}
                >
                  Créer
                </motion.button>
                <button className="px-5 py-2.5 rounded-xl border border-envle-border bg-transparent text-sm text-envle-text-muted cursor-pointer font-body" onClick={() => setShowNewConv(false)}>Annuler</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ContactDiscoveryModal open={contactsOpen} onClose={() => setContactsOpen(false)} onSelectConversation={onSelectConv} />
    </div>
  );
};

export default ConversationPanel;
