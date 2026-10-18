import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', desc: 'Foco directo en el buscador o lector de código de barras' },
    { key: 'F2', desc: 'Abrir ventana de Artículo Manual / Reparación express' },
    { key: 'F4', desc: 'Asignar o cambiar cliente / NIF para factura' },
    { key: 'F8', desc: 'Cobro rápido en Efectivo con cálculo de cambio' },
    { key: 'F9', desc: 'Cobro rápido con Tarjeta en TPV Redsys/Ingenico' },
    { key: 'F12 / Espacio', desc: 'Ejecutar cobro y tender del ticket actual' },
    { key: 'Esc', desc: 'Cerrar ventanas modales o cancelar operación activa' },
  ];

  return (
    <div className="fixed inset-0 bg-[#283044]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-[#dae2fd]/70 dark:border-slate-700 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#dae2fd]/60 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#cce5ff] dark:bg-slate-800 flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                Atajos de Teclado Operativos
              </h3>
              <p className="text-xs text-[#707881] dark:text-slate-400">Diseñado para cajas de alta velocidad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#707881] hover:bg-[#eaedff] dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col divide-y divide-[#dae2fd]/60 dark:divide-slate-700">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-[#3f4850] dark:text-slate-300 font-medium">{sc.desc}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-[#eaedff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 font-mono-num font-bold text-[#006194] dark:text-[#93ccff] whitespace-nowrap shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-2 h-10 w-full rounded-xl bg-[#006194] text-white text-xs font-semibold shadow-sm"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
