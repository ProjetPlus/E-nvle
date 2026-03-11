import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  type: "business" | "job" | "product";
}

const CreateBusinessModal = ({ open, onClose, type }: Props) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const configs = {
    business: {
      title: "Créer une entreprise",
      icon: "🏢",
      fields: [
        { key: "name", label: "Nom de l'entreprise", placeholder: "Ex: TechHub Dakar" },
        { key: "type", label: "Type d'activité", placeholder: "Ex: Technologie, Mode, Restauration" },
        { key: "location", label: "Localisation", placeholder: "Ex: Abidjan, Côte d'Ivoire" },
        { key: "description", label: "Description", placeholder: "Décrivez votre entreprise...", multiline: true },
        { key: "phone", label: "Téléphone", placeholder: "+225 XX XX XX XX" },
        { key: "email", label: "Email professionnel", placeholder: "contact@entreprise.com" },
      ],
    },
    job: {
      title: "Publier une offre d'emploi",
      icon: "💼",
      fields: [
        { key: "title", label: "Titre du poste", placeholder: "Ex: Développeur React Senior" },
        { key: "company", label: "Entreprise", placeholder: "Nom de votre entreprise" },
        { key: "location", label: "Localisation", placeholder: "Ex: Dakar, Remote" },
        { key: "salary", label: "Salaire", placeholder: "Ex: 500K-800K FCFA/mois" },
        { key: "type", label: "Type de contrat", placeholder: "CDI, CDD, Freelance, Stage" },
        { key: "description", label: "Description du poste", placeholder: "Responsabilités, compétences requises...", multiline: true },
      ],
    },
    product: {
      title: "Ajouter un produit",
      icon: "🛍️",
      fields: [
        { key: "name", label: "Nom du produit", placeholder: "Ex: Tissu Wax Premium" },
        { key: "price", label: "Prix (FCFA)", placeholder: "Ex: 15000" },
        { key: "category", label: "Catégorie", placeholder: "Mode, Beauté, Tech, Alimentation" },
        { key: "description", label: "Description", placeholder: "Décrivez votre produit...", multiline: true },
        { key: "stock", label: "Stock disponible", placeholder: "Ex: 50" },
      ],
    },
  };

  const config = configs[type];

  const handleSubmit = () => {
    const required = config.fields.slice(0, 2);
    const missing = required.filter((f) => !formData[f.key]?.trim());
    if (missing.length > 0) {
      toast.error("Remplissez les champs obligatoires");
      return;
    }
    toast.success(`✅ ${config.title} — publié avec succès!`);
    setFormData({});
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-envle-card border border-envle-border rounded-3xl w-full max-w-[460px] max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-envle-border flex items-center gap-3">
              <span className="text-2xl">{config.icon}</span>
              <h3 className="font-display text-xl font-bold flex-1">{config.title}</h3>
              <button className="w-8 h-8 rounded-lg bg-foreground/[0.06] border-none text-sm cursor-pointer flex items-center justify-center" onClick={onClose}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin">
              {config.fields.map((field: any) => (
                <div key={field.key}>
                  <label className="text-xs text-envle-text-muted font-semibold block mb-1.5">{field.label}</label>
                  {field.multiline ? (
                    <textarea className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-4 py-3 text-foreground font-body text-sm outline-none focus:border-primary resize-none h-24 placeholder:text-envle-text-muted" placeholder={field.placeholder} value={formData[field.key] || ""} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} />
                  ) : (
                    <input className="w-full bg-foreground/[0.06] border border-envle-border rounded-xl px-4 py-3 text-foreground font-body text-sm outline-none focus:border-primary placeholder:text-envle-text-muted" placeholder={field.placeholder} value={formData[field.key] || ""} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} />
                  )}
                </div>
              ))}
              <button className="text-sm text-envle-text-muted border border-dashed border-envle-border rounded-xl py-3 cursor-pointer font-body bg-transparent hover:border-primary/40 transition-all" onClick={() => toast("📷 Ajouter des photos")}>📷 Ajouter des photos</button>
            </div>
            <div className="p-6 border-t border-envle-border flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} className="flex-1 py-3 rounded-xl border-none text-sm font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={handleSubmit}>
                Publier ✨
              </motion.button>
              <button className="px-6 py-3 rounded-xl border border-envle-border bg-transparent text-sm text-envle-text-muted cursor-pointer font-body" onClick={onClose}>Annuler</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateBusinessModal;
