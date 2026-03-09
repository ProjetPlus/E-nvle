import { useState, useCallback } from "react";
import SplashScreen from "@/components/envle/SplashScreen";
import Sidebar from "@/components/envle/Sidebar";
import ConversationPanel from "@/components/envle/ConversationPanel";
import type { Conversation } from "@/components/envle/ConversationPanel";
import ChatArea from "@/components/envle/ChatArea";
import RightPanel from "@/components/envle/RightPanel";
import AuthModal from "@/components/envle/AuthModal";
import CallModal from "@/components/envle/CallModal";

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

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    setTimeout(() => setAppVisible(true), 50);
  }, []);

  const openCall = useCallback((type = "video") => {
    setCallType(type);
    setCallOpen(true);
  }, []);

  return (
    <div className="h-screen overflow-hidden">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      <div
        className={`flex h-screen transition-opacity duration-500 ${
          appVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Sidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenCall={() => openCall()}
        />
        <ConversationPanel
          activeConvId={activeConv.id}
          onSelectConv={setActiveConv}
        />
        <ChatArea conv={activeConv} onOpenCall={openCall} />
        <RightPanel conv={activeConv} onOpenCall={openCall} />
      </div>

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
