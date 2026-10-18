import React, { useState } from 'react';
import { Wrench, X } from 'lucide-react';
import { Product } from '../types/pos';

interface ManualItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Product) => void;
}

export const ManualItemModal: React.FC<ManualItemModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('15.00');
  const [taxRate, setTaxRate] = useState('21');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0 || !description.trim()) return;

    const manualProduct: Product = {
      id: `manual-${Date.now()}`,
      sku: `SRV-${Math.floor(100 + Math.random() * 900)}`,
      name: description.trim(),
      subtitle: `Servicio express (${taxRate}% IVA)`,
      category: 'Servicios',
      brand: 'VoltAcc Service',
      price: numericPrice,
      stock: 999,
      location: 'Taller Mostrador',
      image: '',
      isService: true,
    };

    onAdd(manualProduct);
    setDescription('');
    setPrice('15.00');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#283044]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e293b] rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 border border-[#dae2fd]/70 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#131b2e] dark:text-white">
            <div className="w-9 h-9 rounded-lg bg-[#cce5ff] dark:bg-slate-800 flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold">Artículo Manual / Reparación</h3>
              <p className="text-xs text-[#3f4850] dark:text-slate-400">Concepto libre o mano de obra express</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#707881] dark:text-slate-400 hover:bg-[#eaedff] dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
              Descripción del concepto:
            </span>
            <input
              type="text"
              required
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Cambio de conector de carga / Mano de obra"
              className="h-11 px-3.5 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 text-[#131b2e] dark:text-white border border-[#dae2fd]/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006194] text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                Precio Unitario ($):
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="h-11 px-3.5 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 text-[#131b2e] dark:text-white font-mono-num text-base font-bold border border-[#dae2fd]/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006194]"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                Tipo IVA:
              </span>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="h-11 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 text-[#131b2e] dark:text-white border border-[#dae2fd]/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006194] text-sm font-medium"
              >
                <option value="21">General (21%)</option>
                <option value="10">Reducido (10%)</option>
                <option value="0">Exento (0%)</option>
              </select>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#dae2fd]/50 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-lg bg-[#eaedff] dark:bg-slate-800 hover:bg-[#dae2fd] dark:hover:bg-slate-700 text-[#131b2e] dark:text-slate-200 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 h-11 rounded-lg bg-[#006194] hover:bg-[#007bb9] active:scale-95 text-white text-sm font-semibold transition-all shadow-sm"
            >
              Añadir a la Venta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
