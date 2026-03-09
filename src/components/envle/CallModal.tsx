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
  const handleClose = () => {
    onClose();
    toast("📵 Appel terminé · Durée: 3:42");
  };

  return (
    <div
      className={`fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className={`bg-envle-card border border-envle-border rounded-3xl p-10 w-[360px] max-w-[95vw] text-center transition-transform duration-300 ${
          open ? "translate-y-0 scale-100" : "translate-y-5 scale-[0.96]"
        }`}
      >
        <div
          className="w-[100px] h-[100px] rounded-full mx-auto mb-5 flex items-center justify-center text-[40px]"
          style={{ background: convAvatarStyle, animation: "call-pulse 1.5s ease infinite" }}
        >
          {convAvatar}
        </div>
        <div className="text-[22px] font-bold mb-1.5">{convName}</div>
        <div className="text-envle-text-muted text-sm mb-8">
          {type === "video" ? "Appel vidéo en cours... 🎥" : "Appel audio en cours... 🎙️"}
        </div>
        <div className="flex justify-center gap-3 mb-6">
          {["🎙️ Micro", "📷 Caméra", "🖥️ Écran"].map((label) => (
            <button
              key={label}
              className="bg-foreground/[0.08] border-none text-foreground px-4 py-2 rounded-[10px] cursor-pointer font-body text-xs"
              onClick={() => toast(`${label.split(" ")[0]} basculé`)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-6">
          <button
            className="w-16 h-16 rounded-full border-none bg-primary text-[26px] cursor-pointer transition-all hover:scale-110"
            onClick={() => toast("🎤 Réunion — jusqu'à 50 participants")}
          >
            👥
          </button>
          <button
            className="w-16 h-16 rounded-full border-none bg-envle-rouge text-[26px] cursor-pointer transition-all hover:scale-110"
            onClick={handleClose}
          >
            📵
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
