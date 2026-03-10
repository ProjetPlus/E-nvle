import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "@/components/envle/SplashScreen";
import Sidebar from "@/components/envle/Sidebar";
import MobileNav from "@/components/envle/MobileNav";
import ConversationPanel from "@/components/envle/ConversationPanel";
import type { Conversation } from "@/components/envle/ConversationPanel";
import ChatArea from "@/components/envle/ChatArea";
import RightPanel from "@/components/envle/RightPanel";
import AuthModal from "@/components/envle/AuthModal";
import CallModal from "@/components/envle/CallModal";
import StoriesModule from "@/components/envle/StoriesModule";
import BoutiqueModule from "@/components/envle/BoutiqueModule";
import CommunityModule from "@/components/envle/CommunityModule";
import { useIsMobile } from "@/hooks/use-mobile";

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
    switch (activeNav) {
      case "stories":
        return <StoriesModule onBack={() => setActiveNav("chat")} />;
      case "shop":
        return <BoutiqueModule onBack={() => setActiveNav("chat")} />;
      case "community":
        return <CommunityModule onBack={() => setActiveNav("chat")} />;
      default:
        return (
          <>
            {/* Conversation list - hidden on mobile when viewing chat */}
            <div className={`${isMobile && mobileView === "chat" ? "hidden" : "flex"} ${isMobile ? "flex-1" : ""}`}>
              <ConversationPanel
                activeConvId={activeConv.id}
                onSelectConv={handleSelectConv}
              />
            </div>
            {/* Chat area - hidden on mobile when viewing list */}
            <div className={`flex-1 flex ${isMobile && mobileView === "list" ? "hidden" : ""}`}>
              <ChatArea
                conv={activeConv}
                onOpenCall={openCall}
                onBack={isMobile ? () => setMobileView("list") : undefined}
              />
            </div>
            {!isMobile && <RightPanel conv={activeConv} onOpenCall={openCall} />}
          </>
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: appVisible ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="flex h-screen"
        style={{ paddingBottom: isMobile ? "64px" : 0 }}
      >
        <Sidebar
          activeNav={activeNav}
          onNavChange={handleNavChange}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenCall={() => openCall()}
        />
        {renderMainContent()}
      </motion.div>

      {isMobile && appVisible && (
        <MobileNav
          activeNav={activeNav}
          onNavChange={handleNavChange}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenCall={() => openCall()}
        />
      )}

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
