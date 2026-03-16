import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  icon: string;
  bgStyle: string;
  category: string;
  posted: string;
  isSaved: boolean;
}

const categories = ["Tout", "Tech", "Design", "Marketing", "Management"];

interface Props {
  onBack: () => void;
  onCreateJob?: () => void;
  onCreateBusiness?: () => void;
}

const JobsModule = ({ onBack, onCreateJob, onCreateBusiness }: Props) => {
  const [activeTab, setActiveTab] = useState<"jobs" | "pages">("jobs");
  const [activeCat, setActiveCat] = useState("Tout");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data } = await supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) {
      setJobs(data.map(j => ({
        id: j.id, title: j.title, company: j.company || "", location: j.location || "",
        salary: j.salary_range || "", type: j.job_type || "CDI",
        icon: j.title.includes("Dev") ? "💻" : j.title.includes("Design") ? "🎨" : "💼",
        bgStyle: "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-bleu)))",
        category: "Tout",
        posted: j.created_at ? getRelativeTime(j.created_at) : "",
        isSaved: false,
      })));
    }
    setLoading(false);
  };

  const getRelativeTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  const toggleSave = (id: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, isSaved: !j.isSaved } : j)));
    toast("📌 Offre sauvegardée");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 md:px-6 py-3 md:py-4 bg-envle-card border-b border-envle-border">
        <div className="flex items-center gap-2 mb-3">
          <motion.button whileTap={{ scale: 0.85 }} className="w-9 h-9 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</motion.button>
          <h2 className="font-display text-xl md:text-2xl font-bold flex-1">Emplois & Pages Pro</h2>
          <motion.button whileTap={{ scale: 0.9 }} className="px-3 py-1.5 rounded-xl border-none text-xs font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={activeTab === "jobs" ? onCreateJob : onCreateBusiness}>
            + {activeTab === "jobs" ? "Publier" : "Créer"}
          </motion.button>
        </div>
        <div className="flex gap-1 bg-foreground/[0.04] rounded-xl p-1">
          {(["jobs", "pages"] as const).map((t) => (
            <motion.button key={t} whileTap={{ scale: 0.95 }} className={`flex-1 py-2 rounded-[10px] border-none font-body text-xs cursor-pointer font-medium transition-all ${activeTab === t ? "bg-primary text-primary-foreground" : "bg-transparent text-envle-text-muted"}`} onClick={() => setActiveTab(t)}>
              {t === "jobs" ? "💼 Emplois" : "🏢 Pages Pro"}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {activeTab === "jobs" ? (
        <>
          <div className="flex px-4 md:px-6 gap-1.5 py-2 overflow-x-auto border-b border-envle-border" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <motion.button key={cat} whileTap={{ scale: 0.92 }} className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${activeCat === cat ? "bg-primary/20 text-envle-vert-light" : "bg-foreground/[0.04] text-envle-text-muted"}`} onClick={() => setActiveCat(cat)}>{cat}</motion.button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 md:p-6 scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center h-40"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-3xl">⏳</motion.span></div>
            ) : jobs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-40 text-center">
                <span className="text-4xl mb-3">💼</span>
                <p className="text-envle-text-muted text-sm">Aucune offre disponible</p>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="bg-envle-card border border-envle-border rounded-2xl p-3 md:p-4 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xl shrink-0" style={{ background: job.bgStyle }}>{job.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold">{job.title}</div>
                        <div className="text-xs text-envle-text-muted">{job.company}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] bg-foreground/[0.06] px-2 py-0.5 rounded-lg">📍 {job.location}</span>
                          <span className="text-[10px] bg-foreground/[0.06] px-2 py-0.5 rounded-lg">{job.type}</span>
                          {job.salary && <span className="text-[10px] text-envle-or font-semibold">{job.salary}</span>}
                        </div>
                      </div>
                      <motion.button whileTap={{ scale: 1.3 }} className="border-none bg-transparent text-base cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleSave(job.id); }}>{job.isSaved ? "📌" : "📍"}</motion.button>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-envle-border/50">
                      <span className="text-[11px] text-envle-text-muted">{job.posted}</span>
                      <motion.button whileTap={{ scale: 0.88 }} className="px-3 py-1 rounded-lg border-none text-[11px] font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={(e) => { e.stopPropagation(); toast("📤 Candidature envoyée!"); }}>Postuler</motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 md:p-6 scrollbar-thin">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-40 text-center">
            <span className="text-4xl mb-3">🏢</span>
            <p className="text-envle-text-muted text-sm">Aucune page pro</p>
            <p className="text-envle-text-muted text-xs mt-1">Créez votre page professionnelle</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JobsModule;
