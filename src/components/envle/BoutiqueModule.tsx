import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: string;
  currency: string;
  seller: string;
  icon: string;
  bgStyle: string;
  category: string;
  rating: number;
  reviews: number;
  isFavorite: boolean;
}

const mockProducts: Product[] = [
  { id: "1", name: "Tissu Wax Premium", price: "15 000", currency: "FCFA", seller: "Wax&Style", icon: "🧵", bgStyle: "linear-gradient(135deg, #f59e0b, #dc2626)", category: "Mode", rating: 4.8, reviews: 124, isFavorite: false },
  { id: "2", name: "Beurre de Karité Bio", price: "5 500", currency: "FCFA", seller: "Nature Africa", icon: "🧴", bgStyle: "linear-gradient(135deg, #10b981, #059669)", category: "Beauté", rating: 4.9, reviews: 89, isFavorite: true },
  { id: "3", name: "Panier Tressé Artisanal", price: "12 000", currency: "FCFA", seller: "Artisan Sahel", icon: "🧺", bgStyle: "linear-gradient(135deg, #f97316, #b45309)", category: "Artisanat", rating: 4.7, reviews: 56, isFavorite: false },
  { id: "4", name: "Café Éthiopien Yirgacheffe", price: "8 900", currency: "FCFA", seller: "Coffee Africa", icon: "☕", bgStyle: "linear-gradient(135deg, #78350f, #451a03)", category: "Alimentation", rating: 5.0, reviews: 203, isFavorite: true },
  { id: "5", name: "Sac en Cuir Tanné", price: "25 000", currency: "FCFA", seller: "Cuir du Mali", icon: "👜", bgStyle: "linear-gradient(135deg, #a16207, #713f12)", category: "Mode", rating: 4.6, reviews: 78, isFavorite: false },
  { id: "6", name: "Smartphone Reconditionné", price: "89 000", currency: "FCFA", seller: "TechHub Store", icon: "📱", bgStyle: "linear-gradient(135deg, #0ea5e9, #1d4ed8)", category: "Tech", rating: 4.4, reviews: 312, isFavorite: false },
];

const categories = ["Tout", "Mode", "Beauté", "Artisanat", "Tech", "Alimentation"];

interface Props {
  onBack: () => void;
  onCreateProduct?: () => void;
}

const BoutiqueModule = ({ onBack, onCreateProduct }: Props) => {
  const [activeCat, setActiveCat] = useState("Tout");
  const [products, setProducts] = useState(mockProducts);

  const filtered = activeCat === "Tout" ? products : products.filter((p) => p.category === activeCat);

  const toggleFav = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)));
    toast("💛 Favori mis à jour");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="px-6 py-4 bg-envle-card border-b border-envle-border">
        <div className="flex items-center gap-3 mb-3">
          <button className="w-10 h-10 rounded-xl bg-foreground/[0.06] border-none text-lg cursor-pointer flex items-center justify-center hover:bg-primary/20 transition-all md:hidden" onClick={onBack}>←</button>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">Boutique</h2>
            <p className="text-xs text-envle-text-muted">Commerce Made in Africa 🌍</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} className="px-3 py-2 rounded-xl border-none text-xs font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={onCreateProduct}>+ Produit</motion.button>
          <button className="text-xl" onClick={() => toast("🛒 Panier — 0 articles")}>🛒</button>
        </div>
        <div className="bg-foreground/[0.06] border border-envle-border rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
          <span>🔍</span>
          <input type="text" placeholder="Rechercher un produit..." className="bg-transparent border-none outline-none text-foreground font-body text-sm flex-1 placeholder:text-envle-text-muted" />
        </div>
      </div>

      <div className="flex px-6 gap-2 py-3 overflow-x-auto border-b border-envle-border" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <motion.button key={cat} whileTap={{ scale: 0.95 }} className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${activeCat === cat ? "bg-primary/20 text-envle-vert-light" : "bg-foreground/[0.04] text-envle-text-muted"}`} onClick={() => setActiveCat(cat)}>{cat}</motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }} className="bg-envle-card border border-envle-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-all">
                <div className="aspect-square relative flex items-center justify-center text-[64px] group-hover:scale-105 transition-transform duration-500" style={{ background: product.bgStyle }}>
                  {product.icon}
                  <motion.button whileTap={{ scale: 1.3 }} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border-none flex items-center justify-center text-base cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleFav(product.id); }}>{product.isFavorite ? "❤️" : "🤍"}</motion.button>
                </div>
                <div className="p-4">
                  <div className="text-sm font-bold mb-1">{product.name}</div>
                  <div className="text-xs text-envle-text-muted mb-2">{product.seller}</div>
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-xs text-envle-or">{"⭐".repeat(Math.floor(product.rating))}</span>
                    <span className="text-xs text-envle-text-muted">{product.rating} ({product.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-envle-or">{product.price} <span className="text-xs font-normal text-envle-text-muted">{product.currency}</span></span>
                    <motion.button whileTap={{ scale: 0.9 }} className="px-3 py-1.5 rounded-lg border-none text-xs font-semibold cursor-pointer text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--envle-vert)), hsl(var(--envle-vert-dark)))" }} onClick={() => toast(`🛒 ${product.name} ajouté au panier`)}>+ Panier</motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default BoutiqueModule;
