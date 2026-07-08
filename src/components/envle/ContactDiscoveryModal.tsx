import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { normalizePhone } from "@/lib/phone";
import type { Conversation } from "./ConversationPanel";

type NativeContact = { name?: string[]; tel?: string[] };
type ImportedContact = { name: string; phone: string; registered?: MatchedContact };
type MatchedContact = { id: string; name: string; phone: string; avatarUrl?: string | null; status?: string | null; lastSeen?: string | null; sourceName?: string };

type ContactNavigator = Navigator & {
  contacts?: {
    select: (properties: string[], options?: { multiple?: boolean }) => Promise<NativeContact[]>;
  };
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

const avatarStyle = "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))";

const parseManualPhones = (value: string) =>
  Array.from(new Set(value.split(/[\n,;]+/).map((line) => normalizePhone(line.trim())).filter((phone) => /^\+?\d{8,15}$/.test(phone))));

const relativeStatus = (lastSeen?: string | null, status?: string | null) => {
  if (status === "online") return "Connecté maintenant";
  if (!lastSeen) return "Dernière connexion inconnue";
  const minutes = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000);
  if (minutes < 1) return "Connecté récemment";
  if (minutes < 60) return `Vu il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Vu il y a ${hours} h`;
  return `Vu il y a ${Math.floor(hours / 24)} j`;
};

