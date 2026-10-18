import React, { useState } from 'react';
import { X, Search, UserCheck, Plus, Check } from 'lucide-react';
import { Customer } from '../types/pos';
import { INITIAL_CUSTOMERS } from '../data/mockData';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCustomer: Customer;
  onSelectCustomer: (customer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  currentCustomer,
  onSelectCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNif, setNewNif] = useState('');
  const [newPhone, setNewPhone] = useState('');

  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created: Customer = {
      id: `cust-${Date.now()}`,
      name: newName.trim(),
      nif: newNif.trim() || 'N/A',
      phone: newPhone.trim() || undefined,
      points: 10,
      isVip: false,
    };

    setCustomers([created, ...customers]);
    onSelectCustomer(created);
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#283044]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 border border-[#dae2fd]/70 dark:border-slate-700 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#dae2fd]/60 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#cce5ff] dark:bg-slate-800 flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                Asignar Cliente a la Venta
              </h3>
              <p className="text-xs text-[#707881] dark:text-slate-400">Atajo F4 para búsqueda rápida</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#707881] hover:bg-[#eaedff] dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCreating ? (
          <>
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707881]" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar por nombre, NIF o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f2f3ff] dark:bg-slate-800 text-sm border border-[#dae2fd]/80 dark:border-slate-700 text-[#131b2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#006194]"
              />
            </div>

            {/* Customers List */}
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar pr-0.5">
              {filtered.map((cust) => {
                const isSelected = currentCustomer.id === cust.id;
                return (
                  <button
                    key={cust.id}
                    onClick={() => {
                      onSelectCustomer(cust);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#cce5ff]/50 dark:bg-slate-700/60 border-[#007bb9]'
                        : 'bg-[#faf8ff] dark:bg-slate-800/60 border-[#dae2fd]/60 dark:border-slate-700 hover:bg-[#eaedff] dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#dae2fd] dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-[#006194] dark:text-[#93ccff]">
                        {cust.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-[#131b2e] dark:text-white">
                            {cust.name}
                          </span>
                          {cust.points > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3]">
                              {cust.points} pts
                            </span>
                          )}
                        </div>
                        <span className="font-mono-num text-[11px] text-[#707881] dark:text-slate-400">
                          NIF: {cust.nif} {cust.phone ? `· ${cust.phone}` : ''}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#007bb9]" />}
                  </button>
                );
              })}
            </div>

            {/* Create New Trigger */}
            <button
              onClick={() => setIsCreating(true)}
              className="mt-1 h-11 w-full rounded-xl bg-[#f2f3ff] dark:bg-slate-800 hover:bg-[#dae2fd] dark:hover:bg-slate-700 text-[#006194] dark:text-[#93ccff] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-dashed border-[#006194]/40"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Cliente / Empresa</span>
            </button>
          </>
        ) : (
          /* Create Form */
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                Nombre Completo o Razón Social:
              </span>
              <input
                type="text"
                required
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Laura Martínez Santos"
                className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 text-sm border border-[#dae2fd] dark:border-slate-700"
              />
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                  NIF / CIF:
                </span>
                <input
                  type="text"
                  value={newNif}
                  onChange={(e) => setNewNif(e.target.value)}
                  placeholder="Ej: 47123998-B"
                  className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 font-mono-num text-sm border border-[#dae2fd] dark:border-slate-700"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                  Teléfono Móvil:
                </span>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 font-mono-num text-sm border border-[#dae2fd] dark:border-slate-700"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 h-10 rounded-lg bg-[#eaedff] dark:bg-slate-800 text-xs font-semibold"
              >
                Volver
              </button>
              <button
                type="submit"
                className="px-4 h-10 rounded-lg bg-[#006194] text-white text-xs font-semibold shadow-sm"
              >
                Guardar y Asignar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
