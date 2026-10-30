import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  XCircle,
  ShieldCheck,
  Wifi,
  Cloud,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login, defaultRememberDevice } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('vendedor');
  const [passKey, setPassKey] = useState('');
  const [rememberDevice, setRememberDevice] = useState(defaultRememberDevice);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; passKey?: string }>({});
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passKeyInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts listener: F1 focuses user, F2 focuses password
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        identifierInputRef.current?.focus();
        identifierInputRef.current?.select();
      } else if (e.key === 'F2') {
        e.preventDefault();
        passKeyInputRef.current?.focus();
        passKeyInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const validate = (): boolean => {
    const errors: { identifier?: string; passKey?: string } = {};
    if (!identifier.trim()) {
      errors.identifier = 'El usuario o ID es requerido';
    }
    if (!passKey.trim()) {
      errors.passKey = 'La contraseña operativa es requerida';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        identifier: identifier.trim(),
        passKey: passKey.trim(),
        rememberDevice,
      });
      showToast('success', 'Sesión iniciada con éxito');
      onLoginSuccess?.();
    } catch (err: unknown) {
      const errorText =
        err instanceof Error
          ? err.message
          : 'Credenciales inválidas. Verifique su usuario y contraseña';
      setErrorMessage(errorText);
      showToast('error', errorText);
      // As per Acceptance Criteria: clear password input while retaining username
      setPassKey('');
      setTimeout(() => {
        passKeyInputRef.current?.focus();
      }, 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden transition-colors duration-200">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-[460px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-blue-900/5 dark:shadow-none p-6 sm:p-8 backdrop-blur-sm">
          {/* Card Top Badges */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Terminal #04 • Flagship Central</span>
            </div>

            <div className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>TLS 1.3</span>
            </div>
          </div>

          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 mb-3">
              {/* POS Cash Register Icon */}
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="12" x="2" y="8" rx="2" />
                <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
                <path d="M6 12h12" />
                <circle cx="8" cy="15" r="1" />
                <circle cx="12" cy="15" r="1" />
                <circle cx="16" cy="15" r="1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Retail POS
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Acceso al Sistema • Kinetic v4.2
            </p>
          </div>

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Operator ID Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="operator-id"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Usuario o ID de Operador
                </label>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  F1
                </span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  ref={identifierInputRef}
                  id="operator-id"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (fieldErrors.identifier) {
                      setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
                    }
                  }}
                  placeholder="ej. usuario@tienda.com o ID #1042"
                  autoComplete="username"
                  className={`w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl border ${
                    fieldErrors.identifier
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                  } bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 transition-all`}
                />
                {identifier.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('');
                      identifierInputRef.current?.focus();
                    }}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                    aria-label="Limpiar usuario"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              {fieldErrors.identifier && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                  {fieldErrors.identifier}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="passkey"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Contraseña Operativa
                </label>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  F2
                </span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  ref={passKeyInputRef}
                  id="passkey"
                  type={showPassword ? 'text' : 'password'}
                  value={passKey}
                  onChange={(e) => {
                    setPassKey(e.target.value);
                    if (fieldErrors.passKey) {
                      setFieldErrors((prev) => ({ ...prev, passKey: undefined }));
                    }
                  }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className={`w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl border ${
                    fieldErrors.passKey
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                  } bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 transition-all font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.passKey && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                  {fieldErrors.passKey}
                </p>
              )}
            </div>

            {/* Remember Terminal Checkbox & Forgot Password Link */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-medium">Recordar terminal</span>
              </label>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold min-h-[44px] flex items-center cursor-pointer"
              >
                ¿Olvidaste tu clave?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all focus:ring-4 focus:ring-blue-500/20 cursor-pointer"
            >
              <span>{isSubmitting ? 'Verificando...' : 'Entrar al Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer System Telemetry */}
      <footer className="w-full max-w-[500px] text-center mt-6 z-10">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <Cloud className="w-3.5 h-3.5" />
            Nube Sincronizada
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <Wifi className="w-3.5 h-3.5 text-slate-400" />
            Ping 24ms
          </span>
          <span className="font-mono text-slate-400 dark:text-slate-500 font-semibold">
            ID: KPOS-REG-04
          </span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          Kinetic POS Retail Cloud System © 2025. Todos los derechos reservados.
        </p>
      </footer>

      {/* Password Reset Helper Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <HelpCircle className="w-5 h-5" />
                <span>Restablecer Clave Operativa</span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Por políticas de seguridad del terminal físico, las claves operativas no se restablecen
              en línea. Contacte al Administrador o Supervisor de la sucursal para generar un PIN de
              desbloqueo temporal.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono">
              Terminal: KPOS-REG-04 (Flagship Central)
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