const ContactDiscoveryModal = ({ open, onClose, onSelectConversation }: Props) => {
  const { user } = useAuth();
  const [manualList, setManualList] = useState("");
  const [matches, setMatches] = useState<MatchedContact[]>([]);
  const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);
  const [contactQuery, setContactQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const canUseNativeContacts = useMemo(() => Boolean((navigator as ContactNavigator).contacts?.select), []);

  const findRegisteredProfiles = async (phones: string[], names = new Map<string, string>()) => {
    if (!user || phones.length === 0) { setMatches([]); return; }
    setLoading(true);
    const normalizedPhones = Array.from(new Set(phones.map(normalizePhone).filter((phone) => /^\+?\d{8,15}$/.test(phone))));
    const [{ data: bySearch, error }, { data: byPhone }] = await Promise.all([
      supabase
      .from("profiles")
      .select("id, full_name, phone, avatar_url, status, last_seen")
        .in("searchable_phone", normalizedPhones)
        .neq("id", user.id)
        .limit(200),
      supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url, status, last_seen")
        .in("phone", normalizedPhones)
      .neq("id", user.id)
        .limit(200),
    ]);
    setLoading(false);
    if (error) { toast.error(`Contacts indisponibles: ${error.message}`); return; }
    const unique = new Map<string, any>();
    [...(bySearch || []), ...(byPhone || [])].forEach((profile: any) => unique.set(profile.id, profile));
    const registered = Array.from(unique.values()).map((profile: any) => ({
      id: profile.id,
      name: profile.full_name || profile.phone || "Contact E'nvlé",
      phone: profile.phone || "",
      avatarUrl: profile.avatar_url,
      status: profile.status,
      lastSeen: profile.last_seen,
      sourceName: names.get(normalizePhone(profile.phone || "")),
    }));
    setMatches(registered);
    setImportedContacts((prev) => prev.map((contact) => ({ ...contact, registered: registered.find((match) => normalizePhone(match.phone) === contact.phone) })));
    if (registered.length === 0) toast("Aucun contact inscrit trouvé dans cette liste");
  };

  const pickPhoneContacts = async () => {
    if (!canUseNativeContacts) {
      toast("Import manuel disponible sur cet appareil");
      return;
    }
    try {
      const contacts = await (navigator as ContactNavigator).contacts!.select(["name", "tel"], { multiple: true });
      const imported = contacts.flatMap((contact) => (contact.tel || []).map((tel) => ({ name: contact.name?.[0] || tel, phone: normalizePhone(tel) }))).filter((contact) => /^\+?\d{8,15}$/.test(contact.phone));
      const unique = Array.from(new Map(imported.map((contact) => [contact.phone, contact])).values());
      const names = new Map(unique.map((contact) => [contact.phone, contact.name]));
      setImportedContacts(unique);
      await findRegisteredProfiles(unique.map((contact) => contact.phone), names);
    } catch {
      toast("Accès au répertoire annulé");
    }
  };

  const syncManualContacts = () => {
    const phones = parseManualPhones(manualList);
    const imported = phones.map((phone) => ({ name: phone, phone }));
    setImportedContacts(imported);
    void findRegisteredProfiles(phones, new Map(imported.map((contact) => [contact.phone, contact.name])));
  };

  const startConversation = async (contact: MatchedContact) => {
    if (!user) { toast.error("Connectez-vous d'abord"); return; }
    setLoading(true);
    const { data: myMemberships } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", user.id);
    const convIds = (myMemberships || []).map((m) => m.conversation_id);
    let conversationId: string | undefined;
    if (convIds.length > 0) {
      const { data: existingMembers } = await supabase.from("conversation_members").select("conversation_id").in("conversation_id", convIds).eq("user_id", contact.id).limit(1);
      conversationId = existingMembers?.[0]?.conversation_id;
    }

    if (!conversationId) {
      const { data: conv, error: convError } = await supabase.from("conversations").insert({
        name: contact.name,
        created_by: user.id,
        is_group: false,
      }).select().single();
      if (convError || !conv) { setLoading(false); toast.error(convError?.message || "Conversation impossible"); return; }
      conversationId = conv.id;
      const { error: ownerMemberError } = await supabase.from("conversation_members").insert({ conversation_id: conversationId, user_id: user.id, role: "admin" } as any);
      if (ownerMemberError) { setLoading(false); toast.error(ownerMemberError.message); return; }
      const { error: memberError } = await supabase.from("conversation_members").insert({ conversation_id: conversationId, user_id: contact.id, role: "member" } as any);
      if (memberError) { setLoading(false); toast.error(memberError.message); return; }
    }

    await supabase.from("contacts").upsert({ user_id: user.id, contact_id: contact.id, status: "active" } as any, { onConflict: "user_id,contact_id" });
    setLoading(false);
    onSelectConversation({
      id: conversationId,
      name: contact.name,
      lastMsg: "",
      time: "",
      avatar: contact.avatarUrl ? "" : contact.name.charAt(0).toUpperCase(),
      avatarStyle,
      contactId: contact.id,
      phone: contact.phone,
      isOnline: contact.status === "online",
      status: relativeStatus(contact.lastSeen, contact.status),
    });
    toast.success(`Conversation ouverte avec ${contact.name}`);
    onClose();
  };

  const visibleContacts = importedContacts.filter((contact) => {
    const q = contactQuery.toLowerCase().trim();
    if (!q) return true;
    return contact.name.toLowerCase().includes(q) || contact.phone.includes(q);
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }} className="w-full max-w-[520px] max-h-[88vh] overflow-hidden bg-envle-card border border-envle-border rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-envle-border flex items-center gap-3">
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold">Contacts E'nvlé</h3>
                <p className="text-xs text-envle-text-muted">Détecter les numéros inscrits et démarrer une conversation</p>
              </div>
              <button className="w-9 h-9 rounded-xl bg-foreground/[0.06] border-none cursor-pointer" onClick={onClose}>✕</button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(88vh-80px)] scrollbar-thin">
              <motion.button whileTap={{ scale: 0.97 }} disabled={!canUseNativeContacts || loading} className="w-full py-3 rounded-xl border-none bg-primary text-primary-foreground font-semibold cursor-pointer disabled:opacity-50" onClick={pickPhoneContacts}>
                📱 Scanner le répertoire du téléphone
              </motion.button>
              {!canUseNativeContacts && <p className="text-[11px] text-envle-text-muted mt-2">Votre navigateur ne donne pas accès direct au répertoire. Collez vos contacts ci-dessous.</p>}

              <textarea value={manualList} onChange={(e) => setManualList(e.target.value)} className="mt-4 w-full min-h-[110px] bg-foreground/[0.06] border border-envle-border rounded-2xl p-3 text-sm outline-none focus:border-primary resize-none" placeholder={"Coller des numéros, un par ligne\n+2250700000000\n+221770000000"} />
              <button className="mt-2 w-full py-2.5 rounded-xl border border-envle-border bg-transparent text-sm font-semibold cursor-pointer" onClick={syncManualContacts} disabled={loading}>🔎 Filtrer les inscrits</button>

              {importedContacts.length > 0 && (
                <div className="mt-4 rounded-2xl border border-envle-border bg-foreground/[0.03] p-3">
                  <input value={contactQuery} onChange={(e) => setContactQuery(e.target.value)} className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Rechercher par nom ou numéro" />
                  <div className="mt-3 max-h-48 overflow-y-auto scrollbar-thin flex flex-col gap-1">
                    {visibleContacts.map((contact) => (
                      <button key={contact.phone} className="flex items-center gap-3 p-2 rounded-xl border-none bg-transparent hover:bg-primary/10 cursor-pointer text-left" onClick={() => contact.registered && startConversation(contact.registered)} disabled={!contact.registered}>
                        <span className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs">{contact.registered ? "◉" : "○"}</span>
                        <span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{contact.name}</span><span className="block text-[11px] text-envle-text-muted truncate">{contact.phone}</span></span>
                        <span className={contact.registered ? "text-primary text-xs font-bold" : "text-envle-text-muted text-xs"}>{contact.registered ? "E'nvlé" : "Inviter"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2">
                {loading && <p className="text-sm text-envle-text-muted text-center py-4">Recherche...</p>}
                {!loading && matches.map((contact) => (
                  <motion.button key={contact.id} whileTap={{ scale: 0.98 }} whileHover={{ x: 3 }} className="flex items-center gap-3 p-3 rounded-2xl border border-envle-border bg-foreground/[0.03] cursor-pointer text-left" onClick={() => startConversation(contact)}>
                    <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center font-bold overflow-hidden">{contact.avatarUrl ? <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" /> : contact.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{contact.sourceName || contact.name}</div>
                      <div className="text-xs text-envle-text-muted truncate">{contact.phone} · {relativeStatus(contact.lastSeen, contact.status)}</div>
                    </div>
                    <span className="text-primary">➤</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContactDiscoveryModal;