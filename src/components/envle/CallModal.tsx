import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Props {
  open: boolean;
  type: string;
  convName: string;
  convAvatar: string;
  convAvatarStyle: string;
  onClose: () => void;
}

const CallModal = ({ open, type, convName, convAvatar, convAvatarStyle, onClose }: Props) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(type === "video");
  const [screenShare, setScreenShare] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) { 
      setCallDuration(0);
      stopCamera();
      return;
    }
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    if (type === "video" && camOn) startCamera();
    return () => clearInterval(interval);
  }, [open]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error("📷 Caméra non disponible");
      setCamOn(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const toggleCam = () => {
    if (camOn) { stopCamera(); setCamOn(false); } else { setCamOn(true); startCamera(); }
  };

  const toggleMic = async () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    }
    setMicOn(!micOn);
    toast(micOn ? "🔇 Micro désactivé" : "🎙️ Micro activé");
  };

  const toggleScreen = async () => {
    if (!screenShare) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setScreenShare(true);
        stream.getVideoTracks()[0].onended = () => { setScreenShare(false); if (camOn) startCamera(); };
      } catch { toast.error("Partage d'écran annulé"); }
    } else { setScreenShare(false); if (camOn) startCamera(); }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
    toast(`📵 Appel terminé · Durée: ${formatDuration(callDuration)}`);
  };

  const participants = [
    { name: convName, avatar: convAvatar, style: convAvatarStyle },
    { name: "Vous", avatar: "👤", style: "linear-gradient(135deg, hsl(142 47% 33%), hsl(142 47% 23%))" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center"
        >
          {/* Video feed */}
          {(type === "video" || screenShare) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!camOn && !screenShare ? "hidden" : ""}`} />
              {!camOn && !screenShare && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0 8px hsla(271,81%,56%,0.1)", "0 0 0 16px hsla(271,81%,56%,0.15)", "0 0 0 8px hsla(271,81%,56%,0.1)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-32 h-32 rounded-full flex items-center justify-center text-6xl"
                  style={{ background: convAvatarStyle }}
                >
                  {convAvatar}
                </motion.div>
              )}
            </div>
          )}

          {/* Audio only view */}
          {type === "audio" && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 mb-8">
              <motion.div
                animate={{ scale: [1, 1.06, 1], boxShadow: ["0 0 0 8px hsla(271,81%,56%,0.1)", "0 0 0 16px hsla(271,81%,56%,0.15)", "0 0 0 8px hsla(271,81%,56%,0.1)"] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-28 h-28 rounded-full flex items-center justify-center text-5xl"
                style={{ background: convAvatarStyle }}
              >
                {convAvatar}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-2xl font-bold text-white">{convName}</motion.div>
              <div className="text-white/60 text-sm">🎙️ Appel audio en cours...</div>
              <motion.div key={callDuration} className="text-white/80 text-lg font-mono">{formatDuration(callDuration)}</motion.div>
            </motion.div>
          )}

          {/* Top bar for video */}
          {type === "video" && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent z-10">
              <div>
                <div className="text-white font-bold">{convName}</div>
                <div className="text-white/60 text-xs">{formatDuration(callDuration)}</div>
              </div>
              <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} className="w-10 h-10 rounded-full bg-white/10 border-none text-white text-sm cursor-pointer flex items-center justify-center" onClick={() => setShowParticipants(!showParticipants)}>👥</motion.button>
            </motion.div>
          )}

          {/* Participants panel */}
          <AnimatePresence>
            {showParticipants && (
              <motion.div initial={{ opacity: 0, x: 200 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 200 }} transition={{ type: "spring", damping: 25 }} className="absolute right-0 top-0 bottom-0 w-[260px] bg-black/80 backdrop-blur-md border-l border-white/10 z-20 p-4">
                <h3 className="text-white font-bold mb-4 text-sm">Participants (2/50)</h3>
                {participants.map((p, i) => (
                  <motion.div key={p.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: p.style }}>{p.avatar}</div>
                    <span className="text-white text-sm">{p.name}</span>
                  </motion.div>
                ))}
                <motion.button whileTap={{ scale: 0.95 }} className="w-full mt-4 py-2 rounded-xl border border-dashed border-white/20 bg-transparent text-white/60 text-xs cursor-pointer font-body" onClick={() => toast("🔗 Lien d'invitation copié!")}>+ Inviter (max 50)</motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-10">
            {[
              { icon: micOn ? "🎙️" : "🔇", active: micOn, onClick: toggleMic, title: "Microphone", danger: !micOn },
              ...(type === "video" ? [{ icon: "📷", active: camOn, onClick: toggleCam, title: "Caméra", danger: !camOn }] : []),
              { icon: "🖥️", active: screenShare, onClick: toggleScreen, title: "Partage d'écran", primary: screenShare },
              { icon: "👥", active: showParticipants, onClick: () => setShowParticipants(!showParticipants), title: "Participants" },
            ].map((btn, i) => (
              <motion.button
                key={btn.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.1, y: -3 }}
                className={`w-14 h-14 rounded-full border-none text-xl cursor-pointer flex items-center justify-center transition-all ${
                  (btn as any).danger ? "bg-envle-rouge text-white" : (btn as any).primary ? "bg-primary text-white" : "bg-white/15 text-white"
                }`}
                onClick={btn.onClick}
                title={btn.title}
              >
                {btn.icon}
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              className="w-16 h-16 rounded-full border-none text-2xl cursor-pointer flex items-center justify-center bg-envle-rouge text-white shadow-lg"
              onClick={handleClose}
              title="Raccrocher"
            >
              📵
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CallModal;
