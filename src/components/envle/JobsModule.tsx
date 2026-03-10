import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  applicants: number;
  isSaved: boolean;
}

const mockJobs: Job[] = [
  { id: "1", title: "Développeur React Senior", company: "TechHub Dakar", location: "Dakar, Sénégal", salary: "800K-1.2M FCFA/mois", type: "CDI", icon: "💻", bgStyle: "linear-gradient(135deg,#0ea5e9,#2563eb)", category: "Tech", posted: "Il y a 2h", applicants: 23, isSaved: false },
  { id: "2", title: "Designer UI/UX", company: "Créative Studio", location: "Abidjan, Côte d'Ivoire", salary: "500K-700K FCFA/mois", type: "CDI", icon: "🎨", bgStyle: "linear-gradient(135deg,#ec4899,#be185d)", category: "Design", posted: "Il y a 6h", applicants: 45, isSaved: true },
  { id: "3", title: "Community Manager", company: "AfroDigital", location: "Remote 🌍", salary: "300K-500K FCFA/mois", type: "Freelance", icon: "📱", bgStyle: "linear-gradient(135deg,#f59e0b,#b45309)", category: "Marketing", posted: "Hier", applicants: 67, isSaved: false },
  { id: "4", title: "Chef de Projet Digital", company: "InnovaAfrica", location: "Lagos, Nigeria", salary: "1M-1.5M FCFA/mois", type: "CDI", icon: "📊", bgStyle: "linear-gradient(135deg,#10b981,#059669)", category: "Management", posted: "Il y a 3j", applicants: 12, isSaved: false },
  { id: "5", title: "Data Analyst", company: "FinTech Mali", location: "Bamako, Mali", salary: "600K-900K FCFA/mois", type: "CDD", icon: "📈", bgStyle: "linear-gradient(135deg,#8b5cf6,#6d28d9)", category: "Tech", posted: "Il y a 1 sem.", applicants: 34, isSaved: true },
];

const proPages = [
  { id: "p1", name: "TechHub Dakar", type: "Entreprise Tech", followers: "14.2K", icon: "🏢", bgStyle: "linear-gradient(135deg,#0ea5e9,#2563eb)" },
  { id: "p2", name: "Wax & Style", type: "Boutique Mode", followers: "8.5K", icon: "👗", bgStyle: "linear-gradient(135deg,#f97316,#dc2626)" },
  { id: "p3", name: "Nature Africa", type: "Cosmétiques Bio", followers: "22.1K", icon: "🌿", bgStyle: "linear-gradient(135deg,#10b981,#059669)" },
];

const categories = ["Tout", "Tech", "Design", "Marketing", "Management"];

const JobsModule = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<"jobs" | "pages">("jobs");
  const [activeCat, setActiveCat] = useState("Tout");
  const [jobs, setJobs] = useState(mockJobs);

  const filtered = activeCat === "Tout" ? jobs : jobs.filter((j) => j.category === activeCat);

  const toggleSave = (id: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, isSaved: !j.isSaved } : j)));
    toast("📌 Offre sauvegardée");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="px-6 py-4 bg-envle-card border-b border-envle-border">
        <div className="flex items-center gap-3 mb-3">
          <button className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</button>
          <h2 className="font-display text-2xl font-bold flex-1">Emplois & Pages Pro</h2>
        </div>
        <div className="flex gap-1 bg-foreground/[0.04] rounded-xl p-1">
          {(["jobs", "pages"] as const).map((t) => (
            <button key={t} className={`flex-1 py-2 rounded-[10px] border-none font-body text-sm cursor-pointer font-medium transition-all ${activeTab === t ? "bg-primary text-primary-foreground" : "bg-transparent text-envle-text-muted"}`} onClick={() => setActiveTab(t)}>
              {t === "jobs" ? "💼 Emplois" : "🏢 Pages Pro"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "jobs" ? (
        <>
          <div className="flex px-6 gap-2 py-3 overflow-x-auto border-b border-envle-border" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <motion.button key={cat} whileTap={{ scale: 0.95 }} className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${activeCat === cat ? "bg-primary/20 text-envle-vert-light" : "bg-foreground/[0.04] text-envle-text-muted"}`} onClick={() => setActiveCat(cat)}>{cat}</motion.button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {filtered.map((job, i) => (
                  <motion.div key={job.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }} className="bg-envle-card border border-envle-border rounded-2xl p-4 hover:border-primary/30 transition-all cursor-pointer" onClick={() => toast(`📋 Détails: ${job.title}`)}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl shrink-0" style={{ background: job.bgStyle }}>{job.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold">{job.title}</div>
                        <div className="text-sm text-envle-text-muted">{job.company}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs bg-foreground/[0.06] px-2 py-1 rounded-lg">📍 {job.location}</span>
                          <span className="text-xs bg-foreground/[0.06] px-2 py-1 rounded-lg">{job.type}</span>
                          <span className="text-xs text-envle-or font-semibold">{job.salary}</span>
                        </div>
                      </div>
                      <motion.button whileTap={{ scale: 1.2 }} className="border-none bg-transparent text-lg cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleSave(job.id); }}>{job.isSaved ? "📌" : "📍"}</motion.button>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-envle-border/50">
                      <span className="text-xs text-envle-text-muted">{job.posted} · {job.applicants} candidats</span>
                      <motion.button whileTap={{ scale: 0.9 }} className="px-4 py-1.5 rounded-lg border-none text-xs font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={(e) => { e.stopPropagation(); toast("📤 Candidature envoyée!"); }}>Postuler</motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="flex flex-col gap-3">
            {proPages.map((page, i) => (
              <motion.div key={page.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-envle-card border border-envle-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all cursor-pointer" onClick={() => toast(`🏢 Page: ${page.name}`)}>
                <div className="w-14 h-14 rounded-[14px] flex items-center justify-center text-2xl" style={{ background: page.bgStyle }}>{page.icon}</div>
                <div className="flex-1">
                  <div className="text-base font-bold">{page.name}</div>
                  <div className="text-xs text-envle-text-muted">{page.type} · {page.followers} abonnés</div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} className="px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 text-envle-vert-light text-xs font-semibold cursor-pointer" onClick={(e) => { e.stopPropagation(); toast(`✅ Abonné à ${page.name}`); }}>Suivre</motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsModule;
