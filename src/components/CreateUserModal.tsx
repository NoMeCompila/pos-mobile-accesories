import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  X,
  Mail,
  User,
  Store,
  ShieldCheck,
  Package,
  UserCog,
  Phone,
  Key,
  Info,
  Save,
  PlusCircle,
} from 'lucide-react';
import { UserRole, UserProfileRecord, CreateUserInput } from '../types/auth';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: CreateUserInput | (Partial<UserProfileRecord> & { id: string })) => Promise<void>;
  editUser?: UserProfileRecord | null;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editUser,
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [branchId, setBranchId] = useState<string>('central-104');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editUser) {
      setEmail(editUser.email);
      setFirstName(editUser.firstName);
      setLastName(editUser.lastName);
      setRole(editUser.role);
      setBranchId(editUser.branchId || 'global');
      setPhone(editUser.phone || '');
      setStatus(editUser.status);
    } else {
      setEmail('');
      setFirstName('');
      setLastName('');
      setRole('cashier');
      setBranchId('central-104');
      setPhone('');
      setStatus(true);
    }
    setError(null);
  }, [editUser, isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('El correo electrónico es obligatorio.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Por favor ingrese un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editUser) {
        await onSubmit({
          id: editUser.id,
          email: cleanEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
          branchId: branchId === 'global' ? null : branchId,
          phone: phone.trim(),
          status,
        });
      } else {
        await onSubmit({
          email: cleanEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
          branchId: branchId === 'global' ? null : branchId,
          phone: phone.trim(),
          status,
        });
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al guardar el usuario.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions: { id: UserRole; label: string; code: string; icon: React.ElementType }[] = [
    { id: 'cashier', label: 'Cajero', code: 'cashier', icon: Store },
    { id: 'supervisor', label: 'Supervisor', code: 'supervisor', icon: ShieldCheck },
    { id: 'stock', label: 'Stock', code: 'stock', icon: Package },
    { id: 'admin', label: 'Admin', code: 'admin', icon: UserCog },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#283044]/50 dark:bg-black/60 backdrop-blur-sm transition-all duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#131b2e] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#dae2fd]/60 dark:border-[#283044] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex items-start justify-between bg-[#f2f3ff]/50 dark:bg-[#1a233b]/60 border-b border-[#dae2fd]/40 dark:border-[#283044]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#007bb9]/10 dark:bg-[#007bb9]/20 flex items-center justify-center text-[#007bb9] dark:text-[#93ccff] shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-headline text-xl font-bold text-[#131b2e] dark:text-white tracking-tight leading-tight">
                {editUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <p className="text-xs text-[#3f4850] dark:text-slate-400 mt-0.5">
                Registrar credenciales y perfil en Supabase (
                <code className="font-mono text-[11px] text-[#006194] dark:text-[#93ccff]">user_profiles</code>)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#707881] hover:text-[#131b2e] dark:hover:text-white hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(85vh-160px)]">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Field 1: Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#131b2e] dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>
                Correo Electrónico (Auth email) <span className="text-red-500 font-bold">*</span>
              </span>
              <span className="font-mono text-[10px] text-[#707881] lowercase">text, non-nullable</span>
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 text-[#707881] w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cajero.nuevo@voltacc.pos"
                className="w-full h-11 pl-11 pr-4 rounded-lg bg-[#f2f3ff] dark:bg-[#1a233b] text-[#131b2e] dark:text-white text-sm outline-none focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-[#007bb9] border border-transparent focus:border-[#007bb9] transition-all placeholder:text-[#707881]"
              />
            </div>
            <span className="text-[11px] text-[#3f4850] dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Info className="w-3.5 h-3.5 text-[#006194] dark:text-[#93ccff]" />
              Se enviará invitación de acceso y confirmación a esta casilla.
            </span>
          </div>

          {/* Field 2: First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#131b2e] dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Nombre (first_name)</span>
                <span className="font-mono text-[10px] text-[#707881] lowercase">nullable</span>
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 text-[#707881] w-4 h-4" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ej. Mateo"
                  className="w-full h-11 pl-11 pr-4 rounded-lg bg-[#f2f3ff] dark:bg-[#1a233b] text-[#131b2e] dark:text-white text-sm outline-none focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-[#007bb9] border border-transparent focus:border-[#007bb9] transition-all placeholder:text-[#707881]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#131b2e] dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Apellido (last_name)</span>
                <span className="font-mono text-[10px] text-[#707881] lowercase">nullable</span>
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 text-[#707881] w-4 h-4" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="ej. Rossi"
                  className="w-full h-11 pl-11 pr-4 rounded-lg bg-[#f2f3ff] dark:bg-[#1a233b] text-[#131b2e] dark:text-white text-sm outline-none focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-[#007bb9] border border-transparent focus:border-[#007bb9] transition-all placeholder:text-[#707881]"
                />
              </div>
            </div>
          </div>

          {/* Field 3: Role Selector (Segmented Cards) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#131b2e] dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>
                Rol en el Sistema (role) <span className="text-red-500 font-bold">*</span>
              </span>
              <span className="font-mono text-[10px] text-[#707881] lowercase">user_role enum</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRole(opt.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl cursor-pointer transition-all border text-center ${
                      isSelected
                        ? 'bg-[#007bb9] text-white border-[#007bb9] shadow-sm font-bold'
                        : 'bg-[#f2f3ff] dark:bg-[#1a233b] text-[#131b2e] dark:text-slate-200 border-transparent hover:bg-[#eaedff] dark:hover:bg-[#283044]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-white' : 'text-[#707881]'}`} />
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className={`font-mono text-[10px] ${isSelected ? 'text-white/80' : 'text-[#707881]'}`}>
                      {opt.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 4: Branch & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#131b2e] dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Sucursal (branch_id)</span>
                <span className="font-mono text-[10px] text-[#707881] lowercase">nullable</span>
              </label>
              <div className="relative flex items-center">
                <Store className="absolute left-3.5 text-[#707881] w-4 h-4 pointer-events-none" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full h-11 pl-11 pr-8 rounded-lg bg-[#f2f3ff] dark:bg-[#1a233b] text-[#131b2e] dark:text-white text-sm outline-none focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-[#007bb9] appearance-none cursor-pointer border border-transparent focus:border-[#007bb9]"
                >
                  <option value="central-104">Sucursal Central #104</option>
                  <option value="norte-102">Flagship Norte #102</option>
                  <option value="mall-108">Express Mall #108</option>
                  <option value="global">Acceso Global / Todas</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#131b2e] dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Teléfono (phone)</span>
                <span className="font-mono text-[10px] text-[#707881] lowercase">text, nullable</span>
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 text-[#707881] w-4 h-4" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 5432-8899"
                  className="w-full h-11 pl-11 pr-4 rounded-lg bg-[#f2f3ff] dark:bg-[#1a233b] text-[#131b2e] dark:text-white text-sm outline-none focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-[#007bb9] border border-transparent focus:border-[#007bb9] transition-all placeholder:text-[#707881] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Field 5: Initial Status Switch */}
          <div className="bg-[#f2f3ff] dark:bg-[#1a233b] p-3.5 rounded-xl flex items-center justify-between border border-[#dae2fd]/40 dark:border-[#283044]">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#131b2e] dark:text-white">Estado Inicial (status)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                  {status ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>
              <span className="text-xs text-[#3f4850] dark:text-slate-400 mt-0.5">
                El operador podrá iniciar sesión en terminales POS asignadas.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setStatus(!status)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                status ? 'bg-[#007bb9]' : 'bg-[#dae2fd] dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  status ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#dae2fd]/40 dark:border-[#283044] mt-2">
            <div className="flex items-center gap-1.5 text-[#3f4850] dark:text-slate-400">
              <Key className="w-3.5 h-3.5 text-[#006194] dark:text-[#93ccff]" />
              <span className="font-mono text-[10px]">UUID autogenerado • RLS habilitado</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-lg bg-[#007bb9] hover:bg-[#006194] text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {editUser ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Crear Usuario</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

