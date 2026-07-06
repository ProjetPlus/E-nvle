import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "@/components/envle/SplashScreen";
import Sidebar from "@/components/envle/Sidebar";
import ConversationPanel from "@/components/envle/ConversationPanel";
import type { Conversation } from "@/components/envle/ConversationPanel";
import ChatArea from "@/components/envle/ChatArea";
import RightPanel from "@/components/envle/RightPanel";
import AuthModal from "@/components/envle/AuthModal";
import CallModal from "@/components/envle/CallModal";
import StoriesModule from "@/components/envle/StoriesModule";
import BoutiqueModule from "@/components/envle/BoutiqueModule";
import CommunityModule from "@/components/envle/CommunityModule";
import CallsModule from "@/components/envle/CallsModule";
import JobsModule from "@/components/envle/JobsModule";
import MapModule from "@/components/envle/MapModule";
import WalletModule from "@/components/envle/WalletModule";
import SettingsModule from "@/components/envle/SettingsModule";
import type { UserProfile } from "@/components/envle/SettingsModule";
import NotificationCenter, { type Notification } from "@/components/envle/NotificationCenter";
import CreateBusinessModal from "@/components/envle/CreateBusinessModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { supabase } from "@/integrations/supabase/client";
import { playLoopingSound } from "@/lib/sounds";

const pageTransition = {
  initial: { opacity: 0, x: 20, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.98 },
  transition: { duration: 0.25, type: "spring" as const, stiffness: 300, damping: 30 },
};

const emptyConv: Conversation = {
  id: "",
  name: "Sélectionnez une conversation",
  lastMsg: "",
  time: "",
  avatar: "💬",
  avatarStyle: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))",
  status: "",
};

