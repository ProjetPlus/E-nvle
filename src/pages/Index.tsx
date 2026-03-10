import { useState, useCallback } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";

const pageTransition = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.25, ease: "easeInOut" as const },
};

const defaultConv: Conversation = {
  id: "1",
  name: "Amara Diallo",
  lastMsg: "✓✓ Ok je regarde ça maintenant 🙏",
  time: "09:42",
  unread: 3,
  avatar: "A",
  avatarStyle: "linear-gradient(135deg,#7c3aed,#ec4899)",
  isOnline: true,
  status: "Architecte à Abidjan",
};

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [appVisible, setAppVisible] = useState(false);
  const [activeNav, setActiveNav] = useState("chat");
  const [activeConv, setActiveConv] = useState<Conversation>(defaultConv);
  const [authOpen, setAuthOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState("video");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    setTimeout(() => setAppVisible(true), 50);
  }, []);

  const openCall = useCallback((type = "video") => {
    setCallType(type);
    setCallOpen(true);
  }, []);

  const handleSelectConv = useCallback((conv: Conversation) => {
    setActiveConv(conv);
    setMobileView("chat");
  }, []);

  const handleNavChange = useCallback((nav: string) => {
    setActiveNav(nav);
    setMobileView("list");
  }, []);

  const renderMainContent = () => {
    const goChat = () => setActiveNav("chat");

    return (
      <AnimatePresence mode="wait">
        <motion.div key={activeNav} {...pageTransition} className="flex-1 flex overflow-hidden">
          {activeNav === "stories" && <StoriesModule onBack={goChat} />}
          {activeNav === "shop" && <BoutiqueModule onBack={goChat} />}
          {activeNav === "community" && <CommunityModule onBack={goChat} />}
          {activeNav === "calls" && <CallsModule onBack={goChat} />}
          {activeNav === "jobs" && <JobsModule onBack={goChat} />}
          {activeNav === "map" && <MapModule onBack={goChat} />}
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: appVisible ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="flex h-screen"
      >
        <Sidebar
          activeNav={activeNav}
          onNavChange={handleNavChange}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenCall={() => openCall()}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Mobile hamburger button */}
        {isMobile && appVisible && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="fixed top-3 left-3 z-[140] w-10 h-10 rounded-xl bg-envle-card border border-envle-border flex items-center justify-center text-lg cursor-pointer shadow-lg"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </motion.button>
        )}

        {renderMainContent()}
      </motion.div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <CallModal
        open={callOpen}
        type={callType}
        convName={activeConv.name}
        convAvatar={activeConv.avatar}
        convAvatarStyle={activeConv.avatarStyle}
        onClose={() => setCallOpen(false)}
      />
    </div>
  );
};

export default Index;
