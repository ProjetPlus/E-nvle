import { motion, AnimatePresence } from "framer-motion";
import type { FileAttachmentData } from "./FileAttachment";
import { formatSize } from "./FileAttachment";
import { toast } from "sonner";

interface Props {
  file: FileAttachmentData | null;
  onClose: () => void;
}

const FileViewer = ({ file, onClose }: Props) => {
  if (!file) return null;

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");
  const isPDF = file.type.includes("pdf");

  const fileUrl = URL.createObjectURL(file.file);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`📥 ${file.name} téléchargé`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex flex-col"
        onClick={onClose}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-black/40" onClick={(e) => e.stopPropagation()}>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{file.name}</div>
            <div className="text-xs text-white/60">{formatSize(file.size)}{file.enhanced ? " · HD ✨" : ""}</div>
          </div>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-xl bg-white/10 border-none text-white text-lg cursor-pointer flex items-center justify-center" onClick={handleDownload}>📥</motion.button>
            <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-xl bg-white/10 border-none text-white text-lg cursor-pointer flex items-center justify-center" onClick={() => { toast("📤 Transférer le fichier"); }}>📤</motion.button>
            <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-xl bg-white/10 border-none text-white text-lg cursor-pointer flex items-center justify-center" onClick={onClose}>✕</motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
          {isImage && (
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={file.preview || fileUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          )}
          {isVideo && (
            <video src={fileUrl} controls autoPlay className="max-w-full max-h-full rounded-xl" />
          )}
          {isAudio && (
            <div className="bg-white/10 rounded-3xl p-8 flex flex-col items-center gap-4">
              <span className="text-6xl">🎵</span>
              <div className="text-white text-sm font-semibold">{file.name}</div>
              <audio src={fileUrl} controls className="w-[300px]" />
            </div>
          )}
          {isPDF && (
            <iframe src={fileUrl} className="w-full h-full max-w-4xl rounded-xl bg-white" title={file.name} />
          )}
          {!isImage && !isVideo && !isAudio && !isPDF && (
            <div className="bg-white/10 rounded-3xl p-12 flex flex-col items-center gap-4 text-center">
              <span className="text-6xl">📄</span>
              <div className="text-white text-lg font-bold">{file.name}</div>
              <div className="text-white/60 text-sm">{formatSize(file.size)}</div>
              <motion.button whileTap={{ scale: 0.9 }} className="px-6 py-3 rounded-xl border-none text-sm font-semibold cursor-pointer text-primary-foreground mt-2" style={{ background: "linear-gradient(135deg, hsl(142 47% 33%), hsl(142 47% 23%))" }} onClick={handleDownload}>
                📥 Télécharger
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FileViewer;
