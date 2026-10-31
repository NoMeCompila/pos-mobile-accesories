import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Home,
  Store,
  Boxes,
  LockKeyhole,
  Receipt,
  Search,
  X,
  AlertCircle,
  Wrench,
  BarChart3,
  Layers,
  Users,
  UserCheck,
} from 'lucide-react';
import { NavigationTab, Ticket, Product } from './types/pos';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { POSTerminalView } from './components/POSTerminalView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { CatalogStockView } from './components/CatalogStockView';
import { CashDrawerSettlementView } from './components/CashDrawerSettlementView';
import { HomeDashboardView } from './components/HomeDashboardView';
import { ReceiptModal } from './components/ReceiptModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { LoginView } from './components/LoginView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useProducts, useCart } from './services/posStore';
import {
  canAccessRoute,
  getDefaultRouteForRole,
  normalizeRoute,
} from './middleware/rolePermissionMiddleware';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function ModulePlaceholderView({
  title,
  description,
  role,
  onBack,
}: {
  title: string;
  description: string;
  role?: string;
  onBack: () => void;
}) {
  return (
    <div className="p-8 bg-white dark:bg-[#131b2e] rounded-3xl border border-[#dae2fd]/60 dark:border-[#283044] shadow-sm max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#dae2fd]/40 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-[#131b2e] dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-[#707881] dark:text-slate-400 mt-1">{description}</p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-[#dae2fd] dark:bg-slate-800 text-[#006194] dark:text-[#93ccff]">
          Rol: {role?.toUpperCase() || 'AUTORIZADO'}
        </span>
      </div>
      <div className="p-8 rounded-2xl bg-[#faf8ff] dark:bg-slate-900/60 border border-dashed border-[#dae2fd] dark:border-slate-800 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#eaedff] dark:bg-slate-800 text-[#006194] dark:text-[#93ccff] flex items-center justify-center">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Módulo Activo y Autorizado
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Este módulo forma parte del sistema integral de retail y está verificado por el
            middleware de control de acceso RBAC.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-[#006194] hover:bg-[#007bb9] text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Volver a Terminal
        </button>
      </div>
    </div>
  );
}

function POSApp() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    const raw = window.location.hash.replace('#', '');
    return normalizeRoute(raw);
  });

  const [authAlert, setAuthAlert] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeReceiptTicket, setActiveReceiptTicket] = useState<Ticket | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isPriceCheckerOpen, setIsPriceCheckerOpen] = useState(false);
  const [priceCheckerQuery, setPriceCheckerQuery] = useState('');
  const [isTerminalLocked, setIsTerminalLocked] = useState(false);

  const { products } = useProducts();
  const { cart, total, addItem } = useCart();

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('voltacc_dark_mode');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('voltacc_dark_mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Auto-dismiss authAlert banner after 4 seconds
  useEffect(() => {
    if (!authAlert) return;
    const timer = setTimeout(() => setAuthAlert(null), 4000);
    return () => clearTimeout(timer);
  }, [authAlert]);

  // Session navigation guard & URL Hash router with Role Permission Middleware
  useEffect(() => {
    if (isLoading) return;

    const onHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');
      const targetTab = normalizeRoute(rawHash);

      if (!isAuthenticated) {
        if (targetTab !== 'login') {
          window.location.hash = 'login';
        }
        setCurrentTab('login');
        return;
      }

      // If authenticated user lands on login or empty root, route to designated default
      if (targetTab === 'login' || !rawHash || rawHash === '/') {
        const defaultRoute = getDefaultRouteForRole(user?.role);
        window.location.hash = defaultRoute;
        setCurrentTab(defaultRoute);
        return;
      }

      // Role permission check: enforce route security
      if (!canAccessRoute(user?.role, targetTab)) {
        setAuthAlert(
          'Acceso Denegado: Tu rol de usuario no tiene permisos para acceder al módulo solicitado.'
        );
        const fallback = getDefaultRouteForRole(user?.role);
        window.location.hash = fallback;
        setCurrentTab(fallback);
        return;
      }

      setAuthAlert(null);
      setCurrentTab(targetTab);
    };

    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [isAuthenticated, isLoading, user]);

  const handleNavigate = (tab: NavigationTab) => {
    if (!isAuthenticated && tab !== 'login') {
      window.location.hash = 'login';
      setCurrentTab('login');
      return;
    }

    if (isAuthenticated) {
      if (!canAccessRoute(user?.role, tab)) {
        setAuthAlert(
          'Acceso Denegado: Tu rol de usuario no tiene permisos para acceder al módulo solicitado.'
        );
        const fallback = getDefaultRouteForRole(user?.role);
        window.location.hash = fallback;
        setCurrentTab(fallback);
        return;
      }
    }

    setAuthAlert(null);
    setCurrentTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'F1') {
        e.preventDefault();
        if (currentTab !== 'pos') {
          handleNavigate('pos');
        }
        setTimeout(() => {
          document.getElementById('skuInput')?.focus();
        }, 50);
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (currentTab !== 'pos') {
          handleNavigate('pos');
        }
      } else if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
        setIsPriceCheckerOpen(false);
        setActiveReceiptTicket(null);
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab]);

  const priceCheckerResults = products.filter(
    (p) =>
      p.name.toLowerCase().includes(priceCheckerQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(priceCheckerQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 animate-pulse mb-3">
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
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Iniciando Retail POS...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || currentTab === 'login') {
    return <LoginView onLoginSuccess={() => handleNavigate(getDefaultRouteForRole(user?.role))} />;
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-[#0f172a] text-[#131b2e] dark:text-[#f8fafc] flex flex-col font-body transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main App Container */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Context & Status Bar */}
        <TopBar
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onOpenPriceChecker={() => setIsPriceCheckerOpen(true)}
          onLockTerminal={() => setIsTerminalLocked(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* Dynamic Route Canvas */}
        <main className="flex-1 pt-16 px-4 sm:px-6 py-4 max-w-[1600px] w-full mx-auto">
          {/* Unauthorized Alert Banner */}
          {authAlert && (
            <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                <span className="font-semibold">{authAlert}</span>
              </div>
              <button
                onClick={() => setAuthAlert(null)}
                className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {(currentTab === 'home' || currentTab === 'seller/home') && (
            <HomeDashboardView onNavigate={handleNavigate} />
          )}

          {currentTab === 'pos' && (
            <POSTerminalView onOpenReceipt={(ticket) => setActiveReceiptTicket(ticket)} />
          )}

          {currentTab === 'catalog' && (
            <CatalogStockView onNavigateToPOS={() => handleNavigate('pos')} />
          )}

          {currentTab === 'drawer' && <CashDrawerSettlementView />}

          {currentTab === 'history' && (
            <SalesHistoryView
              onOpenReceipt={(ticket) => setActiveReceiptTicket(ticket)}
              onNavigateToDrawer={() => handleNavigate('drawer')}
            />
          )}

          {currentTab === 'workshop' && (
            <ModulePlaceholderView
              title="Taller de Reparaciones y Servicios Técnicos"
              description="Diagnóstico, órdenes de servicio, control de repuestos y estados de entrega de equipos."
              role={user?.role}
              onBack={() => handleNavigate(getDefaultRouteForRole(user?.role))}
            />
          )}

          {currentTab === 'reports/financial' && (
            <ModulePlaceholderView
              title="Consolidados y Reportes Financieros"
              description="Libro IVA Ventas, totales de recaudación por turno, cierre Z y exportación contable."
              role={user?.role}
              onBack={() => handleNavigate(getDefaultRouteForRole(user?.role))}
            />
          )}

          {currentTab === 'inventory/costs' && (
            <ModulePlaceholderView
              title="Costos de Compra y Proveedores Mayoristas"
              description="Márgenes de ganancia, costos mayoristas de reposición y cuentas corrientes de proveedores."
              role={user?.role}
              onBack={() => handleNavigate(getDefaultRouteForRole(user?.role))}
            />
          )}

          {currentTab === 'settings/users' && (
            <ModulePlaceholderView
              title="Gestión de Operadores y Permisos RBAC"
              description="Administración de perfiles de cajeros, asignación de sucursales y control de accesos."
              role={user?.role}
              onBack={() => handleNavigate(getDefaultRouteForRole(user?.role))}
            />
          )}

          {currentTab === 'customer/orders' && (
            <ModulePlaceholderView
              title="Portal de Seguimiento del Cliente"
              description="Consulta del estado de reparación de dispositivos móviles mediante código de seguimiento."
              role={user?.role}
              onBack={() => handleNavigate(getDefaultRouteForRole(user?.role))}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#faf8ff]/95 dark:bg-[#131b2e]/95 backdrop-blur-xl border-t border-[#dae2fd]/60 dark:border-[#283044] z-40 flex items-center justify-around px-2 lg:hidden shadow-lg">
          {[
            { id: 'home' as NavigationTab, label: 'Home', icon: Home },
            { id: 'pos' as NavigationTab, label: 'Venta', icon: Store },
            { id: 'catalog' as NavigationTab, label: 'Catálogo', icon: Boxes },
            { id: 'drawer' as NavigationTab, label: 'Caja', icon: LockKeyhole },
            { id: 'history' as NavigationTab, label: 'Historial', icon: Receipt },
          ]
            .filter((tab) => canAccessRoute(user?.role, tab.id))
            .map((tab) => {
              const Icon = tab.icon;
              const isActive =
                currentTab === tab.id || (tab.id === 'home' && currentTab === 'seller/home');
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavigate(tab.id)}
                  className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                    isActive
                      ? 'text-[#006194] dark:text-[#93ccff] font-bold'
                      : 'text-[#707881] dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
                </button>
              );
            })}
        </nav>
      </div>

      {/* Terminal Lock Screen Overlay */}
      {isTerminalLocked && (
        <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#ffdad6] dark:bg-slate-800 text-[#ba1a1a] flex items-center justify-center">
              <LockKeyhole className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-headline text-xl font-bold text-[#131b2e] dark:text-white">
                Terminal Bloqueada
              </h3>
              <p className="text-xs text-[#707881] dark:text-slate-400 mt-1">
                Operador: {user?.displayName || 'Caja 02'} • Rol: {user?.role || 'Cajero'}
              </p>
            </div>
            <button
              onClick={() => setIsTerminalLocked(false)}
              className="w-full h-11 rounded-xl bg-[#006194] text-white font-bold text-sm shadow-md hover:bg-[#007bb9] cursor-pointer"
            >
              Desbloquear Terminal
            </button>
          </div>
        </div>
      )}

      {/* Price / SKU Checker Modal */}
      {isPriceCheckerOpen && (
        <div className="fixed inset-0 bg-[#283044]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-[#dae2fd]/70 dark:border-slate-700">
            <div className="flex items-center justify-between pb-2 border-b border-[#dae2fd]/60 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-[#006194]" />
                <h3 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                  Verificador de Precios
                </h3>
              </div>
              <button
                onClick={() => setIsPriceCheckerOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#707881] hover:bg-[#eaedff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Escanee o teclee nombre / SKU..."
              value={priceCheckerQuery}
              onChange={(e) => setPriceCheckerQuery(e.target.value)}
              className="h-11 px-3.5 rounded-xl bg-[#f2f3ff] dark:bg-slate-800 text-sm border border-[#dae2fd] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006194]"
            />

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
              {priceCheckerResults.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg bg-[#faf8ff] dark:bg-slate-800/80 border border-[#dae2fd]/60 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-semibold text-[#131b2e] dark:text-white truncate">
                      {p.name}
                    </span>
                    <span className="font-mono-num text-[10px] text-[#707881]">
                      {p.sku} • Stock: {p.stock} uds ({p.location})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-base text-[#006194] dark:text-[#93ccff]">
                      ${p.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        addItem(p, 1);
                        setIsPriceCheckerOpen(false);
                      }}
                      className="px-2 py-1 rounded bg-[#006194] text-white text-[10px] font-bold"
                    >
                      + Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Preview Modal */}
      <ReceiptModal
        isOpen={Boolean(activeReceiptTicket)}
        onClose={() => setActiveReceiptTicket(null)}
        ticket={activeReceiptTicket}
      />

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <POSApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}
