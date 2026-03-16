import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  seller: string;
  icon: string;
  bgStyle: string;
  category: string;
  imageUrl?: string;
  isFavorite: boolean;
}

const categories = ["Tout", "Mode", "Beauté", "Artisanat", "Tech", "Alimentation"];

interface Props {
  onBack: () => void;
  onCreateProduct?: () => void;
}

const BoutiqueModule = ({ onBack, onCreateProduct }: Props) => {
  const [activeCat, setActiveCat] = useState("Tout");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*, profiles:seller_id(full_name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) {
      setProducts(data.map((p: any) => ({
        id: p.id, name: p.name, price: p.price, currency: p.currency || "XOF",
        seller: p.profiles?.full_name || "Vendeur",
        icon: getCategoryIcon(p.category),
        bgStyle: getCategoryGradient(p.category),
        category: p.category || "Autre",
        imageUrl: p.images?.[0],
        isFavorite: false,
      })));
    }
    setLoading(false);
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = { Mode: "👗", Beauté: "🧴", Artisanat: "🧺", Tech: "📱", Alimentation: "☕" };
    return icons[cat] || "🛍️";
  };

  const getCategoryGradient = (cat: string) => {
    const grads: Record<string, string> = {
      Mode: "linear-gradient(135deg, #f59e0b, #dc2626)", Beauté: "linear-gradient(135deg, #10b981, #059669)",
      Artisanat: "linear-gradient(135deg, #f97316, #b45309)", Tech: "linear-gradient(135deg, #0ea5e9, #1d4ed8)",
      Alimentation: "linear-gradient(135deg, #78350f, #451a03)",
    };
    return grads[cat] || "linear-gradient(135deg, hsl(var(--envle-vert-dark)), hsl(var(--envle-vert)))";
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("fr-FR").format(price);

  const filtered = activeCat === "Tout" ? products : products.filter((p) => p.category === activeCat);

  const toggleFav = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)));
    toast("💛 Favori mis à jour");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 md:px-6 py-3 md:py-4 bg-envle-card border-b border-envle-border">
        <div className="flex items-center gap-2 md:gap-3 mb-3">
          <motion.button whileTap={{ scale: 0.85 }} className="w-9 h-9 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</motion.button>
          <div className="flex-1">
            <h2 className="font-display text-xl md:text-2xl font-bold">Boutique</h2>
            <p className="text-[11px] text-envle-text-muted">Commerce Made in Africa 🌍</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} className="px-3 py-1.5 rounded-xl border-none text-xs font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={onCreateProduct}>+ Produit</motion.button>
        </div>
        <div className="bg-foreground/[0.06] border border-envle-border rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-sm">🔍</span>
          <input type="text" placeholder="Rechercher un produit..." className="bg-transparent border-none outline-none text-foreground font-body text-xs md:text-sm flex-1 placeholder:text-envle-text-muted" />
        </div>
      </motion.div>

      <div className="flex px-4 md:px-6 gap-1.5 py-2 overflow-x-auto border-b border-envle-border" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <motion.button key={cat} whileTap={{ scale: 0.92 }} className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${activeCat === cat ? "bg-primary/20 text-envle-vert-light" : "bg-foreground/[0.04] text-envle-text-muted"}`} onClick={() => setActiveCat(cat)}>{cat}</motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-40"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-3xl">⏳</motion.span></div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-40 text-center">
            <span className="text-4xl mb-3">🛍️</span>
            <p className="text-envle-text-muted text-sm">Aucun produit disponible</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className="bg-envle-card border border-envle-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-all hover:shadow-[0_4px_20px_hsla(142,47%,33%,0.1)]"
                >
                  <div className="aspect-square relative flex items-center justify-center text-[48px] overflow-hidden" style={{ background: product.bgStyle }}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="group-hover:scale-110 transition-transform duration-500">{product.icon}</span>
                    )}
                    <motion.button whileTap={{ scale: 1.4 }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm border-none flex items-center justify-center text-sm cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleFav(product.id); }}>{product.isFavorite ? "❤️" : "🤍"}</motion.button>
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold mb-0.5 truncate">{product.name}</div>
                    <div className="text-[11px] text-envle-text-muted mb-2">{product.seller}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-envle-or">{formatPrice(product.price)} <span className="text-[10px] font-normal text-envle-text-muted">{product.currency}</span></span>
                      <motion.button whileTap={{ scale: 0.88 }} className="px-2 py-1 rounded-lg border-none text-[10px] font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={() => toast(`🛒 ${product.name} ajouté`)}>+ Panier</motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BoutiqueModule;
