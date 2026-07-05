import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Conversation } from "./ConversationPanel";
import FileAttachment, { type FileAttachmentData, formatSize } from "./FileAttachment";
import FileViewer from "./FileViewer";
import { getAppLanguage } from "./SettingsModule";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: string;
  text: string;
  originalText?: string;
  sent: boolean;
  time: string;
  isVoice?: boolean;
  isImage?: boolean;
  isTyping?: boolean;
  files?: FileAttachmentData[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  messageType?: string;
  senderLang?: string;
}

interface Props {
  conv: Conversation;
  onOpenCall: (type: string) => void;
  onBack?: () => void;
}

const msgVariants = {
  initial: { opacity: 0, y: 12, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 25 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

const EMOJI_LIST = ["😀","😂","🥰","😍","🤩","😎","🤔","😅","😢","😡","🥳","🤗","😇","🙏","👍","👎","❤️","🔥","💯","✨","🎉","🎊","💪","👏","🙌","💀","😤","🥺","😭","😈","👀","💬","📸","🎵","⚡","🌍","🇨🇮","🇸🇳","🇲🇱","🇧🇫","🇬🇳","🇳🇬","🇬🇭","🇹🇬","🇧🇯","🇳🇪"];

const ChatArea = ({ conv, onOpenCall, onBack }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileAttachmentData[]>([]);
  const [viewingFile, setViewingFile] = useState<FileAttachmentData | null>(null);
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [inputFocused, setInputFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiModel, setAiModel] = useState<"gemini" | "gpt" | "pro">("gemini");
  const [autoReply, setAutoReply] = useState(localStorage.getItem("envle-ai-auto-reply") === "true");
  const [aiBusy, setAiBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight;
  }, [messages]);

  // Load messages from Supabase
  useEffect(() => {
    if (!conv.id || !user) { setMessages([]); return; }
    const fetchMessages = async () => {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", conv.id).order("created_at", { ascending: true }).limit(100);
      if (data) {
        setMessages(data.map((m) => ({
          id: m.id, text: m.content || "", sent: m.sender_id === user.id,
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "",
          fileUrl: m.file_url || undefined, fileName: m.file_name || undefined,
          fileSize: m.file_size ? Number(m.file_size) : undefined, messageType: m.message_type || "text",
          senderLang: m.sender_id !== user.id ? ((m as any).sender_lang || "auto") : undefined,
        })));
        await supabase.from("messages").update({ is_read: true }).eq("conversation_id", conv.id).neq("sender_id", user.id).eq("is_read", false);
      }
    };
    fetchMessages();
    const channel = supabase
      .channel(`messages-${conv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conv.id}` }, (payload) => {
        const m = payload.new as any;
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === m.id)) return prev;
          const nextMessage = {
            id: m.id, text: m.content || "", sent: m.sender_id === user.id,
            time: m.created_at ? new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "",
            fileUrl: m.file_url || undefined, fileName: m.file_name || undefined,
            fileSize: m.file_size ? Number(m.file_size) : undefined, messageType: m.message_type || "text",
            senderLang: m.sender_id !== user.id ? (m.sender_lang || "auto") : undefined,
          };
          if (m.sender_id !== user.id && autoReply && nextMessage.text) void generateAiReply(nextMessage.text, true);
          return [...prev, nextMessage];
        });
        if (m.sender_id !== user.id) supabase.from("messages").update({ is_read: true }).eq("id", m.id).then(() => {});
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conv.id, user]);

  const uploadFileToStorage = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bucket = "chat-files";
    const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error(`❌ Erreur upload: ${error.message}`); return null; }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: urlData.publicUrl, name: file.name, size: file.size };
  }, [user]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;
    if (!user || !conv.id) { toast.error("Connectez-vous pour envoyer des messages"); return; }
    setSending(true);
    setInput("");
    const filesToSend = [...pendingFiles];
    setPendingFiles([]);
    try {
      if (filesToSend.length > 0) {
        for (const fileData of filesToSend) {
          const uploaded = await uploadFileToStorage(fileData.file);
          if (uploaded) {
            await supabase.from("messages").insert({
              conversation_id: conv.id, sender_id: user.id, content: fileData.name,
              message_type: fileData.type.startsWith("image/") ? "image" : "file",
              file_url: uploaded.url, file_name: uploaded.name, file_size: uploaded.size,
            });
          }
        }
      }
      if (text) {
        await supabase.from("messages").insert({ conversation_id: conv.id, sender_id: user.id, content: text, message_type: "text" });
      }
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conv.id);
    } catch { toast.error("❌ Erreur d'envoi"); } finally { setSending(false); }
  }, [input, pendingFiles, user, conv.id, uploadFileToStorage]);

  const generateAiReply = useCallback(async (sourceText?: string, automatic = false) => {
    const text = sourceText || input.trim();
    if (!text) return;
    setAiBusy(true);
    const { data, error } = await supabase.functions.invoke("chat-ai", {
      body: {
        model: aiModel,
        mode: automatic ? "auto_reply" : "assist",
        language: getAppLanguage(),
        messages: [
          { role: "user", content: automatic ? `Réponds naturellement à ce message: ${text}` : `Améliore ou propose une réponse pour: ${text}` },
        ],
      },
    });
    setAiBusy(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "IA indisponible");
      return;
    }
    setInput(data.text || "");
    if (automatic) toast.success("🤖 Réponse automatique préparée");
  }, [aiModel, input]);

  const toggleAutoReply = () => {
    const next = !autoReply;
    setAutoReply(next);
    localStorage.setItem("envle-ai-auto-reply", String(next));
    toast.success(next ? "🤖 Réponse automatique activée" : "🤖 Réponse automatique désactivée");
  };

  // Enter = newline, Shift+Enter or Ctrl+Enter = send
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
    // Enter without shift = default newline behavior (no preventDefault)
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Voice recording - toggle mode
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(recordingChunksRef.current, { type: "audio/webm" });
        if (blob.size > 0 && user && conv.id) {
          const file = new File([blob], `vocal-${Date.now()}.webm`, { type: "audio/webm" });
          const uploaded = await uploadFileToStorage(file);
          if (uploaded) {
            await supabase.from("messages").insert({
              conversation_id: conv.id, sender_id: user.id, content: "🎤 Message vocal",
              message_type: "audio", file_url: uploaded.url, file_name: uploaded.name, file_size: uploaded.size,
            });
            await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conv.id);
            toast.success("🎤 Vocal envoyé!");
          }
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { toast.error("🎤 Micro non disponible"); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => { mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop()); };
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    toast("❌ Vocal annulé");
  };

  const handleFilesSelected = (files: FileAttachmentData[]) => setPendingFiles((prev) => [...prev, ...files]);
  const removePendingFile = (id: string) => setPendingFiles((prev) => prev.filter((f) => f.id !== id));

  const fileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎥";
    if (type.startsWith("audio/")) return "🎵";
    if (type.includes("pdf")) return "📄";
    return "📁";
  };

  const toggleTranslation = async (msg: Message) => {
    const next = !showTranslation[msg.id];
    setShowTranslation((prev) => ({ ...prev, [msg.id]: next }));
    if (!next || translatedTexts[msg.id]) return;
    const { data, error } = await supabase.functions.invoke("translate-message", {
      body: { text: msg.text, sourceLang: msg.senderLang || "auto", targetLang: getAppLanguage() },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Traduction indisponible");
      return;
    }
    setTranslatedTexts((prev) => ({ ...prev, [msg.id]: data.translatedText || msg.text }));
  };
  const getDisplayText = (msg: Message) => {
    if (!msg.senderLang || msg.sent) return msg.text;
    if (showTranslation[msg.id]) return translatedTexts[msg.id] || "Traduction...";
    return msg.text;
  };

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojis(false);
    textareaRef.current?.focus();
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-background relative">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsla(142,47%,33%,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsla(37,90%,58%,0.03) 0%, transparent 50%)" }} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-3 md:px-6 py-3 bg-envle-card border-b border-envle-border flex items-center gap-2 md:gap-3 z-10">
        {onBack && <motion.button whileTap={{ scale: 0.85 }} className="w-9 h-9 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all" onClick={onBack}>←</motion.button>}
        <motion.div whileHover={{ scale: 1.05 }} className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base" style={{ background: conv.avatarStyle }}>{conv.avatar}</motion.div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{conv.name}</div>
          <div className="text-[11px] text-envle-text-muted">Shift+Entrée pour envoyer</div>
        </div>
        <div className="flex gap-1">
          {["🤖", "📞", "📹", "🔍"].map((icon, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-foreground/[0.06] border-none text-envle-text-muted text-base cursor-pointer transition-all flex items-center justify-center hover:bg-primary/20 hover:text-envle-vert-light"
              onClick={() => { if (icon === "🤖") setAiOpen((v) => !v); else if (icon === "📞") onOpenCall("audio"); else if (icon === "📹") onOpenCall("video"); }}
            >
              {icon}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {aiOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="z-10 bg-envle-card border-b border-envle-border px-3 md:px-6 py-2 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <select value={aiModel} onChange={(e) => setAiModel(e.target.value as "gemini" | "gpt" | "pro")} className="bg-foreground/[0.06] border border-envle-border rounded-xl px-3 py-2 text-xs outline-none">
                <option value="gemini">Gemini Flash</option>
                <option value="gpt">GPT</option>
                <option value="pro">Pro</option>
              </select>
              <motion.button whileTap={{ scale: 0.95 }} disabled={aiBusy} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold border-none cursor-pointer disabled:opacity-50" onClick={() => generateAiReply()}>
                {aiBusy ? "IA..." : "✨ Proposer"}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${autoReply ? "bg-primary/20 border-primary/40 text-envle-vert-light" : "bg-transparent border-envle-border text-envle-text-muted"}`} onClick={toggleAutoReply}>
                Réponse auto {autoReply ? "ON" : "OFF"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={areaRef} className="flex-1 overflow-y-auto px-3 md:px-6 pt-4 pb-2 flex flex-col gap-1 scrollbar-thin z-10">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} variants={msgVariants} initial="initial" animate="animate" exit="exit" layout className={`flex mb-0.5 ${msg.sent ? "justify-end" : "justify-start"}`}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={`max-w-[85%] md:max-w-[65%] px-3 py-2 rounded-[18px] text-sm leading-relaxed ${msg.sent ? "rounded-br-[6px] text-foreground" : "bg-envle-card border border-envle-border rounded-bl-[6px]"}`}
                style={msg.sent ? { background: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))" } : undefined}
              >
                {msg.fileUrl && (
                  <div className="mb-1.5">
                    {msg.messageType === "image" ? (
                      <motion.img whileHover={{ scale: 1.03 }} src={msg.fileUrl} alt={msg.fileName || "image"} className="max-w-[220px] max-h-[180px] rounded-xl object-cover cursor-pointer" onClick={() => window.open(msg.fileUrl, "_blank")} />
                    ) : msg.messageType === "audio" ? (
                      <audio controls src={msg.fileUrl} className="w-full max-w-[240px] h-8" />
                    ) : (
                      <motion.a whileHover={{ scale: 1.02 }} href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-foreground/10 rounded-xl px-3 py-2 no-underline text-current">
                        <span className="text-2xl">📁</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{msg.fileName || "Fichier"}</div>
                          {msg.fileSize && <div className="text-[10px] opacity-60">{formatSize(msg.fileSize)}</div>}
                        </div>
                        <span className="text-sm opacity-60">📥</span>
                      </motion.a>
                    )}
                  </div>
                )}
                {msg.text && msg.messageType !== "audio" && <span style={{ whiteSpace: "pre-wrap" }}>{getDisplayText(msg)}</span>}
                {msg.senderLang && !msg.sent && msg.text && (
                  <motion.button whileTap={{ scale: 0.9 }} className="block text-[10px] mt-1 opacity-50 hover:opacity-80 border-none bg-transparent cursor-pointer font-body text-current" onClick={() => toggleTranslation(msg)}>
                    {showTranslation[msg.id] ? "🌐 Original" : "🌐 Traduire"}
                  </motion.button>
                )}
                <div className="text-[10px] opacity-60 mt-1 flex items-center justify-end gap-1">
                  {msg.time}
                  {msg.sent && <span className="text-xs text-envle-or">✓✓</span>}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pending files */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 md:px-5 py-2 bg-envle-card border-t border-envle-border z-10 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {pendingFiles.map((file) => (
              <motion.div key={file.id} initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="relative shrink-0 flex items-center gap-2 bg-foreground/[0.06] border border-envle-border rounded-xl px-3 py-2">
                {file.preview ? <img src={file.preview} alt={file.name} className="w-8 h-8 rounded-lg object-cover" /> : <span className="text-xl">{fileIcon(file.type)}</span>}
                <div className="max-w-[100px]">
                  <div className="text-xs font-medium truncate">{file.name}</div>
                  <div className="text-[10px] text-envle-text-muted">{formatSize(file.size)}</div>
                </div>
                <motion.button whileTap={{ scale: 0.8 }} className="w-5 h-5 rounded-full bg-envle-rouge/80 border-none text-[10px] text-foreground cursor-pointer flex items-center justify-center" onClick={() => removePendingFile(file.id)}>✕</motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="px-3 md:px-5 py-2 bg-envle-card border-t border-envle-border z-10">
            <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto scrollbar-thin">
              {EMOJI_LIST.map((e) => (
                <motion.button key={e} whileTap={{ scale: 1.4 }} className="w-8 h-8 text-lg border-none bg-transparent cursor-pointer hover:bg-foreground/[0.06] rounded-lg flex items-center justify-center" onClick={() => insertEmoji(e)}>{e}</motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-2 md:px-5 py-2 pb-3 bg-envle-card border-t border-envle-border flex items-end gap-1.5 md:gap-2 z-10">
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 bg-envle-rouge/10 border border-envle-rouge/30 rounded-[22px] px-4 py-3">
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-envle-rouge text-sm">🔴</motion.span>
            <span className="text-sm font-semibold text-envle-rouge flex-1">{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}</span>
            <motion.button whileTap={{ scale: 0.85 }} className="text-xs text-envle-text-muted border-none bg-transparent cursor-pointer font-body" onClick={cancelRecording}>❌ Annuler</motion.button>
            <motion.button whileTap={{ scale: 0.85 }} className="text-xs text-primary font-semibold border-none bg-transparent cursor-pointer font-body" onClick={stopRecording}>✅ Envoyer</motion.button>
          </div>
        ) : (
          <motion.div
            animate={{ borderColor: inputFocused ? "hsla(142, 47%, 33%, 0.5)" : "hsla(218, 20%, 17%, 1)" }}
            className="flex-1 bg-foreground/[0.06] border border-envle-border rounded-[22px] px-3 py-2 flex items-end gap-1.5 transition-shadow"
            style={inputFocused ? { boxShadow: "0 0 0 3px hsla(142,47%,33%,0.15)" } : {}}
          >
            <motion.span whileTap={{ scale: 0.8 }} className="text-lg cursor-pointer opacity-60 hover:opacity-100 text-envle-text-muted hover:text-envle-vert-light transition-opacity pb-0.5" onClick={() => setShowEmojis(!showEmojis)}>😀</motion.span>
            <textarea
              ref={textareaRef}
              className="flex-1 bg-transparent border-none outline-none text-foreground font-body text-sm resize-none max-h-[120px] placeholder:text-envle-text-muted"
              placeholder="Écrire un message..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            <FileAttachment onFilesSelected={handleFilesSelected} isOpen={attachOpen} onToggle={() => setAttachOpen(!attachOpen)} />
          </motion.div>
        )}

        {!isRecording && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-foreground/[0.06] border-none text-envle-text-muted text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 hover:text-envle-vert-light transition-all shrink-0"
            onClick={startRecording}
            title="Enregistrer un vocal"
          >
            🎙️
          </motion.button>
        )}

        {!isRecording && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.12, rotate: 15 }}
            disabled={sending}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full border-none text-foreground text-lg cursor-pointer flex items-center justify-center shadow-[0_4px_16px_hsla(142,47%,33%,0.4)] disabled:opacity-50 shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
            onClick={sendMessage}
          >
            {sending ? "⏳" : "➤"}
          </motion.button>
        )}
      </motion.div>

      {viewingFile && <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
    </main>
  );
};

export default ChatArea;
