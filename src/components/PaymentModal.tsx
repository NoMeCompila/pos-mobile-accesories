import React, { useState } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  Smartphone,
  Split,
  CheckCircle,
  Loader2,
  Receipt,
} from 'lucide-react';
import { PaymentMethod, Ticket, CartItem, Customer } from '../types/pos';
import { useSalesHistory, useCashShift, useProducts } from '../services/posStore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  taxableBase: number;
  vat: number;
  discount: number;
  couponCode?: string | null;
  items: CartItem[];
  customer: Customer;
  onSuccess: (completedTicket: Ticket) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  subtotal,
  taxableBase,
  vat,
  discount,
  couponCode,
  items,
  customer,
  onSuccess,
}) => {
  const { addTicket } = useSalesHistory();
  const { recordSale } = useCashShift();
  const { updateStock } = useProducts();

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [cashGiven, setCashGiven] = useState<string>(total.toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [splitCashPart, setSplitCashPart] = useState<string>((total / 2).toFixed(2));

  if (!isOpen) return null;

  const numericCash = parseFloat(cashGiven) || 0;
  const changeDue = Math.max(0, numericCash - total);

  const quickPills = [
    total,
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total);

  const handleProcessPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const now = new Date();
      const ticketNumber = `#TRX-${Math.floor(8940 + Math.random() * 100)}`;
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

      const newTicket: Ticket = {
        id: `trx-${Date.now()}`,
        ticketNumber,
        time: timeStr,
        date: dateStr,
        timestamp: Date.now(),
        cashier: 'E. Harrison',
        terminal: 'Caja 02 • Term #02',
        customer,
        items: items.map((i) => ({
          productName: i.product.name,
          sku: i.product.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: Math.round(i.unitPrice * i.quantity * 100) / 100,
        })),
        itemSummary: `${items.map((i) => i.product.name).slice(0, 2).join(' + ')}${
          items.length > 2 ? ` (+${items.length - 2} más)` : ''
        }`,
        subtotal,
        discount,
        couponCode: couponCode || undefined,
        taxableBase,
        vat,
        total,
        paymentMethod: method,
        cardLast4: method === 'card' || method === 'split' ? '9124' : undefined,
        authCode: `AUTH-#${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'paid',
      };

      // Deduct stock for physical products
      items.forEach((item) => {
        if (!item.product.isService) {
          updateStock({ sku: item.product.sku, delta: -item.quantity });
        }
      });

      // Record in sales history & shift
      addTicket(newTicket);
      recordSale(total, method);

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onSuccess(newTicket);
        onClose();
      }, 1000);
    }, 900);
  };

  return (
    <div className="fixed inset-0 bg-[#283044]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 border border-[#dae2fd]/70 dark:border-slate-700 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#dae2fd]/60 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline text-xl font-bold text-[#131b2e] dark:text-white">
                Procesar Cobro
              </span>
              <span className="px-2 py-0.5 rounded bg-[#cce5ff] dark:bg-slate-800 text-[#006194] dark:text-[#93ccff] font-bold text-xs">
                Term #02
              </span>
            </div>
            <p className="text-xs text-[#3f4850] dark:text-slate-400 mt-0.5">
              Cliente: <strong className="text-[#131b2e] dark:text-slate-200">{customer.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#707881] dark:text-slate-400 hover:bg-[#eaedff] dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Prominent Banner */}
        <div className="bg-[#eaedff] dark:bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-[#dae2fd]/50 dark:border-slate-700">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#006194] dark:text-[#93ccff]">
              Total a Liquidar
            </span>
            <p className="text-xs text-[#707881] dark:text-slate-400">
              {items.length} líneas ({items.reduce((acc, i) => acc + i.quantity, 0)} unidades)
            </p>
          </div>
          <span className="font-headline text-3xl font-bold text-[#006194] dark:text-[#93ccff]">
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all border ${
              method === 'card'
                ? 'bg-[#007bb9] text-white border-[#007bb9] shadow-sm'
                : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#3f4850] dark:text-slate-300 border-transparent hover:bg-[#dae2fd] dark:hover:bg-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Tarjeta (F9)</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('cash')}
            className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all border ${
              method === 'cash'
                ? 'bg-[#006947] text-white border-[#006947] shadow-sm'
                : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#3f4850] dark:text-slate-300 border-transparent hover:bg-[#dae2fd] dark:hover:bg-slate-700'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Efectivo (F8)</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('bizum')}
            className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all border ${
              method === 'bizum'
                ? 'bg-[#0051d5] text-white border-[#0051d5] shadow-sm'
                : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#3f4850] dark:text-slate-300 border-transparent hover:bg-[#dae2fd] dark:hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Bizum POS</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('split')}
            className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all border ${
              method === 'split'
                ? 'bg-[#283044] text-white border-[#283044] shadow-sm'
                : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#3f4850] dark:text-slate-300 border-transparent hover:bg-[#dae2fd] dark:hover:bg-slate-700'
            }`}
          >
            <Split className="w-4 h-4" />
            <span>Dividir</span>
          </button>
        </div>

        {/* Dynamic Tender Options */}
        {method === 'cash' && (
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#f2f3ff] dark:bg-slate-800/80 border border-[#dae2fd]/60 dark:border-slate-700 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                Efectivo entregado por cliente:
              </span>
              <div className="flex items-center gap-1">
                {quickPills.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCashGiven(val.toFixed(2))}
                    className="px-2 py-0.5 rounded text-xs font-mono-num font-bold bg-white dark:bg-slate-700 text-[#006194] dark:text-[#93ccff] hover:bg-[#dae2fd] transition-colors shadow-xs"
                  >
                    ${val.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-num text-lg font-bold text-[#707881]">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min={total}
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                className="w-full h-12 pl-8 pr-4 rounded-xl bg-white dark:bg-slate-700 font-mono-num text-xl font-bold text-[#131b2e] dark:text-white border border-[#dae2fd] dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#006947]"
              />
            </div>

            {/* Change Due Box */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#6ffbbe]/20 border border-[#4edea3]/40">
              <span className="text-xs font-bold text-[#006947] dark:text-[#4edea3] uppercase tracking-wide">
                Cambio a devolver:
              </span>
              <span className="font-mono-num text-xl font-bold text-[#006947] dark:text-[#4edea3]">
                ${changeDue.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {method === 'card' && (
          <div className="p-4 rounded-xl bg-[#f2f3ff] dark:bg-slate-800/80 border border-[#dae2fd]/60 dark:border-slate-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#cce5ff] dark:bg-slate-700 flex items-center justify-center text-[#006194] dark:text-[#93ccff] shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#131b2e] dark:text-white">
                TPV Ingenico / Redsys Listo
              </span>
              <span className="text-xs text-[#3f4850] dark:text-slate-400">
                Pase tarjeta, chip o dispositivo contactless por el lector
              </span>
            </div>
          </div>
        )}

        {method === 'bizum' && (
          <div className="p-4 rounded-xl bg-[#f2f3ff] dark:bg-slate-800/80 border border-[#dae2fd]/60 dark:border-slate-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#dbe1ff] dark:bg-slate-700 flex items-center justify-center text-[#0051d5] dark:text-[#93ccff] shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#131b2e] dark:text-white">
                Cobro Bizum In-Store
              </span>
              <span className="text-xs text-[#3f4850] dark:text-slate-400">
                Solicitud enviada a la app bancaria del cliente
              </span>
            </div>
          </div>
        )}

        {method === 'split' && (
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#f2f3ff] dark:bg-slate-800/80 border border-[#dae2fd]/60 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#131b2e] dark:text-white">Parte en Efectivo:</span>
              <input
                type="number"
                step="0.01"
                value={splitCashPart}
                onChange={(e) => setSplitCashPart(e.target.value)}
                className="w-28 h-8 px-2 rounded bg-white dark:bg-slate-700 font-mono-num font-bold text-right"
              />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#131b2e] dark:text-white">Resto en Tarjeta:</span>
              <span className="font-mono-num font-bold text-[#007bb9]">
                ${Math.max(0, total - (parseFloat(splitCashPart) || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Master Confirmation Button */}
        <button
          onClick={handleProcessPayment}
          disabled={isProcessing || isSuccess}
          className={`w-full h-14 rounded-xl font-headline text-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${
            isSuccess
              ? 'bg-[#00855b] text-white'
              : 'bg-[#006194] hover:bg-[#007bb9] text-white'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Procesando Transacción...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle className="w-6 h-6" />
              <span>¡Venta Completada con Éxito!</span>
            </>
          ) : (
            <>
              <Receipt className="w-6 h-6" />
              <span>Confirmar y Emitir Ticket (${total.toFixed(2)})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
