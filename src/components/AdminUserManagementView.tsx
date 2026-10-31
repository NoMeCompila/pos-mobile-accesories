import React, { useState, useMemo } from 'react';
import {
  Zap,
  BarChart3,
  UserCog,
  RotateCcw,
  Sliders,
  Store,
  Monitor,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  X,
  Database,
  RefreshCw,
  Download,
  UserPlus,
  Copy,
  Check,
  Edit2,
  LogOut,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../services/userStore';
import { UserProfileRecord, UserRole } from '../types/auth';
import { NavigationTab } from '../types/pos';
import { CreateUserModal } from './CreateUserModal';

interface AdminUserManagementViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const AdminUserManagementView: React.FC<AdminUserManagementViewProps> = ({
  darkMode,
  onToggleDarkMode,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const { users, createUser, updateUser, toggleUserStatus } = useUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSchemaCard, setShowSchemaCard] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfileRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Mobile drawer state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Copy UUID
  const handleCopyUuid = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopiedId(uuid);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sync simulation
  const handleSyncAuth = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncToast('Auth sincronizado correctamente con Supabase Mock');
      setTimeout(() => setSyncToast(null), 3000);
    }, 600);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Email', 'Nombre', 'Apellido', 'Rol', 'Sucursal', 'Teléfono', 'Estado', 'Creado'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.email,
      u.firstName,
      u.lastName,
      u.role,
      u.branchName || 'Global',
      u.phone || '',
      u.status ? 'Activo' : 'Inactivo',
      u.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `voltacc_usuarios_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.status).length;
  const inactiveUsersCount = totalUsersCount - activeUsersCount;
  const cashiersCount = users.filter((u) => u.role === 'cashier').length;
  const activeShiftCount = Math.min(activeUsersCount, 4); // Simulated active sessions

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = `${u.firstName} ${u.lastName}`.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesPhone = (u.phone || '').toLowerCase().includes(q);
        const matchesId = u.id.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesId) return false;
      }

      // Role filter
      if (roleFilter !== 'all') {
        if (u.role !== roleFilter) return false;
      }

      // Branch filter
      if (branchFilter !== 'all') {
        if (branchFilter === 'global') {
          if (u.branchId !== null) return false;
        } else if (u.branchId !== branchFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && !u.status) return false;
        if (statusFilter === 'inactive' && u.status) return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, branchFilter, statusFilter]);

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-[#dae2fd] dark:bg-[#1e293b] text-[#006194] dark:text-[#93ccff] border-[#006194]/20';
      case 'cashier':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
      case 'supervisor':
        return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
      case 'stock':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20';
      default:
        return 'bg-[#f2f3ff] dark:bg-slate-800 text-[#3f4850] dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-[#0b0f19] text-[#131b2e] dark:text-white flex">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#007bb9] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-[#283044]/50 backdrop-blur-xs z-50 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Left Icon-Rail Sidebar (80px / w-20) */}
      <aside
        className={`fixed left-0 top-0 h-full w-20 bg-white dark:bg-[#131b2e] border-r border-[#dae2fd]/60 dark:border-[#283044] z-50 flex flex-col items-center py-4 shadow-xs transition-transform duration-300 ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-1.5 w-full pb-4 border-b border-[#dae2fd]/40 dark:border-[#283044] mb-3">
          <div
            onClick={() => onNavigate('admin/home')}
            className="w-10 h-10 rounded-xl bg-[#007bb9] flex items-center justify-center text-white shadow-sm cursor-pointer"
            title="VoltAcc POS"
          >
            <Zap className="w-5 h-5 fill-white" />
          </div>
        </div>

        {/* Navigation Icon Rail */}
        <nav className="flex-1 w-full px-2 flex flex-col items-center gap-2">
          {/* Tab 1: Resumen y Logs */}
          <button
            onClick={() => onNavigate('admin/home')}
            className="w-12 h-12 flex items-center justify-center rounded-xl text-[#707881] hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white transition-all cursor-pointer"
            title="Resumen y Logs"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {/* Active Tab: Gestión de Usuarios */}
          <button
            onClick={() => onNavigate('admin/users')}
            className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-[#007bb9] text-white font-bold shadow-sm transition-all cursor-pointer"
            title="Gestión de Usuarios (Activo)"
          >
            <UserCog className="w-5 h-5" />
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#006194] rounded-r-full" />
          </button>

          <button
            className="w-12 h-12 flex items-center justify-center rounded-xl text-[#707881] hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white transition-all cursor-pointer"
            title="Backup & Restore"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            className="w-12 h-12 flex items-center justify-center rounded-xl text-[#707881] hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white transition-all cursor-pointer"
            title="Configuración"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </nav>

        {/* Bottom Rail Actions */}
        <div className="flex flex-col items-center gap-3 w-full pt-4 border-t border-[#dae2fd]/40 dark:border-[#283044] mt-auto">
          {/* DB Ping Dot Indicator */}
          <div
            className="w-9 h-9 rounded-xl bg-[#f2f3ff] dark:bg-[#1a233b] flex items-center justify-center text-emerald-600 dark:text-emerald-400 cursor-help"
            title="Supabase PostgreSQL Conectado (Mock 24ms)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-10 h-10 rounded-xl text-[#707881] hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Alternar Modo Oscuro"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Logout Action */}
          <button
            onClick={logout}
            className="w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar Sesión Administrador"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Administrative Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-20 min-h-screen">
        {/* Fixed Admin Header */}
        <header className="fixed top-0 left-0 lg:left-20 right-0 h-16 bg-white/90 dark:bg-[#131b2e]/90 backdrop-blur-xl border-b border-[#dae2fd]/60 dark:border-[#283044] shadow-xs z-40 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 rounded-lg text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-[#1e293b]"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <h1 className="font-headline text-base sm:text-lg font-bold text-[#131b2e] dark:text-white">
                VoltAcc Retail POS
              </h1>
              <span className="text-[#dae2fd] dark:text-[#283044] hidden sm:inline">•</span>
              <span className="text-sm text-[#3f4850] dark:text-slate-400 font-medium hidden sm:inline">
                Portal Administrador
              </span>
            </div>
            <span className="text-[10px] bg-[#006194] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider hidden md:inline-block">
              Super Admin
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 bg-[#f2f3ff] dark:bg-[#1a233b] px-3 py-1.5 rounded-lg border border-[#dae2fd]/40 dark:border-[#283044]">
              <Store className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-[#707881] uppercase tracking-wider">Sucursal</span>
                <span className="font-mono text-xs text-[#131b2e] dark:text-white font-semibold">
                  Sucursal Central #01
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 bg-[#f2f3ff] dark:bg-[#1a233b] px-3 py-1.5 rounded-lg border border-[#dae2fd]/40 dark:border-[#283044]">
              <Monitor className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-[#707881] uppercase tracking-wider">Terminal</span>
                <span className="font-mono text-xs text-[#131b2e] dark:text-white font-semibold">
                  TERM-MAIN-04
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                En Línea
              </span>
            </div>

            {/* Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#dae2fd]/50 dark:border-[#283044]">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-semibold text-[#131b2e] dark:text-white leading-tight">
                  {user?.displayName || 'Admin root'}
                </span>
                <span className="font-mono text-[10px] text-[#707881]">root@voltacc.pos</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#006194] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                AR
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="w-full pt-20 px-4 sm:px-8 pb-16 flex-1 max-w-7xl mx-auto">
          {/* Top Title & Quick Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#707881] uppercase tracking-wider">
                <span>Admin</span>
                <span>/</span>
                <span className="text-[#006194] dark:text-[#93ccff] font-semibold">Gestión de Usuarios</span>
                <span>/</span>
                <span className="bg-[#eaedff] dark:bg-[#1a233b] px-1.5 py-0.5 rounded text-[#131b2e] dark:text-white">
                  public.user_profiles
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#131b2e] dark:text-white">
                  Gestión de Usuarios
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Supabase PostgreSQL • Conectado</span>
                </div>
              </div>
            </div>

            {/* Global Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleSyncAuth}
                disabled={isSyncing}
                className="h-10 px-3.5 rounded-lg bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-slate-200 hover:bg-[#f2f3ff] dark:hover:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-[#283044] shadow-xs flex items-center gap-2 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 text-[#006194] dark:text-[#93ccff] ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sincronizar Auth</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="h-10 px-3.5 rounded-lg bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-slate-200 hover:bg-[#f2f3ff] dark:hover:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-[#283044] shadow-xs flex items-center gap-2 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#707881]" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsModalOpen(true);
                }}
                className="h-10 px-4 rounded-lg bg-[#006194] hover:bg-[#007bb9] text-white shadow-sm flex items-center gap-2 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Nuevo Usuario</span>
              </button>
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {/* KPI 1 */}
            <div className="bg-white dark:bg-[#131b2e] rounded-xl p-4 shadow-xs border border-[#dae2fd]/50 dark:border-[#283044] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881]">Total Usuarios</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline text-2xl font-bold text-[#131b2e] dark:text-white">
                    {totalUsersCount}
                  </span>
                  <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    100% auth.users
                  </span>
                </div>
                <span className="text-xs text-[#707881] mt-1">
                  Schema <code className="font-mono text-[#006194] dark:text-[#93ccff]">user_profiles</code>
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#f2f3ff] dark:bg-[#1a233b] flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white dark:bg-[#131b2e] rounded-xl p-4 shadow-xs border border-[#dae2fd]/50 dark:border-[#283044] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881]">Usuarios Activos</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {activeUsersCount}
                  </span>
                  <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    status = true
                  </span>
                </div>
                <span className="text-xs text-[#707881] mt-1">{inactiveUsersCount} inactivos / suspendidos</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white dark:bg-[#131b2e] rounded-xl p-4 shadow-xs border border-[#dae2fd]/50 dark:border-[#283044] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881]">Cajeros & Terminales</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline text-2xl font-bold text-[#131b2e] dark:text-white">
                    {cashiersCount}
                  </span>
                  <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    role = cashier
                  </span>
                </div>
                <span className="text-xs text-[#707881] mt-1">Asignados a POS locales</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Store className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white dark:bg-[#131b2e] rounded-xl p-4 shadow-xs border border-[#dae2fd]/50 dark:border-[#283044] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881]">En Turno Ahora</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline text-2xl font-bold text-[#006194] dark:text-[#93ccff]">
                    {activeShiftCount}
                  </span>
                  <span className="font-mono text-[11px] text-[#006194] dark:text-[#93ccff] font-semibold">
                    Sesiones activas
                  </span>
                </div>
                <span className="text-xs text-[#707881] mt-1">En sucursales abiertas</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#cce5ff] dark:bg-[#004b73] flex items-center justify-center text-[#001d31] dark:text-[#cce5ff]">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter & Query Bar */}
          <div className="bg-white dark:bg-[#131b2e] p-3.5 rounded-xl shadow-xs border border-[#dae2fd]/50 dark:border-[#283044] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707881] w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, email, teléfono o UUID..."
                className="w-full h-10 pl-10 pr-9 rounded-lg bg-[#f2f3ff] dark:bg-[#1a233b] text-[#131b2e] dark:text-white text-xs outline-none focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-[#007bb9] transition-all placeholder:text-[#707881]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707881] hover:text-[#131b2e] dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-[#1a233b] text-[#131b2e] dark:text-white text-xs outline-none cursor-pointer border border-transparent hover:border-[#dae2fd] dark:hover:border-[#283044]"
              >
                <option value="all">Rol: Todos</option>
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
                <option value="cashier">Cajero (POS)</option>
                <option value="stock">Encargado Stock</option>
                <option value="seller">Vendedor</option>
              </select>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-[#1a233b] text-[#131b2e] dark:text-white text-xs outline-none cursor-pointer border border-transparent hover:border-[#dae2fd] dark:hover:border-[#283044]"
              >
                <option value="all">Sucursal: Todas</option>
                <option value="central-104">Sucursal Central #104</option>
                <option value="norte-102">Flagship Norte #102</option>
                <option value="mall-108">Express Mall #108</option>
                <option value="global">Acceso Global (Sin asignar)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-[#1a233b] text-[#131b2e] dark:text-white text-xs outline-none cursor-pointer border border-transparent hover:border-[#dae2fd] dark:hover:border-[#283044]"
              >
                <option value="all">Estado: Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>

              {/* Schema Inspector Toggle Button */}
              <button
                onClick={() => setShowSchemaCard(!showSchemaCard)}
                className={`h-10 px-3 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer border ${
                  showSchemaCard
                    ? 'bg-[#007bb9] text-white border-[#007bb9]'
                    : 'bg-[#eaedff] dark:bg-[#1a233b] text-[#131b2e] dark:text-slate-200 border-transparent hover:bg-[#dae2fd]'
                }`}
                title="Ver estructura de columnas Supabase"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Cols Schema (10)</span>
              </button>
            </div>
          </div>

          {/* Collapsible Schema Inspector Banner */}
          {showSchemaCard && (
            <div className="bg-[#f2f3ff] dark:bg-[#1a233b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-[#283044] mb-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#dae2fd]/50 dark:border-[#283044]">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
                  <span className="font-headline text-xs font-bold text-[#131b2e] dark:text-white uppercase tracking-wide">
                    Esquema SQL user_profiles (Postgres 17)
                  </span>
                  <span className="font-mono text-[10px] bg-[#006194] text-white px-2 py-0.5 rounded font-semibold">
                    RLS: Enabled
                  </span>
                </div>
                <button
                  onClick={() => setShowSchemaCard(false)}
                  className="text-[#707881] hover:text-[#131b2e] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-white dark:bg-[#131b2e] rounded border border-[#dae2fd]/40 dark:border-[#283044] flex flex-col">
                  <span className="font-semibold text-[#006194] dark:text-[#93ccff]">id</span>
                  <span className="text-[#707881] text-[10px]">uuid • PRIMARY • FK</span>
                </div>
                <div className="p-2 bg-white dark:bg-[#131b2e] rounded border border-[#dae2fd]/40 dark:border-[#283044] flex flex-col">
                  <span className="font-semibold">email</span>
                  <span className="text-[#707881] text-[10px]">text • NON-NULLABLE</span>
                </div>
                <div className="p-2 bg-white dark:bg-[#131b2e] rounded border border-[#dae2fd]/40 dark:border-[#283044] flex flex-col">
                  <span className="font-semibold">first_name, last_name</span>
                  <span className="text-[#707881] text-[10px]">text • NULLABLE</span>
                </div>
                <div className="p-2 bg-white dark:bg-[#131b2e] rounded border border-[#dae2fd]/40 dark:border-[#283044] flex flex-col">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">role</span>
                  <span className="text-[#707881] text-[10px]">user_role enum • NON-NULL</span>
                </div>
                <div className="p-2 bg-white dark:bg-[#131b2e] rounded border border-[#dae2fd]/40 dark:border-[#283044] flex flex-col">
                  <span className="font-semibold">branch_id</span>
                  <span className="text-[#707881] text-[10px]">uuid • NULLABLE</span>
                </div>
                <div className="p-2 bg-white dark:bg-[#131b2e] rounded border border-[#dae2fd]/40 dark:border-[#283044] flex flex-col">
                  <span className="font-semibold">phone</span>
                  <span className="text-[#707881] text-[10px]">text • NULLABLE</span>
                </div>
                <div className="p-2 bg-white dark:bg-[#131b2e] rounded border border-[#dae2fd]/40 dark:border-[#283044] flex flex-col">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">status</span>
                  <span className="text-[#707881] text-[10px]">bool • NON-NULLABLE</span>
                </div>
                <div className="p-2 bg-white dark:bg-[#131b2e] rounded border border-[#dae2fd]/40 dark:border-[#283044] flex flex-col">
                  <span className="font-semibold">created_at</span>
                  <span className="text-[#707881] text-[10px]">timestamptz • NON-NULL</span>
                </div>
                <div className="p-2 bg-white dark:bg-[#131b2e] rounded border border-[#dae2fd]/40 dark:border-[#283044] flex flex-col">
                  <span className="font-semibold">updated_at</span>
                  <span className="text-[#707881] text-[10px]">timestamptz • NON-NULL</span>
                </div>
                <div className="p-2 bg-[#cce5ff] dark:bg-[#004b73] rounded flex items-center justify-center text-[#001d31] dark:text-[#cce5ff] font-bold text-[11px]">
                  10 Columnas Totales
                </div>
              </div>
            </div>
          )}

          {/* User Data Table Card */}
          <div className="bg-white dark:bg-[#131b2e] rounded-xl shadow-xs border border-[#dae2fd]/50 dark:border-[#283044] overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-[#f2f3ff] dark:bg-[#1a233b] text-[#707881] uppercase tracking-wider font-bold text-[10px] border-b border-[#dae2fd]/50 dark:border-[#283044]">
                    <th className="py-3 px-4">Usuario / Identidad Auth</th>
                    <th className="py-3 px-4">Rol (user_role)</th>
                    <th className="py-3 px-4">Sucursal (branch_id)</th>
                    <th className="py-3 px-4">Teléfono (phone)</th>
                    <th className="py-3 px-4">Estado (status)</th>
                    <th className="py-3 px-4">Fechas (Timestamps)</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dae2fd]/40 dark:divide-[#283044] text-[#131b2e] dark:text-slate-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#707881]">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold text-sm">No se encontraron usuarios</p>
                        <p className="text-xs mt-0.5">Intente modificar los filtros o el texto de búsqueda</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.email === user?.username || u.id === 'usr-admin-root';
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-[#f2f3ff]/60 dark:hover:bg-[#1a233b]/60 transition-colors"
                        >
                          {/* User / Auth Identity */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-[220px]">
                              <div className="w-9 h-9 rounded-full bg-[#007bb9] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                                {u.avatarInitials}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[#131b2e] dark:text-white leading-tight">
                                    {u.firstName} {u.lastName}
                                  </span>
                                  {u.role === 'admin' && (
                                    <span
                                      className="w-1.5 h-1.5 rounded-full bg-[#007bb9]"
                                      title="Superadministrador"
                                    />
                                  )}
                                </div>
                                <span className="text-[11px] text-[#707881]">{u.email}</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <code className="font-mono text-[9px] text-[#707881]">
                                    {u.id.slice(0, 14)}...
                                  </code>
                                  <button
                                    onClick={() => handleCopyUuid(u.id)}
                                    className="text-[#707881] hover:text-[#006194] dark:hover:text-[#93ccff] cursor-pointer"
                                    title="Copiar UUID"
                                  >
                                    {copiedId === u.id ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getRoleBadgeStyle(
                                u.role
                              )}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {u.role}
                            </span>
                          </td>

                          {/* Branch */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-[12px]">{u.branchName || 'Acceso Global'}</span>
                              <span className="font-mono text-[9px] text-[#707881]">
                                {u.branchId ? `branch_id: ${u.branchId}` : 'branch_id: NULL (Global)'}
                              </span>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] text-[#707881]">
                              {u.phone || '—'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              disabled={isSelf}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold transition-all cursor-pointer ${
                                u.status
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                                  : 'bg-red-500/15 text-red-700 dark:text-red-300 hover:bg-red-500/25'
                              } ${isSelf ? 'opacity-70 cursor-not-allowed' : ''}`}
                              title={isSelf ? 'No puedes deshabilitar tu propio usuario' : 'Haga clic para alternar estado'}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${u.status ? 'bg-emerald-500' : 'bg-red-500'}`}
                              />
                              <span>{u.status ? 'Activo' : 'Inactivo'}</span>
                            </button>
                          </td>

                          {/* Timestamps */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col font-mono text-[10px] text-[#707881]">
                              <span>Creado: {new Date(u.createdAt).toLocaleDateString('es-AR')}</span>
                              <span className="text-[9px] opacity-80">
                                Upd: {new Date(u.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setIsModalOpen(true);
                              }}
                              className="h-7 px-2.5 rounded-md bg-[#f2f3ff] dark:bg-[#1a233b] hover:bg-[#eaedff] dark:hover:bg-[#283044] text-[#131b2e] dark:text-white font-semibold inline-flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-[#707881]" />
                              <span>Editar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary Row */}
            <div className="p-3 bg-[#f2f3ff]/60 dark:bg-[#1a233b]/60 border-t border-[#dae2fd]/40 dark:border-[#283044] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#707881]">
              <span className="font-mono text-[11px]">
                Mostrando {filteredUsers.length} de {totalUsersCount} usuarios registrados
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-[#006194] dark:text-[#93ccff]">
                  ● Row Level Security (RLS) activo
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create / Edit User Modal */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={async (data) => {
          if ('id' in data && data.id) {
            await updateUser(data as Partial<UserProfileRecord> & { id: string });
          } else {
            await createUser(data as any);
          }
        }}
        editUser={editingUser}
      />
    </div>
  );
};

