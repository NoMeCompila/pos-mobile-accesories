import React, { useState } from 'react';
import {
  Barcode,
  Plus,
  Search,
  QrCode,
  SlidersHorizontal,
  List,
  LayoutGrid,
  MapPin,
  ShoppingCart,
  Check,
  ArrowRight,
  ShieldAlert,
  Boxes,
} from 'lucide-react';
import { Product } from '../types/pos';
import { useProducts, useCart } from '../services/posStore';

interface CatalogStockViewProps {
  onNavigateToPOS: () => void;
}

export const CatalogStockView: React.FC<CatalogStockViewProps> = ({ onNavigateToPOS }) => {
  const { products, addProduct } = useProducts();
  const { cart, total, totalUnits, addItem } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'stock' | 'critical' | 'out'>('all');
  const [selectedBrand, setSelectedBrand] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [justAddedSku, setJustAddedSku] = useState<string | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // New product form states
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('19.99');
  const [newStock, setNewStock] = useState('20');
  const [newBrand, setNewBrand] = useState('Apple');
  const [newCategory, setNewCategory] = useState('Fundas & Carcasas');
  const [newLocation, setNewLocation] = useState('Pasillo A-03');

  const brands = ['Todos', 'Apple', 'Samsung', 'Universal', 'MagSafe', 'Audio'];
  const categories = [
    'Todas',
    'Fundas & Carcasas',
    'Protectores 9H',
    'Carga & MagSafe',
    'Cables Reforzados',
    'Audio / Wearables',
    'Accesorios',
  ];

  // Filtering
  const filteredProducts = products.filter((p) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchSubtitle = p.subtitle.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchSubtitle) return false;
    }
    // Stock Status
    if (statusFilter === 'stock' && p.stock <= 5) return false;
    if (statusFilter === 'critical' && (p.stock > 5 || p.stock === 0)) return false;
    if (statusFilter === 'out' && p.stock > 0) return false;
    // Brand
    if (selectedBrand !== 'Todos' && p.brand !== selectedBrand) return false;
    // Category
    if (selectedCategory !== 'Todas' && p.category !== selectedCategory) return false;

    return true;
  });

  const handleAddToTicket = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
    setJustAddedSku(product.sku);
    setTimeout(() => setJustAddedSku(null), 900);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName) return;

    const prod: Product = {
      id: `prod-${Date.now()}`,
      sku: newSku.toUpperCase(),
      name: newName,
      subtitle: newBrand,
      category: newCategory,
      brand: newBrand,
      price: parseFloat(newPrice) || 19.99,
      stock: parseInt(newStock) || 10,
      location: newLocation,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    };

    addProduct(prod);
    setIsNewProductModalOpen(false);
    setNewSku('');
    setNewName('');
  };

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Top Summary Banner / Status Bar */}
      <section className="pt-1 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00855b] animate-pulse" />
            <h2 className="font-headline text-xl font-bold text-[#131b2e] dark:text-white">
              Inventario Tienda
            </h2>
          </div>
          <span className="font-mono-num text-xs text-[#707881] dark:text-slate-400 bg-[#eaedff] dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            1,480 Ref. Activas
          </span>
        </div>

        {/* Quick Counters & Actions */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#1e293b] shadow-xs px-3 py-1.5 rounded-lg border border-[#dae2fd]/60 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#006947]" />
              <span className="text-xs font-bold text-[#006947] dark:text-[#4edea3] uppercase">
                1,466 Disp.
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#1e293b] shadow-xs px-3 py-1.5 rounded-lg border border-[#dae2fd]/60 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
              <span className="text-xs font-bold text-[#ba1a1a] dark:text-red-400 uppercase">
                14 Bajo Stock
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => alert('Modo auditoría de lote activado en pistola Honeywell.')}
              className="flex items-center gap-1.5 bg-[#eaedff] dark:bg-slate-800 hover:bg-[#dae2fd] text-[#006194] dark:text-[#93ccff] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-[#dae2fd]/60 dark:border-slate-700 shadow-xs"
            >
              <Barcode className="w-4 h-4" />
              <span>Lote</span>
            </button>
            <button
              onClick={() => setIsNewProductModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#006194] hover:bg-[#007bb9] active:scale-95 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>
      </section>

      {/* Search & Filter Controls */}
      <section className="pt-1 pb-3 flex flex-col gap-3">
        {/* Search Field */}
        <div className="relative flex items-center w-full">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#707881]">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar modelo, SKU o código..."
            className="w-full h-12 pl-11 pr-20 bg-white dark:bg-[#1e293b] text-[#131b2e] dark:text-white text-sm placeholder:text-[#707881] rounded-xl shadow-xs border border-[#dae2fd]/70 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006194] transition-all"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button
              onClick={() => alert('Escáner de cámara móvil iniciado.')}
              className="h-8 px-2 rounded-lg bg-[#eaedff] dark:bg-slate-700 text-[#006194] dark:text-[#93ccff] flex items-center gap-1 text-xs font-bold"
              title="Escanear con cámara"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stock Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-[#707881] hover:text-[#131b2e] dark:hover:text-white border border-[#dae2fd]/60 dark:border-slate-800'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('stock')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              statusFilter === 'stock'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-[#707881] hover:text-[#131b2e] dark:hover:text-white border border-[#dae2fd]/60 dark:border-slate-800'
            }`}
          >
            Con Stock (&gt;5)
          </button>
          <button
            onClick={() => setStatusFilter('critical')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
              statusFilter === 'critical'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-[#707881] hover:text-[#131b2e] dark:hover:text-white border border-[#dae2fd]/60 dark:border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
            <span>Stock Crítico (&lt;5)</span>
          </button>
          <button
            onClick={() => setStatusFilter('out')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              statusFilter === 'out'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-[#707881] hover:text-[#131b2e] dark:hover:text-white border border-[#dae2fd]/60 dark:border-slate-800'
            }`}
          >
            Agotados
          </button>
        </div>

        {/* Brand Filter Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          <span className="text-[10px] font-bold uppercase text-[#707881] mr-1 shrink-0">
            Marca:
          </span>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedBrand === brand
                  ? 'bg-[#dae2fd] dark:bg-slate-700 text-[#131b2e] dark:text-white'
                  : 'bg-white dark:bg-[#1e293b] text-[#707881] hover:text-[#131b2e] border border-[#dae2fd]/60 dark:border-slate-800'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-2.5 py-1 rounded-lg font-mono-num text-[11px] font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#dbe1ff] dark:bg-slate-700 text-[#003ea8] dark:text-[#93ccff]'
                  : 'bg-white dark:bg-[#1e293b] text-[#707881] hover:text-[#131b2e] border border-[#dae2fd]/60 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Subheader: Item count and List/Grid toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-[#dae2fd]/60 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-[#707881]">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{filteredProducts.length} productos visibles</span>
          </div>

          <div className="inline-flex items-center p-0.5 bg-[#eaedff] dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-[#006194] dark:text-[#93ccff] shadow-xs'
                  : 'text-[#707881]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-[#006194] dark:text-[#93ccff] shadow-xs'
                  : 'text-[#707881]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cuadrícula</span>
            </button>
          </div>
        </div>
      </section>

      {/* Product Catalog List / Grid */}
      <section className="pt-1">
        {viewMode === 'list' ? (
          <div className="flex flex-col divide-y divide-[#dae2fd]/60 dark:divide-slate-800 bg-white dark:bg-[#1e293b] rounded-2xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 overflow-hidden">
            {filteredProducts.map((product) => {
              const isAdded = justAddedSku === product.sku;

              return (
                <article
                  key={product.id}
                  className="flex items-center justify-between p-3.5 gap-3 hover:bg-[#f2f3ff] dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#f2f3ff] dark:bg-slate-800 shrink-0 border border-[#dae2fd]/60 dark:border-slate-700">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xs text-white font-mono-num text-[8px] text-center uppercase tracking-wider py-0.5">
                        {product.brand}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono-num text-[10px] text-[#707881] bg-[#eaedff] dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                        {product.stock <= 1 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ffdad6] text-[#93000a]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping" />
                            ¡Última ud!
                          </span>
                        ) : product.stock <= 4 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-900" />
                            {product.stock} uds bajo stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#6ffbbe]/30 text-[#006947] dark:text-[#4edea3]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#006947]" />
                            {product.stock} uds disp.
                          </span>
                        )}
                        {product.isTop && (
                          <span className="font-mono-num text-[10px] font-bold text-[#006947] dark:text-[#4edea3] bg-[#f2f3ff] dark:bg-slate-800 px-1 rounded">
                            Top
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-[#131b2e] dark:text-white truncate">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-1 text-[#707881] dark:text-slate-400 text-xs">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-[#707881]" />
                          {product.location}
                        </span>
                        <span>•</span>
                        <span>{product.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex flex-col items-end shrink-0 pl-1">
                    <div className="flex items-baseline gap-1 mb-1.5">
                      <span className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="font-mono-num text-[9px] text-[#707881]">IVA</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddToTicket(product, e)}
                      className={`h-9 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all shadow-xs active:scale-95 ${
                        isAdded
                          ? 'bg-[#00855b] text-white'
                          : 'bg-[#006194] hover:bg-[#007bb9] text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>¡Añadido!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>+ Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => {
              const isAdded = justAddedSku === product.sku;

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-[#1e293b] p-3 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div className="relative w-full h-32 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 overflow-hidden mb-2">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3]">
                      {product.stock} uds
                    </span>
                  </div>

                  <div>
                    <span className="font-mono-num text-[10px] text-[#006194] dark:text-[#93ccff] font-bold">
                      {product.sku}
                    </span>
                    <h4 className="text-xs font-semibold text-[#131b2e] dark:text-white line-clamp-1">
                      {product.name}
                    </h4>
                    <span className="text-[10px] text-[#707881] flex items-center gap-0.5 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {product.location}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#dae2fd]/60 dark:border-slate-700">
                    <span className="font-headline font-bold text-base text-[#131b2e] dark:text-white">
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleAddToTicket(product, e)}
                      className="h-8 px-2.5 rounded-md bg-[#006194] hover:bg-[#007bb9] text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ticket</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating Operational Quick-Bar & Sync Pill */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4 z-40 flex flex-col items-center gap-2 pointer-events-none">
          {/* Active Ticket Quick Cart Indicator */}
          <div className="pointer-events-auto w-full max-w-md bg-[#283044] text-[#eef0ff] rounded-2xl shadow-2xl p-3.5 flex items-center justify-between border border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#006194] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                {totalUnits}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight">Ticket en curso</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                </div>
                <span className="font-headline text-lg font-bold text-[#93ccff] leading-tight">
                  ${total.toFixed(2)} total
                </span>
              </div>
            </div>

            <button
              onClick={onNavigateToPOS}
              className="h-11 px-4 bg-[#007bb9] hover:bg-[#006194] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <span>Cobrar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Live Sync Toast Capsule */}
          <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1 rounded-full shadow-md flex items-center gap-2 text-[#707881] font-mono-num text-[11px] border border-[#dae2fd]/60 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006947] animate-pulse" />
            <span>Sincronizado: Hace 12 seg • Caja 02</span>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 bg-[#283044]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-[#dae2fd]/70 dark:border-slate-700">
            <h3 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
              Alta de Nuevo Producto
            </h3>
            <form onSubmit={handleCreateProduct} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                <span>SKU / Referencia:</span>
                <input
                  type="text"
                  required
                  placeholder="Ej: VA-CASE-16P-BLUE"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 font-mono-num text-xs uppercase"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                <span>Nombre del Producto:</span>
                <input
                  type="text"
                  required
                  placeholder="Ej: Funda Silicona Magnética Azul"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 text-xs"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                  <span>Precio Venta ($):</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 font-mono-num text-xs"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                  <span>Stock Inicial (Uds):</span>
                  <input
                    type="number"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 font-mono-num text-xs"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                  <span>Marca:</span>
                  <select
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 text-xs"
                  >
                    <option>Apple</option>
                    <option>Samsung</option>
                    <option>Universal</option>
                    <option>MagSafe</option>
                    <option>Audio</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                  <span>Ubicación en Tienda:</span>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 text-xs"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dae2fd]/60 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 h-10 rounded-lg bg-[#eaedff] dark:bg-slate-800 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 rounded-lg bg-[#006194] text-white text-xs font-semibold"
                >
                  Guardar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
