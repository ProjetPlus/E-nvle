import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { playLoopingSound } from "@/lib/sounds";
import { getIceServers, safeRtcDescription } from "@/lib/webrtc";

interface Props {
  open: boolean;
  type: string;
  convName: string;
  convAvatar: string;
  convAvatarStyle: string;
  callId?: string;
  direction?: "incoming" | "outgoing" | "meeting";
  remoteUserId?: string;
  onClose: () => void;
}

type CallStatus = "Appel entrant" | "Ça sonne..." | "Connexion média..." | "Appel en cours" | "Injoignable" | "Terminé";

const formatDuration = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const CallModal = ({ open, type, convName, convAvatar, convAvatarStyle, callId, direction = "meeting", remoteUserId, onClose }: Props) => {
  const { user } = useAuth();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(type === "video");
  const [screenShare, setScreenShare] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [remoteMicOn, setRemoteMicOn] = useState(true);
  const [remoteCamOn, setRemoteCamOn] = useState(type === "video");
  const [callStatus, setCallStatus] = useState<CallStatus>(direction === "outgoing" ? "Ça sonne..." : direction === "incoming" ? "Appel entrant" : "Appel en cours");
  const [qualityOn, setQualityOn] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const ringtoneStopRef = useRef<(() => void) | null>(null);
  const processedSignals = useRef<Set<string>>(new Set());
  const setupKeyRef = useRef<string>("");

  const sendSignal = useCallback(async (signalType: string, payload: unknown) => {
    if (!callId || !user?.id || !remoteUserId) return;
    await supabase.from("call_signals").insert({
      call_id: callId,
      sender_id: user.id,
      recipient_id: remoteUserId,
      signal_type: signalType,
      payload: payload as any,
    } as any);
    await supabase.from("calls").update({ last_signal_at: new Date().toISOString() } as any).eq("id", callId);
  }, [callId, remoteUserId, user?.id]);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const startLocalMedia = useCallback(async (withVideo = type === "video") => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: withVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: "user" } : false,
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    stream.getAudioTracks().forEach((track) => (track.enabled = micOn));
    stream.getVideoTracks().forEach((track) => (track.enabled = camOn));
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, [camOn, micOn, type]);

  const createPeer = useCallback(async (stream: MediaStream) => {
    if (peerRef.current) return peerRef.current;
    const { data: call } = callId ? await supabase.from("calls").select("stun_turn_config").eq("id", callId).maybeSingle() : { data: null };
    const peer = new RTCPeerConnection({ iceServers: getIceServers((call as any)?.stun_turn_config) });
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.onicecandidate = (event) => {
      if (event.candidate) void sendSignal("candidate", event.candidate.toJSON());
    };
    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setRemoteConnected(true);
      setCallStatus("Appel en cours");
      ringtoneStopRef.current?.();
    };
    peer.onconnectionstatechange = () => {
      if (["connected", "completed"].includes(peer.connectionState)) {
        setRemoteConnected(true);
        setCallStatus("Appel en cours");
      }
      if (["failed", "disconnected"].includes(peer.connectionState)) setCallStatus("Injoignable");
    };
    peerRef.current = peer;
    return peer;
  }, [callId, sendSignal]);

  const processSignal = useCallback(async (signal: any) => {
    if (!signal?.id || processedSignals.current.has(signal.id) || signal.sender_id === user?.id) return;
    processedSignals.current.add(signal.id);
    if (signal.signal_type === "offer") {
      const stream = await startLocalMedia(type === "video");
      const peer = await createPeer(stream);
      await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await sendSignal("answer", safeRtcDescription(answer));
      setCallStatus("Connexion média...");
    }
    if (signal.signal_type === "answer" && peerRef.current) {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal.payload));
      setCallStatus("Connexion média...");
    }
    if (signal.signal_type === "candidate" && peerRef.current) {
      try { await peerRef.current.addIceCandidate(new RTCIceCandidate(signal.payload)); } catch { /* candidate can arrive before SDP */ }
    }
  }, [createPeer, sendSignal, startLocalMedia, type, user?.id]);

  const startOutgoingWebRtc = useCallback(async () => {
    if (!callId || !remoteUserId || !user?.id) return;
    const key = `${callId}-outgoing`;
    if (setupKeyRef.current === key) return;
    setupKeyRef.current = key;
    try {
      const stream = await startLocalMedia(type === "video");
      const peer = await createPeer(stream);
      const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: type === "video" });
      await peer.setLocalDescription(offer);
      await sendSignal("offer", safeRtcDescription(offer));
      await supabase.from("calls").update({ status: "ringing", ring_state: "ringing", caller_presence: "ringing" } as any).eq("id", callId);
    } catch {
      setCallStatus("Injoignable");
      toast.error("Média indisponible sur cet appareil");
    }
  }, [callId, createPeer, remoteUserId, sendSignal, startLocalMedia, type, user?.id]);

  useEffect(() => {
    if (!open) {
      setCallDuration(0);
      setRemoteConnected(false);
      processedSignals.current.clear();
      setupKeyRef.current = "";
      ringtoneStopRef.current?.();
      ringtoneStopRef.current = null;
      stopMedia();
      return;
    }
    const interval = window.setInterval(() => setCallDuration((duration) => duration + 1), 1000);
    setCamOn(type === "video");
    setRemoteCamOn(type === "video");
    setCallStatus(direction === "outgoing" ? "Ça sonne..." : direction === "incoming" ? "Appel entrant" : "Appel en cours");
    if (direction === "incoming") ringtoneStopRef.current = playLoopingSound("incoming");
    if (direction === "outgoing") {
      ringtoneStopRef.current = playLoopingSound("outgoing");
      void startOutgoingWebRtc();
    }
    const timeout = window.setTimeout(() => {
      if (direction === "outgoing" && !remoteConnected) {
        setCallStatus("Injoignable");
        ringtoneStopRef.current?.();
        if (callId) void supabase.from("calls").update({ status: "missed", ring_state: "unavailable", ended_at: new Date().toISOString() } as any).eq("id", callId);
      }
    }, 30_000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      ringtoneStopRef.current?.();
    };
  }, [callId, direction, open, remoteConnected, startOutgoingWebRtc, stopMedia, type]);

  useEffect(() => {
    if (!open || !callId) return;
    const loadExistingSignals = async () => {
      const { data } = await supabase.from("call_signals").select("*").eq("call_id", callId).order("created_at", { ascending: true });
      for (const signal of data || []) await processSignal(signal);
    };
    void loadExistingSignals();
    const channel = supabase
      .channel(`call-sync-${callId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "call_signals", filter: `call_id=eq.${callId}` }, (payload) => void processSignal(payload.new))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "calls", filter: `id=eq.${callId}` }, (payload) => {
        const call = payload.new as any;
        if (call.status === "ringing") setCallStatus("Ça sonne...");
        if (call.status === "active") { setCallStatus("Appel en cours"); ringtoneStopRef.current?.(); }
        if (call.status === "missed") { setCallStatus("Injoignable"); ringtoneStopRef.current?.(); }
        if (call.status === "ended") void handleClose(false, false);
        if (typeof call.caller_muted === "boolean" && direction === "incoming") setRemoteMicOn(!call.caller_muted);
        if (typeof call.callee_muted === "boolean" && direction === "outgoing") setRemoteMicOn(!call.callee_muted);
        if (typeof call.caller_video_enabled === "boolean" && direction === "incoming") setRemoteCamOn(call.caller_video_enabled);
        if (typeof call.callee_video_enabled === "boolean" && direction === "outgoing") setRemoteCamOn(call.callee_video_enabled);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [callId, direction, open, processSignal]);

  useEffect(() => {
    const preventCaptureKeys = (event: KeyboardEvent) => {
      if (open && (event.key === "PrintScreen" || (event.metaKey && event.shiftKey && ["3", "4", "5"].includes(event.key)))) {
        event.preventDefault();
        toast("Protection d'appel active");
      }
    };
    window.addEventListener("keydown", preventCaptureKeys);
    return () => window.removeEventListener("keydown", preventCaptureKeys);
  }, [open]);

  const toggleCam = async () => {
    const next = !camOn;
    setCamOn(next);
    localStreamRef.current?.getVideoTracks().forEach((track) => (track.enabled = next));
    if (!localStreamRef.current && next) await startLocalMedia(true);
    if (callId) await supabase.from("calls").update(direction === "incoming" ? { callee_video_enabled: next } : { caller_video_enabled: next } as any).eq("id", callId);
  };

  const toggleMic = async () => {
    const next = !micOn;
    setMicOn(next);
    localStreamRef.current?.getAudioTracks().forEach((track) => (track.enabled = next));
    if (callId) await supabase.from("calls").update(direction === "incoming" ? { callee_muted: !next } : { caller_muted: !next } as any).eq("id", callId);
    toast(next ? "Micro activé" : "Micro désactivé");
  };

  const acceptCall = async () => {
    ringtoneStopRef.current?.();
    setCallStatus("Connexion média...");
    try {
      const stream = await startLocalMedia(type === "video");
      await createPeer(stream);
      if (callId) await supabase.from("calls").update({ status: "active", answered_at: new Date().toISOString(), ring_state: "answered", callee_presence: "answered", media_ready: true } as any).eq("id", callId);
      const { data } = callId ? await supabase.from("call_signals").select("*").eq("call_id", callId).order("created_at", { ascending: true }) : { data: [] };
      for (const signal of data || []) await processSignal(signal);
    } catch {
      toast.error("Caméra ou micro indisponible");
      setCallStatus("Injoignable");
    }
  };

  const markRemoteUnavailable = async () => {
    setCallStatus("Injoignable");
    ringtoneStopRef.current?.();
    if (callId) await supabase.from("calls").update({ status: "missed", ring_state: "unavailable", ended_at: new Date().toISOString() } as any).eq("id", callId);
  };

  const toggleScreen = async () => {
    if (!screenShare) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];
        const sender = peerRef.current?.getSenders().find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setScreenShare(true);
        screenTrack.onended = async () => {
          const cameraTrack = localStreamRef.current?.getVideoTracks()[0] || null;
          await sender?.replaceTrack(cameraTrack);
          if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
          setScreenShare(false);
        };
      } catch { toast.error("Partage d'écran annulé"); }
    } else {
      setScreenShare(false);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  const handleClose = async (notify = true, updateDb = true) => {
    setCallStatus("Terminé");
    stopMedia();
    ringtoneStopRef.current?.();
    if (callId && updateDb) await supabase.from("calls").update({ status: "ended", ended_at: new Date().toISOString(), duration: callDuration } as any).eq("id", callId);
    onClose();
    if (notify) toast(`Appel terminé · Durée: ${formatDuration(callDuration)}`);
  };

  const participants = [
    { name: convName, avatar: convAvatar, style: convAvatarStyle, mic: remoteMicOn, cam: remoteCamOn, remote: true },
    { name: "Vous", avatar: "👤", style: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))", mic: micOn, cam: camOn, remote: false },
  ];
  const showVideo = type === "video" || screenShare;
  const qualityClass = qualityOn ? "brightness-110 contrast-110 saturate-110 [filter:brightness(1.12)_contrast(1.08)_saturate(1.08)_drop-shadow(0_0_1px_hsla(0,0%,100%,0.25))]" : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-envle-noir/95 backdrop-blur-md flex flex-col items-center justify-center select-none">
          {showVideo && (
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <video ref={remoteVideoRef} autoPlay playsInline controlsList="nodownload noremoteplayback" disablePictureInPicture className={`absolute inset-0 w-full h-full object-cover ${qualityClass} ${remoteConnected && remoteCamOn ? "" : "opacity-0"}`} />
              {(!remoteConnected || !remoteCamOn) && (
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-32 h-32 rounded-full flex items-center justify-center text-6xl" style={{ background: convAvatarStyle }}>{convAvatar}</motion.div>
              )}
              <video ref={localVideoRef} autoPlay muted playsInline controlsList="nodownload noremoteplayback" disablePictureInPicture className={`absolute right-4 bottom-28 w-28 h-40 md:w-40 md:h-56 rounded-2xl object-cover border border-primary/40 bg-envle-card shadow-xl ${qualityClass} ${camOn || screenShare ? "" : "hidden"}`} />
            </div>
          )}

          {type === "audio" && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 mb-8">
              <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-28 h-28 rounded-full flex items-center justify-center text-5xl" style={{ background: convAvatarStyle }}>{convAvatar}</motion.div>
              <div className="text-2xl font-bold text-primary-foreground">{convName}</div>
              <div className="text-primary-foreground/70 text-sm">{callStatus}</div>
              <div className="text-primary-foreground/85 text-lg font-mono">{formatDuration(callDuration)}</div>
            </motion.div>
          )}

          {showVideo && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-envle-noir/80 to-transparent z-10">
              <div>
                <div className="text-primary-foreground font-bold">{convName}</div>
                <div className="text-primary-foreground/65 text-xs">{callStatus} · {formatDuration(callDuration)}</div>
              </div>
              <button className="w-10 h-10 rounded-full bg-foreground/10 border-none text-primary-foreground text-sm cursor-pointer flex items-center justify-center" onClick={() => setShowParticipants(!showParticipants)}>👥</button>
            </motion.div>
          )}

          <AnimatePresence>
            {showParticipants && (
              <motion.div initial={{ opacity: 0, x: 200 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 200 }} className="absolute right-0 top-0 bottom-0 w-[260px] bg-envle-noir/85 backdrop-blur-md border-l border-primary/20 z-20 p-4">
                <h3 className="text-primary-foreground font-bold mb-4 text-sm">Participants</h3>
                {participants.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: p.style }}>{p.avatar}</div>
                    <span className="text-primary-foreground text-sm flex-1">{p.name}</span>
                    <button className={`w-7 h-7 rounded-full border-none cursor-pointer ${p.mic ? "bg-foreground/10" : "bg-envle-rouge"}`} onClick={() => p.remote ? undefined : toggleMic()}>{p.mic ? "🎙️" : "🔇"}</button>
                    <button className={`w-7 h-7 rounded-full border-none cursor-pointer ${p.cam ? "bg-foreground/10" : "bg-envle-rouge"}`} onClick={() => p.remote ? undefined : toggleCam()}>{p.cam ? "📷" : "🚫"}</button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 md:gap-4 z-10 px-4">
            {direction === "incoming" && callStatus === "Appel entrant" && <button className="w-16 h-16 rounded-full border-none text-2xl cursor-pointer flex items-center justify-center bg-primary text-primary-foreground shadow-lg" onClick={acceptCall} title="Décrocher">📞</button>}
            {[
              { icon: micOn ? "🎙️" : "🔇", onClick: toggleMic, title: "Microphone", danger: !micOn },
              ...(type === "video" ? [{ icon: camOn ? "📷" : "🚫", onClick: toggleCam, title: "Caméra", danger: !camOn }] : []),
              { icon: qualityOn ? "✨" : "🌓", onClick: () => setQualityOn(!qualityOn), title: "Lumière, netteté, stabilisation", primary: qualityOn },
              { icon: "🖥️", onClick: toggleScreen, title: "Partage d'écran", primary: screenShare },
              { icon: "👥", onClick: () => setShowParticipants(!showParticipants), title: "Participants" },
              ...(direction === "outgoing" && callStatus === "Ça sonne..." ? [{ icon: "📵", onClick: markRemoteUnavailable, title: "Marquer injoignable", danger: true }] : []),
            ].map((btn) => (
              <button key={btn.title} className={`w-14 h-14 rounded-full border-none text-xl cursor-pointer flex items-center justify-center transition-all ${(btn as any).danger ? "bg-envle-rouge text-primary-foreground" : (btn as any).primary ? "bg-primary text-primary-foreground" : "bg-foreground/15 text-primary-foreground"}`} onClick={btn.onClick} title={btn.title}>{btn.icon}</button>
            ))}
            <button className="w-16 h-16 rounded-full border-none text-2xl cursor-pointer flex items-center justify-center bg-envle-rouge text-primary-foreground shadow-lg" onClick={() => handleClose()} title="Raccrocher">📵</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CallModal;
