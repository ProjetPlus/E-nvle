import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Conversation } from "./ConversationPanel";
import FileAttachment, { type FileAttachmentData, formatSize } from "./FileAttachment";
import FileViewer from "./FileViewer";
import { getTranslatedText } from "@/lib/translator";

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
  senderLang?: string;
}

const initialMessages: Message[] = [
  { id: "1", text: "Salut! Tu as vu la dernière mise à jour de E'nvlé? 🚀", sent: false, time: "09:30", senderLang: "fr" },
  { id: "2", text: "Oui! Le nouveau module commerce est 🔥 J'ai déjà créé ma boutique", sent: true, time: "09:32" },
  { id: "3", text: "Regarde ce tissu wax que j'ai trouvé!", sent: false, time: "09:35", isImage: true, senderLang: "fr" },
  { id: "4", text: "Magnifique 😍 tu l'as commandé via la boutique?", sent: true, time: "09:36" },
  { id: "5", text: "", sent: false, time: "09:40", isVoice: true },
  { id: "6", text: "Ok je regarde ça maintenant 🙏 Je t'envoie le reçu IA généré automatiquement dès que c'est fait!", sent: true, time: "09:42" },
];

const replies = [
  "Merci! Je regarde ça 🙏",
  "Super 👍 Tu m'envoies le lien?",
  "Parfait, je te confirme demain!",
  "Ok 😊 E'nvlé c'est vraiment pratique!",
  "Reçu ✅ Je traite ta demande",
];

interface Props {
  conv: Conversation;
  onOpenCall: (type: string) => void;
  onBack?: () => void;
}

