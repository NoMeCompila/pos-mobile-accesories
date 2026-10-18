import React, { useState } from 'react';
import {
  Barcode,
  Plus,
  UserCheck,
  ChevronDown,
  Wrench,
  Trash2,
  TrendingUp,
  PauseCircle,
  Percent,
  Printer,
  XCircle,
  CheckCircle,
  PlusCircle,
  Loader2,
  Smartphone,
  Shield,
  Zap,
  Cable,
  Headphones,
  LayoutGrid,
} from 'lucide-react';
import { Product, CartItem, Customer, Ticket } from '../types/pos';
import { useProducts, useCart } from '../services/posStore';
import { ManualItemModal } from './ManualItemModal';
import { PaymentModal } from './PaymentModal';
import { CustomerModal } from './CustomerModal';
import { ReceiptModal } from './ReceiptModal';

interface POSTerminalViewProps {
  onOpenReceipt: (ticket: Ticket) => void;
}

export const POSTerminalView: React.FC<POSTerminalViewProps> = ({ onOpenReceipt }) => {
  const { products, addProduct } = useProducts();
  const {
    cart,
    customer,
    coupon,
    heldTickets,
    grossSubtotal,
    discountAmount,
    taxableBase,
    vat,
    total,
    totalUnits,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    setCustomer,
    setCoupon,
    holdTicket,
    recallTicket,
  } = useCart();

  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [skuSearch, setSkuSearch] = useState<string>('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isHeldMenuOpen, setIsHeldMenuOpen] = useState(false);
  const [addedAnimationSku, setAddedAnimationSku] = useState<string | null>(null);

  const categories = [
    { label: 'Todos', icon: LayoutGrid },
    { label: 'Fundas iPhone', icon: Smartphone, filterCategory: 'Fundas & Carcasas' },
    { label: 'Protectores 9H', icon: Shield, filterCategory: 'Protectores 9H' },
    { label: 'Cargadores & GaN', icon: Zap, filterCategory: 'Carga & MagSafe' },
    { label: 'Cables Reforzados', icon: Cable, filterCategory: 'Cables Reforzados' },
    { label: 'Audio / Wearables', icon: Headphones, filterCategory: 'Audio / Wearables' },
  ];

  // Filtering products
  const filteredProducts = products.filter((p) => {
    if (activeCategory === 'Todos') return true;
    const cat = categories.find((c) => c.label === activeCategory);
    if (!cat?.filterCategory) return true;
    return p.category.toLowerCase().includes(cat.filterCategory.toLowerCase());
  });

  // Handle direct barcode / SKU addition
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuSearch.trim()) return;

    const term = skuSearch.trim().toLowerCase();
    const found = products.find(
      (p) => p.sku.toLowerCase() === term || p.name.toLowerCase().includes(term)
    );

    if (found) {
      handleItemAdd(found);
      setSkuSearch('');
    } else {
      // Create quick unknown item or notify
      alert(`SKU "${skuSearch}" no encontrado en catálogo.`);
    }
  };

  const handleItemAdd = (product: Product) => {
    addItem(product, 1);
    setAddedAnimationSku(product.sku);
    setTimeout(() => setAddedAnimationSku(null), 500);
  };

  const handleToggleCoupon = () => {
    if (coupon) {
      setCoupon(null);
    } else {
      setCoupon('ACC-10%');
    }
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* 2-Column Responsive Layout matching mockups */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* LEFT PANEL: Catalog, Fast Barcode Scanner, Category Strip (7-8 cols on XL) */}
        <div className="xl:col-span-7 2xl:col-span-8 flex flex-col gap-4">
          {/* Top Action Control Deck: Scanner & Customer Strip */}
          <div className="bg-white dark:bg-[#1e293b] p-3.5 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Fast Barcode / SKU Input */}
              <form onSubmit={handleBarcodeSubmit} className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#006194] dark:text-[#93ccff]">
                  <Barcode className="w-5 h-5" />
                </div>
                <input
                  id="skuInput"
                  type="text"
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  placeholder="Escanear código de barras o teclear SKU (F1)..."
                  className="w-full h-12 pl-11 pr-24 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 text-[#131b2e] dark:text-white placeholder:text-[#707881] text-sm font-medium border border-transparent focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006194] transition-all"
                />
                <div className="absolute inset-y-0 right-1.5 flex items-center gap-1.5">
                  <span className="hidden sm:inline-block font-mono-num text-[11px] text-[#3f4850] dark:text-slate-400 bg-[#dae2fd] dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    F1
                  </span>
                  <button
                    type="submit"
                    className="h-9 px-3 rounded-md bg-[#006194] hover:bg-[#007bb9] active:scale-95 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              </form>

              {/* Customer Association Pill Button */}
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="flex items-center justify-between gap-2 bg-[#f2f3ff] dark:bg-slate-800 px-3.5 h-12 rounded-lg cursor-pointer hover:bg-[#eaedff] dark:hover:bg-slate-700 transition-colors border border-[#dae2fd]/50 dark:border-slate-700 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-[#006194] dark:text-[#93ccff] shrink-0" />
                  <div className="flex flex-col pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#131b2e] dark:text-white leading-none truncate max-w-[170px]">
                        {customer.name}
                      </span>
                      {customer.points > 0 && (
                        <span className="text-[10px] font-bold text-[#006947] dark:text-[#4edea3] bg-[#6ffbbe]/40 px-1 rounded leading-none">
                          {customer.points} pts
                        </span>
                      )}
                    </div>
                    <span className="font-mono-num text-[11px] text-[#3f4850] dark:text-slate-400 leading-tight">
                      NIF: {customer.nif} (F4 cambiar)
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#707881]" />
              </button>
            </div>

            {/* Filter Chips Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setActiveCategory(cat.label)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs shrink-0 ${
                      isSelected
                        ? 'bg-[#006194] text-white shadow-sm'
                        : 'bg-[#eaedff] dark:bg-slate-800 hover:bg-[#dae2fd] dark:hover:bg-slate-700 text-[#131b2e] dark:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Product Grid (8 Items + 1 Express Tile) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filteredProducts.slice(0, 8).map((product) => {
              const isAnimating = addedAnimationSku === product.sku;
              return (
                <div
                  key={product.id}
                  onClick={() => handleItemAdd(product)}
                  className={`group relative bg-white dark:bg-[#1e293b] p-2.5 rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between h-[210px] border border-[#dae2fd]/60 dark:border-slate-800 overflow-hidden ${
                    isAnimating ? 'ring-2 ring-[#006947] bg-[#f5fff6] dark:bg-[#002113]' : ''
                  }`}
                >
                  {/* Stock Badge Top Right */}
                  <div className="absolute top-2 right-2 z-10">
                    {product.stock <= 1 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] font-bold flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping" />
                        Última 1 ud
                      </span>
                    ) : product.stock <= 4 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold shadow-xs">
                        {product.stock} uds
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3] font-bold shadow-xs">
                        {product.stock} uds
                      </span>
                    )}
                  </div>

                  {/* Image container */}
                  <div className="w-full h-24 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 overflow-hidden relative flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex flex-col mt-1">
                    <span className="font-mono-num text-[10px] font-bold text-[#006194] dark:text-[#93ccff] uppercase tracking-wider truncate">
                      {product.subtitle}
                    </span>
                    <span className="text-xs font-semibold text-[#131b2e] dark:text-white line-clamp-1 leading-snug">
                      {product.name}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-headline font-bold text-base text-[#006194] dark:text-[#93ccff]">
                        ${product.price.toFixed(2)}
                      </span>
                      <PlusCircle className="w-5 h-5 text-[#006194] dark:text-[#93ccff] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Express Service / Manual Item Action Card (F2) */}
            <div
              onClick={() => setIsManualModalOpen(true)}
              className="group relative bg-[#f2f3ff] dark:bg-slate-800 hover:bg-[#eaedff] dark:hover:bg-slate-700/80 p-3 rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98] flex flex-col items-center justify-center text-center h-[210px] border border-dashed border-[#006194]/40"
            >
              <div className="w-12 h-12 rounded-full bg-[#cce5ff] dark:bg-slate-700 flex items-center justify-center text-[#006194] dark:text-[#93ccff] mb-2 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-[#131b2e] dark:text-white">
                + Artículo Manual
              </span>
              <span className="text-xs text-[#707881] dark:text-slate-400 mt-0.5">
                Reparación express o servicio
              </span>
              <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-[#dae2fd] dark:bg-slate-700 text-[#131b2e] dark:text-slate-200">
                F2 Rápido
              </span>
            </div>
          </div>

          {/* Quick Metrics Spark Bar */}
          <div className="bg-[#f2f3ff] dark:bg-[#1e293b] p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border border-[#dae2fd]/60 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#006947] dark:text-[#4edea3]" />
              <span className="text-[#3f4850] dark:text-slate-300">
                Ritmo de caja hoy:{' '}
                <strong className="text-[#131b2e] dark:text-white font-semibold">
                  34 tickets emitidos ($1,420.80)
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono-num text-[#707881] dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006947]" />
                <span>Lector Honeywell: OK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0051d5]" />
                <span>TPV Redsys: Activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Active Transaction Ticket / Manifest / Tender Controls (4-5 cols on XL) */}
        <div className="xl:col-span-5 2xl:col-span-4 flex flex-col gap-3 sticky top-20">
          <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/70 dark:border-slate-800 flex flex-col">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#dae2fd]/40 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-headline text-lg font-bold text-[#131b2e] dark:text-white tracking-tight">
                  Ticket #TRX-8942
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3] uppercase">
                  En curso
                </span>
              </div>

              {/* En Espera button / Held manager */}
              <div className="relative">
                <button
                  type="button"
                  onClick={holdTicket}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eaedff] dark:bg-slate-800 hover:bg-[#dae2fd] dark:hover:bg-slate-700 text-[#131b2e] dark:text-slate-200 text-xs font-semibold transition-colors"
                  title="Poner venta actual en espera"
                >
                  <PauseCircle className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
                  <span>En Espera</span>
                  {heldTickets.length > 0 && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-[#ba1a1a] text-white text-[9px] flex items-center justify-center font-bold">
                      {heldTickets.length}
                    </span>
                  )}
                </button>

                {/* Recalling held tickets trigger */}
                {heldTickets.length > 0 && (
                  <button
                    onClick={() => setIsHeldMenuOpen(!isHeldMenuOpen)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#007bb9] text-white text-[9px] flex items-center justify-center"
                    title="Ver tickets en espera"
                  >
                    !
                  </button>
                )}

                {isHeldMenuOpen && heldTickets.length > 0 && (
                  <div className="absolute right-0 top-9 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-[#dae2fd] dark:border-slate-700 z-50 p-2 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#707881] px-2 py-1 uppercase">
                      Tickets en Pausa ({heldTickets.length})
                    </span>
                    {heldTickets.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => {
                          recallTicket(h.id);
                          setIsHeldMenuOpen(false);
                        }}
                        className="p-2 rounded-lg hover:bg-[#f2f3ff] dark:hover:bg-slate-700 text-left text-xs flex justify-between items-center"
                      >
                        <span className="font-semibold truncate text-[#131b2e] dark:text-white">
                          {h.name}
                        </span>
                        <span className="font-mono-num text-[10px] text-[#707881]">{h.time}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Metadata Bar */}
            <div className="flex items-center justify-between text-[#707881] dark:text-slate-400 py-2 text-[11px] font-mono-num">
              <span>
                Artículos:{' '}
                <strong className="text-[#131b2e] dark:text-white">
                  {cart.length} líneas ({totalUnits} uds)
                </strong>
              </span>
              <span>Cajero: E. Harrison • Mostrador 02</span>
            </div>

            {/* Cart Item Stream */}
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-0.5 no-scrollbar py-1">
              {cart.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center text-[#707881] dark:text-slate-400">
                  <Barcode className="w-8 h-8 opacity-40 mb-1" />
                  <p className="text-xs font-semibold">El ticket está vacío</p>
                  <p className="text-[11px]">Escanee un artículo o selecciónelo del catálogo</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#f2f3ff] dark:bg-slate-800/80 hover:bg-[#eaedff] dark:hover:bg-slate-700/80 transition-colors group"
                  >
                    <div className="flex flex-col flex-1 min-w-0 pr-2">
                      <span className="text-xs font-semibold text-[#131b2e] dark:text-white truncate">
                        {item.product.name}
                      </span>
                      <div className="flex items-center gap-2 text-[#707881] dark:text-slate-400 font-mono-num text-[10px]">
                        <span>SKU: {item.product.sku}</span>
                        <span>•</span>
                        <span>${item.unitPrice.toFixed(2)} c/u</span>
                      </div>
                    </div>

                    {/* Quantity Touch Controls */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-700 px-1 py-0.5 rounded-md shadow-xs border border-[#dae2fd]/60 dark:border-slate-600">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.product.sku, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-slate-600 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono-num text-xs font-bold text-[#131b2e] dark:text-white w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.product.sku, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-slate-600 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Total Line Price & Delete */}
                    <div className="flex items-center gap-2 pl-3">
                      <span className="font-mono-num text-xs font-bold text-[#131b2e] dark:text-white text-right w-14">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.sku)}
                        className="text-[#ba1a1a] opacity-60 hover:opacity-100 p-1 rounded hover:bg-[#ffdad6] dark:hover:bg-red-950 transition-all"
                        title="Eliminar línea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financial Breakdown Block */}
            <div className="mt-2 pt-2.5 bg-[#eaedff] dark:bg-slate-800/90 rounded-lg p-3 flex flex-col gap-1 border border-[#dae2fd]/60 dark:border-slate-700">
              <div className="flex justify-between items-center text-[#707881] dark:text-slate-400 text-xs">
                <span>Subtotal Bruto</span>
                <span className="font-mono-num text-xs font-medium">
                  ${grossSubtotal.toFixed(2)}
                </span>
              </div>

              {/* Promo Coupon Line */}
              <div
                onClick={handleToggleCoupon}
                className="flex justify-between items-center text-[#006947] dark:text-[#4edea3] text-xs cursor-pointer hover:opacity-80 transition-opacity"
                title="Click para alternar o eliminar cupón"
              >
                <span className="flex items-center gap-1 font-semibold">
                  <Percent className="w-3.5 h-3.5" />
                  <span>{coupon ? `Cupón Promo ('${coupon}')` : 'Aplicar Cupón (-10%)'}</span>
                </span>
                <span className="font-mono-num font-bold">
                  {discountAmount > 0 ? `-$${discountAmount.toFixed(2)}` : '$0.00'}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#707881] dark:text-slate-400 text-xs">
                <span>Base imponible</span>
                <span className="font-mono-num font-medium">
                  ${taxableBase.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#707881] dark:text-slate-400 text-xs">
                <span>IVA Desglosado (21%)</span>
                <span className="font-mono-num font-medium">
                  ${vat.toFixed(2)}
                </span>
              </div>

              {/* Total Due Banner */}
              <div className="mt-1 pt-2 bg-[#dae2fd] dark:bg-slate-700/80 -mx-3 -mb-3 px-3 pb-3 rounded-b-lg flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#006194] dark:text-[#93ccff]">
                    Total a Cobrar
                  </span>
                  <span className="font-mono-num text-[10px] text-[#707881] dark:text-slate-400">
                    Impuestos incl.
                  </span>
                </div>
                <span className="font-headline text-3xl sm:text-4xl font-bold text-[#006194] dark:text-[#93ccff] tracking-tight leading-none">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quick Payment Methods Selector Grid */}
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="h-11 rounded-lg bg-[#eaedff] dark:bg-slate-800 hover:bg-[#cce5ff] dark:hover:bg-slate-700 text-[#131b2e] dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#006947]" />
                <span>Efectivo (F8)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="h-11 rounded-lg bg-[#eaedff] dark:bg-slate-800 hover:bg-[#cce5ff] dark:hover:bg-slate-700 text-[#131b2e] dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#007bb9]" />
                <span>Tarjeta / TPV (F9)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="h-11 rounded-lg bg-[#eaedff] dark:bg-slate-800 hover:bg-[#cce5ff] dark:hover:bg-slate-700 text-[#131b2e] dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#0051d5]" />
                <span>Bizum / Contactless</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="h-11 rounded-lg bg-[#eaedff] dark:bg-slate-800 hover:bg-[#cce5ff] dark:hover:bg-slate-700 text-[#131b2e] dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Dividir Pago</span>
              </button>
            </div>

            {/* Master Pay Action Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
              className="mt-2.5 w-full h-14 rounded-xl bg-[#006194] hover:bg-[#007bb9] active:scale-[0.99] text-white font-headline text-lg font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Cobrar ${total.toFixed(2)}</span>
              <span className="font-mono-num text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-normal ml-1">
                F12 / Espacio
              </span>
            </button>

            {/* Secondary Controls (Descuento, Presupuesto, Cancelar) */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                type="button"
                onClick={handleToggleCoupon}
                className="h-9 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 hover:bg-[#eaedff] text-[#131b2e] dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Descuento</span>
              </button>

              <button
                type="button"
                onClick={() => alert(`Presupuesto de $${total.toFixed(2)} guardado para ${customer.name}.`)}
                className="h-9 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 hover:bg-[#eaedff] text-[#131b2e] dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Presupuesto</span>
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="h-9 rounded-lg bg-[#ffdad6] dark:bg-red-950/40 hover:bg-[#ffdad6]/80 text-[#ba1a1a] dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>

          {/* Hardware Peripheral Status & Keyboard Shortcuts Helper */}
          <div className="bg-[#f2f3ff] dark:bg-[#1e293b] p-3 rounded-xl flex flex-col gap-1.5 border border-[#dae2fd]/60 dark:border-slate-800 text-[11px] font-mono-num text-[#707881] dark:text-slate-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006947]" />
                <span>Impresora Epson TM-T20III: <strong className="text-[#131b2e] dark:text-white">Conectada</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006947]" />
                <span>Cajón portamonedas: <strong className="text-[#131b2e] dark:text-white">Listo</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 border-t border-[#dae2fd]/60 dark:border-slate-700">
              <span className="bg-[#eaedff] dark:bg-slate-800 px-1 rounded text-[#131b2e] dark:text-white font-bold">F1</span> Escanear
              <span className="text-[#bfc7d2]">•</span>
              <span className="bg-[#eaedff] dark:bg-slate-800 px-1 rounded text-[#131b2e] dark:text-white font-bold">F4</span> Cliente
              <span className="text-[#bfc7d2]">•</span>
              <span className="bg-[#eaedff] dark:bg-slate-800 px-1 rounded text-[#131b2e] dark:text-white font-bold">F8</span> Efectivo
              <span className="text-[#bfc7d2]">•</span>
              <span className="bg-[#eaedff] dark:bg-slate-800 px-1 rounded text-[#131b2e] dark:text-white font-bold">F9</span> Tarjeta
              <span className="text-[#bfc7d2]">•</span>
              <span className="bg-[#eaedff] dark:bg-slate-800 px-1 rounded text-[#131b2e] dark:text-white font-bold">F12</span> Cobrar
              <span className="text-[#bfc7d2]">•</span>
              <span className="bg-[#eaedff] dark:bg-slate-800 px-1 rounded text-[#131b2e] dark:text-white font-bold">Esc</span> Cancelar
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ManualItemModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={handleItemAdd}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        currentCustomer={customer}
        onSelectCustomer={setCustomer}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        subtotal={grossSubtotal}
        taxableBase={taxableBase}
        vat={vat}
        discount={discountAmount}
        couponCode={coupon}
        items={cart}
        customer={customer}
        onSuccess={(completed) => {
          clearCart();
          onOpenReceipt(completed);
        }}
      />
    </div>
  );
};
