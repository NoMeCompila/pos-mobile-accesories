import React from 'react';
import { X, Printer, Send, Check } from 'lucide-react';
import { Ticket } from '../types/pos';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, ticket }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(
      `VoltAcc POS - Ticket ${ticket.ticketNumber} emitido por $${ticket.total.toFixed(2)}. Cliente: ${ticket.customer.name}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#283044]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-md w-full shadow-2xl flex flex-col overflow-hidden border border-[#dae2fd] dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#f2f3ff] dark:bg-slate-800 border-b border-[#dae2fd]/60 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-sm text-[#131b2e] dark:text-white">
              Copia Digital de Ticket
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#6ffbbe] text-[#002113] text-[10px] font-bold uppercase">
              {ticket.status === 'refunded' ? 'Abono / Devolución' : 'Emitido'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#707881] hover:bg-[#dae2fd] dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Realistic Thermal Receipt Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-[#faf8ff] dark:bg-slate-900/60 font-mono-num text-xs text-slate-800 dark:text-slate-200">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-dashed border-[#dae2fd] dark:border-slate-700 flex flex-col gap-3">
            {/* Store Header */}
            <div className="text-center flex flex-col items-center">
              <span className="font-headline font-bold text-base text-[#131b2e] dark:text-white tracking-tight">
                VoltAcc Retail POS
              </span>
              <span className="text-[11px] text-[#707881] dark:text-slate-400">
                Downtown Flagship · Store #104
              </span>
              <span className="text-[10px] text-[#707881] dark:text-slate-400">
                Gran Vía 42, Planta 0 · NIF: B-88392019
              </span>
              <span className="text-[10px] text-[#707881] dark:text-slate-400">
                Tel: +34 912 345 678 · info@voltacc.es
              </span>
            </div>

            <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-1" />

            {/* Ticket Info */}
            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>TICKET: {ticket.ticketNumber}</span>
                <span>HORA: {ticket.time}</span>
              </div>
              <div className="flex justify-between text-[#707881] dark:text-slate-400">
                <span>FECHA: {ticket.date}</span>
                <span>TERM: #02</span>
              </div>
              <div className="flex justify-between text-[#707881] dark:text-slate-400">
                <span>CAJERO: {ticket.cashier}</span>
                <span>MOSTRADOR: 02</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-dotted border-slate-200 dark:border-slate-700 text-[#131b2e] dark:text-slate-200">
                <span>CLIENTE: {ticket.customer.name}</span>
                <span>NIF: {ticket.customer.nif}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-1" />

            {/* Itemized Table */}
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-12 text-[10px] font-bold text-[#707881] dark:text-slate-400 uppercase">
                <span className="col-span-6">Concepto</span>
                <span className="col-span-2 text-center">Cant</span>
                <span className="col-span-2 text-right">P/U</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              {ticket.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px] leading-tight">
                  <div className="col-span-6 truncate font-medium">
                    {item.productName}
                    <span className="block text-[9px] text-[#707881] dark:text-slate-400">
                      SKU: {item.sku}
                    </span>
                  </div>
                  <span className="col-span-2 text-center font-bold">{item.quantity}</span>
                  <span className="col-span-2 text-right">${item.unitPrice.toFixed(2)}</span>
                  <span className="col-span-2 text-right font-bold">${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-1" />

            {/* Financial Summary */}
            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between text-[#707881] dark:text-slate-400">
                <span>Subtotal Bruto:</span>
                <span>${ticket.subtotal.toFixed(2)}</span>
              </div>
              {ticket.discount > 0 && (
                <div className="flex justify-between text-[#006947] font-semibold">
                  <span>Descuento ({ticket.couponCode || 'Cupón'}):</span>
                  <span>-${ticket.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#707881] dark:text-slate-400">
                <span>Base Imponible:</span>
                <span>${ticket.taxableBase.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#707881] dark:text-slate-400">
                <span>IVA General (21%):</span>
                <span>${ticket.vat.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-slate-300 dark:border-slate-700 font-bold text-sm text-[#131b2e] dark:text-white">
                <span className="font-headline text-base">TOTAL:</span>
                <span className="font-headline text-xl text-[#006194] dark:text-[#93ccff]">
                  ${ticket.total.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between pt-1 text-[10px] text-[#707881] dark:text-slate-400">
                <span>Forma de Pago: {ticket.paymentMethod.toUpperCase()}</span>
                {ticket.authCode && <span>AUTH: {ticket.authCode}</span>}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-1" />

            {/* Footer QR / Barcode & Legal */}
            <div className="text-center flex flex-col items-center gap-1.5 pt-1">
              <div className="h-9 w-44 bg-slate-900 dark:bg-white/90 rounded flex items-center justify-center p-1">
                <div className="h-full w-full flex items-center justify-between px-1 bg-white dark:bg-slate-900">
                  <div className="h-full flex items-center gap-[2px]">
                    <span className="w-[2px] h-full bg-black dark:bg-white" />
                    <span className="w-[1px] h-full bg-black dark:bg-white" />
                    <span className="w-[3px] h-full bg-black dark:bg-white" />
                    <span className="w-[1px] h-full bg-black dark:bg-white" />
                    <span className="w-[2px] h-full bg-black dark:bg-white" />
                    <span className="w-[4px] h-full bg-black dark:bg-white" />
                    <span className="w-[1px] h-full bg-black dark:bg-white" />
                  </div>
                  <span className="text-[8px] font-bold tracking-widest">{ticket.ticketNumber}</span>
                </div>
              </div>
              <p className="text-[9px] text-[#707881] dark:text-slate-400 leading-tight max-w-xs">
                30 días para cambios y devoluciones presentando este comprobante. Artículos desprecintados requieren aprobación técnica.
              </p>
              <span className="text-[8px] text-[#707881] dark:text-slate-500">
                Firma Digital SHA256: e4b2..9fa0
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-[#f2f3ff] dark:bg-slate-800 border-t border-[#dae2fd]/60 dark:border-slate-700 flex items-center justify-between gap-3">
          <button
            onClick={handleShare}
            className="flex-1 h-11 rounded-xl bg-white dark:bg-slate-700 hover:bg-[#eaedff] dark:hover:bg-slate-600 text-[#131b2e] dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#dae2fd]/80 dark:border-slate-600"
          >
            {copied ? <Check className="w-4 h-4 text-[#006947]" /> : <Send className="w-4 h-4 text-[#006194]" />}
            <span>{copied ? '¡Copiado!' : 'WhatsApp / Email'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 h-11 rounded-xl bg-[#006194] hover:bg-[#007bb9] active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