const msgVariants = {
  initial: { opacity: 0, y: 12, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

const ChatArea = ({ conv, onOpenCall, onBack }: Props) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileAttachmentData[]>([]);
  const [viewingFile, setViewingFile] = useState<FileAttachmentData | null>(null);
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  const [inputFocused, setInputFocused] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newMsg: Message = { id: Date.now().toString(), text, sent: true, time, files: pendingFiles.length > 0 ? [...pendingFiles] : undefined };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setPendingFiles([]);

    setTimeout(() => {
      const typingId = `typing-${Date.now()}`;
      setMessages((prev) => [...prev, { id: typingId, text: "", sent: false, time: "", isTyping: true }]);
      setTimeout(() => {
        const reply = replies[Math.floor(Math.random() * replies.length)];
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== typingId),
          { id: `reply-${Date.now()}`, text: reply, sent: false, time, senderLang: "fr" },
        ]);
      }, 2000);
    }, 1500);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleFilesSelected = (files: FileAttachmentData[]) => setPendingFiles((prev) => [...prev, ...files]);
  const removePendingFile = (id: string) => setPendingFiles((prev) => prev.filter((f) => f.id !== id));

  const downloadFile = (file: FileAttachmentData) => {
    const url = URL.createObjectURL(file.file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`📥 ${file.name} téléchargé`);
  };

  const fileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎥";
    if (type.startsWith("audio/")) return "🎵";
    if (type.includes("pdf")) return "📄";
    if (type.includes("zip") || type.includes("rar")) return "📦";
    return "📁";
  };

  const toggleTranslation = (msgId: string) => {
    setShowTranslation((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const getDisplayText = (msg: Message) => {
    if (!msg.senderLang || msg.sent) return msg.text;
    if (showTranslation[msg.id]) return getTranslatedText(msg.text, msg.senderLang);
    return msg.text;
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-background relative">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsla(142,47%,33%,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsla(37,90%,58%,0.03) 0%, transparent 50%)" }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 md:px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3 z-10"
      >
        {onBack && <motion.button whileTap={{ scale: 0.85 }} whileHover={{ x: -2 }} className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all" onClick={onBack}>←</motion.button>}
        <motion.div whileHover={{ scale: 1.05 }} className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: conv.avatarStyle }}>{conv.avatar}</motion.div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold truncate">{conv.name}</div>
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs text-green-500"
          >
            🟢 En ligne
          </motion.div>
        </div>
        <div className="flex gap-1.5 md:gap-2">
          {["📞", "📹", "🔍"].map((icon, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1, y: -2 }}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-foreground/[0.06] border-none text-envle-text-muted text-lg cursor-pointer transition-all flex items-center justify-center hover:bg-primary/20 hover:text-envle-vert-light"
              onClick={() => { if (icon === "📞") onOpenCall("audio"); else if (icon === "📹") onOpenCall("video"); else toast("🔍 Rechercher dans la conversation"); }}
            >
              {icon}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Messages */}
      <div ref={areaRef} className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-2 flex flex-col gap-1 scrollbar-thin z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-xs text-envle-text-muted my-4 relative"
        >
          <span className="relative z-10 bg-background px-3">Aujourd'hui</span>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-envle-border" />
        </motion.div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              variants={msgVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              className={`flex mb-0.5 ${msg.sent ? "justify-end" : "justify-start"}`}
            >
              {msg.isTyping ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 py-2"
                >
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-envle-card border border-envle-border rounded-[18px] rounded-bl-[6px]">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <motion.span
                        key={i}
                        className="w-[7px] h-[7px] rounded-full bg-envle-text-muted"
                        animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: d, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-envle-text-muted">écrit...</span>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className={`max-w-[80%] md:max-w-[65%] px-3.5 py-2.5 rounded-[18px] text-sm leading-relaxed ${msg.sent ? "rounded-br-[6px] text-foreground" : "bg-envle-card border border-envle-border rounded-bl-[6px]"}`}
                  style={msg.sent ? { background: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))" } : undefined}
                >
                  {msg.isImage && (
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-[200px] h-[140px] rounded-xl mb-1.5 flex items-center justify-center text-[40px] cursor-pointer"
                      style={{ background: "linear-gradient(135deg, #1a2a1a, #2d4a2d)" }}
                      onClick={() => toast("🖼️ Ouvrir la photo")}
                    >
                      🖼️
                    </motion.div>
                  )}
                  {msg.isVoice ? (
                    <div className="flex items-center gap-2.5 px-3 py-2">
                      <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} className="w-8 h-8 rounded-full bg-foreground/15 flex items-center justify-center text-sm cursor-pointer" onClick={() => toast("🎤 Lecture du message vocal")}>▶️</motion.div>
                      <div className="flex items-center gap-0.5 flex-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-[3px] rounded-sm bg-foreground/40"
                            style={{ height: `${12 + Math.random() * 20}px` }}
                            animate={{ scaleY: [1, 1.5 + Math.random(), 1] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                          />
                        ))}
                      </div>
                      <span className="text-xs opacity-70">0:28</span>
                    </div>
                  ) : (
                    <>
                      {msg.text && <span>{getDisplayText(msg)}</span>}
                      {msg.senderLang && !msg.sent && msg.text && (
                        <motion.button whileTap={{ scale: 0.9 }} className="block text-[10px] mt-1 opacity-50 hover:opacity-80 border-none bg-transparent cursor-pointer font-body text-current" onClick={() => toggleTranslation(msg.id)}>
                          {showTranslation[msg.id] ? "🌐 Voir l'original" : "🌐 Traduire"}
                        </motion.button>
                      )}
                      {msg.files && msg.files.length > 0 && (
                        <div className="mt-1.5 flex flex-col gap-1.5">
                          {msg.files.map((file) => (
                            <motion.div key={file.id} whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 bg-foreground/10 rounded-xl px-3 py-2 cursor-pointer" onClick={() => setViewingFile(file)}>
                              {file.preview ? <img src={file.preview} alt={file.name} className="w-10 h-10 rounded-lg object-cover" /> : <span className="text-2xl">{fileIcon(file.type)}</span>}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate">{file.name}</div>
                                <div className="text-[10px] opacity-60 flex items-center gap-1">{formatSize(file.size)}{file.compressed && <span>· Compressé</span>}{file.enhanced && <span>· HD ✨</span>}</div>
                              </div>
                              <motion.span whileTap={{ scale: 1.3 }} className="text-sm opacity-60" onClick={(e) => { e.stopPropagation(); downloadFile(file); }}>📥</motion.span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <div className="text-[10px] opacity-60 mt-1 flex items-center justify-end gap-1">
                    {msg.time}
                    {msg.sent && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs text-envle-or">✓✓</motion.span>}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pending files */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 md:px-5 py-2 bg-envle-card border-t border-envle-border z-10 flex gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {pendingFiles.map((file) => (
              <motion.div key={file.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="relative shrink-0 flex items-center gap-2 bg-foreground/[0.06] border border-envle-border rounded-xl px-3 py-2">
                {file.preview ? <img src={file.preview} alt={file.name} className="w-8 h-8 rounded-lg object-cover" /> : <span className="text-xl">{fileIcon(file.type)}</span>}
                <div className="max-w-[120px]">
                  <div className="text-xs font-medium truncate">{file.name}</div>
                  <div className="text-[10px] text-envle-text-muted">{formatSize(file.size)}</div>
                </div>
                <motion.button whileTap={{ scale: 0.8 }} className="w-5 h-5 rounded-full bg-envle-rouge/80 border-none text-[10px] text-foreground cursor-pointer flex items-center justify-center" onClick={() => removePendingFile(file.id)}>✕</motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-3 md:px-5 py-3 pb-4 bg-envle-card border-t border-envle-border flex items-end gap-2 md:gap-2.5 z-10"
      >
        <motion.div
          animate={{ borderColor: inputFocused ? "hsla(142, 47%, 33%, 0.5)" : "hsla(218, 20%, 17%, 1)" }}
          className="flex-1 bg-foreground/[0.06] border border-envle-border rounded-[22px] px-3 md:px-4 py-2.5 flex items-center gap-2 transition-shadow"
          style={inputFocused ? { boxShadow: "0 0 0 3px hsla(142,47%,33%,0.15)" } : {}}
        >
          <motion.span whileHover={{ scale: 1.2, rotate: 10 }} whileTap={{ scale: 0.8 }} className="text-xl cursor-pointer opacity-60 hover:opacity-100 text-envle-text-muted hover:text-envle-vert-light transition-opacity" onClick={() => toast("😀 Emojis")}>😀</motion.span>
          <textarea className="flex-1 bg-transparent border-none outline-none text-foreground font-body text-sm resize-none max-h-[100px] placeholder:text-envle-text-muted" placeholder="Écrire un message..." rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
          <FileAttachment onFilesSelected={handleFilesSelected} isOpen={attachOpen} onToggle={() => setAttachOpen(!attachOpen)} />
        </motion.div>
        <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-foreground/[0.06] border-none text-envle-text-muted text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 hover:text-envle-vert-light transition-all" onClick={() => toast("🎤 Maintenir pour enregistrer un vocal")}>🎙️</motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.12, rotate: 15 }}
          className="w-11 h-11 md:w-12 md:h-12 rounded-full border-none text-foreground text-xl cursor-pointer flex items-center justify-center shadow-[0_4px_16px_hsla(142,47%,33%,0.4)]"
          style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
          onClick={sendMessage}
        >
          ➤
        </motion.button>
      </motion.div>

      {/* File viewer */}
      {viewingFile && <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
    </main>
  );
};

export default ChatArea;