const defaultProfile: UserProfile = {
  name: "",
  phone: "",
  email: "",
  bio: "",
  avatar: "?",
  avatarUrl: "",
  coverUrl: "",
  avatarStyle: "linear-gradient(135deg, hsl(142 47% 23%), hsl(142 47% 33%))",
  location: "",
  profession: "",
};

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [appVisible, setAppVisible] = useState(false);
  const [activeNav, setActiveNav] = useState("chat");
  const [activeConv, setActiveConv] = useState<Conversation>(emptyConv);
  const [authOpen, setAuthOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState("video");
  const [currentCallId, setCurrentCallId] = useState<string | undefined>();
  const [callDirection, setCallDirection] = useState<"incoming" | "outgoing" | "meeting">("meeting");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);
  const [createModal, setCreateModal] = useState<{ open: boolean; type: "business" | "job" | "product" }>({ open: false, type: "business" });
  const isMobile = useIsMobile();
  const { user, profile, loading: authLoading } = useAuth();
  useRealtimeNotifications(user?.id, (notification) => setNotifications((prev) => [notification, ...prev].slice(0, 80)));

  const userInitials = profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : user?.email ? user.email.substring(0, 2).toUpperCase() : "?";
  const mustCompleteProfile = Boolean(user && profile && !profile.profile_completed);

  useEffect(() => {
    if (!profile) return;
    setUserProfile({
      name: profile.full_name || "",
      phone: profile.phone || "",
      email: profile.email || user?.email || "",
      bio: profile.bio || "",
      avatar: (profile.full_name || user?.email || "?").charAt(0).toUpperCase(),
      avatarUrl: profile.avatar_url || "",
      coverUrl: profile.cover_url || "",
      avatarStyle: defaultProfile.avatarStyle,
      location: profile.location || "",
      profession: profile.profession || "",
    });
    if (!profile.profile_completed) setActiveNav("settings");
  }, [profile, user?.email]);

  useEffect(() => {
    if (!user) { setAuthOpen(true); return; }
    setAuthOpen(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`calls-live-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "calls", filter: `callee_id=eq.${user.id}` }, (payload) => {
        const call = payload.new as any;
        setCurrentCallId(call.id);
        setCallDirection("incoming");
        setCallType(call.call_type || "audio");
        setCallOpen(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    setTimeout(() => setAppVisible(true), 50);
  }, []);

  const openCall = useCallback(async (type = "video") => {
    setCallType(type);
    setCallDirection(activeConv.contactId ? "outgoing" : "meeting");
    setCurrentCallId(undefined);
    if (user && activeConv.contactId) {
      const stopTone = playLoopingSound("outgoing");
      window.setTimeout(stopTone, 7000);
      const { data, error } = await supabase.from("calls").insert({
        caller_id: user.id,
        callee_id: activeConv.contactId,
        conversation_id: activeConv.id || null,
        call_type: type,
        status: "ringing",
        ring_state: "ringing",
      } as any).select().single();
      if (error) { toast.error(error.message); return; }
      setCurrentCallId(data.id);
    }
    setCallOpen(true);
  }, [activeConv.contactId, activeConv.id, user]);

  const handleSelectConv = useCallback((conv: Conversation) => {
    setActiveConv(conv);
    setMobileView("chat");
  }, []);

  const handleNavChange = useCallback((nav: string) => {
    setActiveNav(nav);
    setMobileView("list");
  }, []);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const clearNotifications = () => setNotifications([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderMainContent = () => {
    const goChat = () => setActiveNav("chat");
    if (authLoading) return <div className="flex-1 grid place-items-center bg-background text-envle-text-muted">Chargement...</div>;
    if (!user) return <div className="flex-1 grid place-items-center bg-background text-center px-6"><button className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold" onClick={() => setAuthOpen(true)}>Se connecter</button></div>;

    return (
      <AnimatePresence mode="wait">
        <motion.div key={activeNav} {...pageTransition} className="flex-1 flex overflow-hidden">
          {activeNav === "stories" && <StoriesModule onBack={goChat} />}
          {activeNav === "shop" && <BoutiqueModule onBack={goChat} onCreateProduct={() => setCreateModal({ open: true, type: "product" })} />}
          {activeNav === "community" && <CommunityModule onBack={goChat} />}
          {activeNav === "calls" && <CallsModule onBack={goChat} onStartCall={openCall} />}
          {activeNav === "jobs" && <JobsModule onBack={goChat} onCreateJob={() => setCreateModal({ open: true, type: "job" })} onCreateBusiness={() => setCreateModal({ open: true, type: "business" })} />}
          {activeNav === "map" && <MapModule onBack={goChat} />}
          {activeNav === "wallet" && <WalletModule onBack={goChat} />}
          {activeNav === "settings" && <SettingsModule onBack={goChat} userProfile={userProfile} onUpdateProfile={setUserProfile} requireProfile={mustCompleteProfile} onProfileSaved={() => setActiveNav("chat")} />}
          {activeNav === "chat" && (
            <>
              <div className={`${isMobile && mobileView === "chat" ? "hidden" : "flex"} ${isMobile ? "flex-1" : ""}`}>
                <ConversationPanel activeConvId={activeConv.id} onSelectConv={handleSelectConv} />
              </div>
              <div className={`flex-1 flex ${isMobile && mobileView === "list" ? "hidden" : ""}`}>
                <ChatArea conv={activeConv} onOpenCall={openCall} onBack={isMobile ? () => setMobileView("list") : undefined} />
              </div>
              {!isMobile && <RightPanel conv={activeConv} onOpenCall={openCall} />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="h-screen overflow-hidden">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: appVisible ? 1 : 0 }} transition={{ duration: 0.5 }} className="flex h-screen">
        <Sidebar
          activeNav={activeNav}
          onNavChange={handleNavChange}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenCall={() => openCall()}
          onOpenNotifications={() => setNotificationsOpen(true)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          unreadNotifications={unreadCount}
          userInitials={userInitials}
        />

        {isMobile && appVisible && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
            className="fixed top-3 left-3 z-[140] w-10 h-10 rounded-xl bg-envle-card border border-envle-border flex items-center justify-center text-lg cursor-pointer shadow-lg"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </motion.button>
        )}

        {renderMainContent()}
      </motion.div>

      <AuthModal open={authOpen && !user} onClose={() => setAuthOpen(false)} />
      <CallModal open={callOpen} type={callType} convName={activeConv.name} convAvatar={activeConv.avatar} convAvatarStyle={activeConv.avatarStyle} callId={currentCallId} direction={callDirection} remoteUserId={activeConv.contactId} onClose={() => setCallOpen(false)} />
      <NotificationCenter open={notificationsOpen} onClose={() => setNotificationsOpen(false)} notifications={notifications} onMarkAllRead={markAllRead} onClearAll={clearNotifications} />
      <CreateBusinessModal open={createModal.open} type={createModal.type} onClose={() => setCreateModal({ ...createModal, open: false })} />
    </div>
  );
};

export default Index;
