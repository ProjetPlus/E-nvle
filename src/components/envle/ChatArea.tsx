import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Conversation } from "./ConversationPanel";

interface Message {
  id: string;
  text: string;
  sent: boolean;
  time: string;
  isVoice?: boolean;
  isImage?: boolean;
  isTyping?: boolean;
}

const initialMessages: Message[] = [
  { id: "1", text: "Salut! Tu as vu la dernière mise à jour de E'nvlé? 🚀", sent: false, time: "09:30" },
  { id: "2", text: "Oui! Le nouveau module commerce est 🔥 J'ai déjà créé ma boutique", sent: true, time: "09:32" },
  { id: "3", text: "Regarde ce tissu wax que j'ai trouvé!", sent: false, time: "09:35", isImage: true },
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

const ChatArea = ({ conv, onOpenCall, onBack }: Props) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newMsg: Message = { id: Date.now().toString(), text, sent: true, time };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    setTimeout(() => {
      const typingId = `typing-${Date.now()}`;
      setMessages((prev) => [...prev, { id: typingId, text: "", sent: false, time: "", isTyping: true }]);

      setTimeout(() => {
        const reply = replies[Math.floor(Math.random() * replies.length)];
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== typingId),
          { id: `reply-${Date.now()}`, text: reply, sent: false, time },
        ]);
      }, 2000);
    }, 1500);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-background relative">
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, hsla(142,47%,33%,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsla(37,90%,58%,0.03) 0%, transparent 50%)",
        }}
      />

      {/* Header */}
      <div className="px-4 md:px-6 py-4 bg-envle-card border-b border-envle-border flex items-center gap-3 z-10">
        {onBack && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all"
            onClick={onBack}
          >
            ←
          </motion.button>
        )}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg"
          style={{ background: conv.avatarStyle }}
        >
          {conv.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold truncate">{conv.name}</div>
          <div className="text-xs text-green-500">🟢 En ligne</div>
        </div>
        <div className="flex gap-1.5 md:gap-2">
          {["📞", "📹", "🔍"].map((icon, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-foreground/[0.06] border-none text-envle-text-muted text-lg cursor-pointer transition-all flex items-center justify-center hover:bg-primary/20 hover:text-envle-vert-light"
              onClick={() => {
                if (icon === "📞") onOpenCall("audio");
                else if (icon === "📹") onOpenCall("video");
                else toast("Fonctionnalité en développement");
              }}
            >
              {icon}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={areaRef} className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-2 flex flex-col gap-1 scrollbar-thin z-10">
        <div className="text-center text-xs text-envle-text-muted my-4 relative">
          <span className="relative z-10 bg-background px-3">Aujourd'hui</span>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-envle-border" />
        </div>

        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`flex mb-0.5 ${msg.sent ? "justify-end" : "justify-start"}`}
          >
            {msg.isTyping ? (
              <div className="flex items-center gap-2 py-2">
                <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-envle-card border border-envle-border rounded-[18px] rounded-bl-[6px]">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span
                      key={i}
                      className="w-[7px] h-[7px] rounded-full bg-envle-text-muted"
                      style={{ animation: `typing-bounce 1.4s ease infinite ${d}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-envle-text-muted">écrit...</span>
              </div>
            ) : (
              <div
                className={`max-w-[80%] md:max-w-[65%] px-3.5 py-2.5 rounded-[18px] text-sm leading-relaxed ${
                  msg.sent
                    ? "rounded-br-[6px] text-foreground"
                    : "bg-envle-card border border-envle-border rounded-bl-[6px]"
                }`}
                style={
                  msg.sent
                    ? { background: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))" }
                    : undefined
                }
              >
                {msg.isImage && (
                  <div className="w-[200px] h-[140px] rounded-xl mb-1.5 flex items-center justify-center text-[40px]"
                    style={{ background: "linear-gradient(135deg, #1a2a1a, #2d4a2d)" }}>
                    🖼️
                  </div>
                )}
                {msg.isVoice ? (
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-full bg-foreground/15 flex items-center justify-center text-sm cursor-pointer"
                      onClick={() => toast("🎤 Lecture du message vocal")}
                    >
                      ▶️
                    </motion.div>
                    <div className="flex items-center gap-0.5 flex-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-[3px] rounded-sm bg-foreground/40"
                          style={{
                            height: `${12 + Math.random() * 20}px`,
                            animation: `wave-anim 1.2s ease infinite ${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs opacity-70">0:28</span>
                  </div>
                ) : (
                  msg.text
                )}
                <div className="text-[10px] opacity-60 mt-1 flex items-center justify-end gap-1">
                  {msg.time}
                  {msg.sent && <span className="text-xs text-envle-or">✓✓</span>}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 md:px-5 py-3 pb-4 bg-envle-card border-t border-envle-border flex items-end gap-2 md:gap-2.5 z-10">
        <div className="flex-1 bg-foreground/[0.06] border border-envle-border rounded-[22px] px-3 md:px-4 py-2.5 flex items-center gap-2 focus-within:border-primary focus-within:shadow-[0_0_0_3px_hsla(142,47%,33%,0.15)]">
          <span className="text-xl cursor-pointer opacity-60 hover:opacity-100 text-envle-text-muted hover:text-envle-vert-light transition-opacity" onClick={() => toast("😀 Emojis")}>😀</span>
          <textarea
            className="flex-1 bg-transparent border-none outline-none text-foreground font-body text-sm resize-none max-h-[100px] placeholder:text-envle-text-muted"
            placeholder="Écrire un message..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <span className="text-xl cursor-pointer opacity-60 hover:opacity-100 text-envle-text-muted hover:text-envle-vert-light transition-opacity hidden md:inline" onClick={() => toast("Fonctionnalité en développement")}>📎</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-foreground/[0.06] border-none text-envle-text-muted text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 hover:text-envle-vert-light transition-all"
          onClick={() => toast("🎤 Maintenir pour enregistrer un vocal")}
        >
          🎙️
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="w-11 h-11 md:w-12 md:h-12 rounded-full border-none text-foreground text-xl cursor-pointer flex items-center justify-center shadow-[0_4px_16px_hsla(142,47%,33%,0.4)]"
          style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }}
          onClick={sendMessage}
        >
          ➤
        </motion.button>
      </div>
    </main>
  );
};

export default ChatArea;
