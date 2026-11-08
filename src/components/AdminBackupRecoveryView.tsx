import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Lock,
  X,
  Database,
  Cloud,
  Clock,
  ShieldCheck,
  Download,
  Copy,
  AlertTriangle,
  Play,
  RotateCw,
  Search,
  Filter,
  Check,
  Server,
  KeyRound,
  FileCheck2,
  HardDrive,
  Upload,
} from 'lucide-react';
import { NavigationTab } from '../types/pos';
import { useAuth } from '../context/AuthContext';

interface AdminBackupRecoveryViewProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onNavigate?: (tab: NavigationTab) => void;
}

interface SnapshotRecord {
  id: string;
  timestamp: string;
  time: string;
  type: 'cron' | 'manual';
  description: string;
  size: string;
  sha256: string;
  status: 'verified' | 'stored';
}

const INITIAL_SNAPSHOTS: SnapshotRecord[] = [
  {
    id: 'snap-1',
    timestamp: '2024-11-18',
    time: '04:00:12',
    type: 'cron',
    description: 'Dump diario automatizado de medianoche + Assets catalog',
    size: '1.42 GB',
    sha256: '7f9a2b84c7184e921d7bfa56a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    status: 'verified',
  },
  {
    id: 'snap-2',
    timestamp: '2024-11-17',
    time: '19:42:05',
    type: 'manual',
    description: 'Previo a suba de precios accesorios Q4 (Lote #418)',
    size: '1.38 GB',
    sha256: '3d5c1a89f412bc7801de98234abcedf0123456789abcdef0123456789abcdef0',
    status: 'verified',
  },
  {
    id: 'snap-3',
    timestamp: '2024-11-17',
    time: '04:00:10',
    type: 'cron',
    description: 'Dump diario automatizado de medianoche',
    size: '1.37 GB',
    sha256: '9a1f4e223b567c8901de456f789a0123456789abcdef0123456789abcdef0123',
    status: 'stored',
  },
  {
    id: 'snap-4',
    timestamp: '2024-11-15',
    time: '11:15:33',
    type: 'manual',
    description: 'Migración de esquema DDL v2.4 (Módulo Afip Facturación)',
    size: '1.35 GB',
    sha256: '4b88e1a74c239d5601fa348b67123456789abcdef0123456789abcdef0123456',
    status: 'verified',
  },
];

export const AdminBackupRecoveryView: React.FC<AdminBackupRecoveryViewProps> = () => {
  const { user } = useAuth();

  // Component states
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>(INITIAL_SNAPSHOTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual backup form
  const [snapshotReason, setSnapshotReason] = useState(
    'Previo a actualización masiva de precios por inflación - Noviembre'
  );
  const [scope, setScope] = useState('full');
  const [compression, setCompression] = useState('gzip');
  const [includeAssets, setIncludeAssets] = useState(true);
  const [generateHash, setGenerateHash] = useState(true);
  const [notifyOps, setNotifyOps] = useState(true);

  // Backup in-progress simulation
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStatusText, setBackupStatusText] = useState('');

  // Rollback critical zone
  const [restoreSourceTab, setRestoreSourceTab] = useState<'history' | 'upload'>('history');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState('snap-2');
  const [targetEnv, setTargetEnv] = useState<'staging' | 'prod'>('staging');
  const [totpCode, setTotpCode] = useState('');
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHashId(id);
    showToast(`Hash SHA-256 copiado: ${hash.substring(0, 16)}...`);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const handleTriggerBackup = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBackingUp) return;

    setIsBackingUp(true);
    setBackupProgress(0);

    const statuses = [
      'Estableciendo lock cooperativo de lectura...',
      'Extrayendo esquemas DDL y triggers...',
      'Exportando tablas de catálogo & órdenes POS...',
      'Empaquetando bucket Supabase Storage (420 MB)...',
      'Calculando digest SHA-256 criptográfico...',
      'Subiendo bloque cifrado a AWS S3 Coldline...',
    ];

    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += 14;
      if (currentPct > 100) currentPct = 100;
      setBackupProgress(currentPct);

      const statusIdx = Math.min(
        Math.floor((currentPct / 100) * statuses.length),
        statuses.length - 1
      );
      setBackupStatusText(statuses[statusIdx]);

      if (currentPct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsBackingUp(false);
          const newSnap: SnapshotRecord = {
            id: `snap-${Date.now()}`,
            timestamp: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            type: 'manual',
            description: snapshotReason || 'Snapshot manual bajo demanda',
            size: '1.42 GB',
            sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            status: 'verified',
          };
          setSnapshots((prev) => [newSnap, ...prev]);
          showToast('¡Snapshot manual generado y verificado exitosamente!');
        }, 600);
      }
    }, 250);
  };

  const handleRollback = () => {
    if (!totpCode || totpCode.trim().length < 6) {
      showToast('Ingrese el código TOTP de 6 dígitos para autorizar el rollback.');
      return;
    }

    if (targetEnv === 'prod') {
      const confirmProd = window.confirm(
        '¡ALERTA CRÍTICA!\n\nEstá a punto de realizar un ROLLBACK TOTAL SOBRE PRODUCCIÓN.\n\nEsto bloqueará transitoriamente las ventas en las terminales y reescribirá la base de datos al estado del snapshot seleccionado.\n\n¿Desea continuar?'
      );
      if (!confirmProd) return;
    }

    showToast(`Validando código TOTP con Supabase Auth...`);
    setTimeout(() => {
      showToast(
        `Protocolo de restauración inicializado en entorno: ${targetEnv.toUpperCase()}`
      );
    }, 1200);
  };

  const filteredSnapshots = snapshots.filter(
    (s) =>
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sha256.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.timestamp.includes(searchQuery)
  );

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#006194] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Context Breadcrumb & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#707881] dark:text-slate-400 uppercase tracking-wider">
                <span className="hover:text-[#006194] cursor-pointer">Admin</span>
                <span>/</span>
                <span className="hover:text-[#006194] cursor-pointer">Seguridad y Continuidad</span>
                <span>/</span>
                <span className="text-[#006194] dark:text-[#93ccff] font-bold">Backup_Recovery</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <h2 className="font-headline text-2xl lg:text-3xl font-bold tracking-tight text-[#131b2e] dark:text-white">
                  Centro de Backup y Recuperación (DR)
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  RPO Óptimo: 2h 14m
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono bg-[#eaedff] dark:bg-[#1e293b] text-[#3f4850] dark:text-slate-300">
                  <Database className="w-3.5 h-3.5 text-[#006194] dark:text-[#93ccff]" />
                  PostgreSQL 16.3
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <button
                onClick={() => showToast('Política de retención GFS activa: 30 días')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-slate-800 hover:bg-[#eaedff] dark:hover:bg-slate-800 text-[#131b2e] dark:text-slate-200 text-xs font-semibold transition-all shadow-xs"
              >
                <Clock className="w-4 h-4 text-[#006194]" />
                <span>Configurar Cron</span>
              </button>
              <button
                onClick={() => showToast('Descargando protocolo de Disaster Recovery (PDF)...')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-slate-800 hover:bg-[#eaedff] dark:hover:bg-slate-800 text-[#131b2e] dark:text-slate-200 text-xs font-semibold transition-all shadow-xs"
              >
                <FileCheck2 className="w-4 h-4 text-[#0051d5]" />
                <span>Manual DR</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: Technical DR KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white dark:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs uppercase font-semibold text-[#707881] dark:text-slate-400 tracking-wider">
                    Automated Engine
                  </span>
                  <p className="font-headline font-bold text-lg text-[#131b2e] dark:text-white mt-1">
                    Daily Dump Exitoso
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#707881] dark:text-slate-400">Último snapshot:</span>
                  <span className="font-bold text-[#131b2e] dark:text-white">Hoy, 04:00 AM UTC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#707881] dark:text-slate-400">Destino primario:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">S3 Coldline (Tier 1)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#707881] dark:text-slate-400">Retención:</span>
                  <span className="text-[#131b2e] dark:text-white">30 Días GFS</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#dae2fd]/30 dark:border-slate-800 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>PG SQL + Storage Supabase sincronizados</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white dark:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs uppercase font-semibold text-[#707881] dark:text-slate-400 tracking-wider">
                    Objetivos DR / SLA
                  </span>
                  <p className="font-headline font-bold text-lg text-[#131b2e] dark:text-white mt-1">
                    RPO: 2h 14m
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#006194]/10 text-[#006194] dark:text-[#93ccff] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#707881] dark:text-slate-400">SLA Máximo (&lt; 4h)</span>
                    <span className="font-mono font-bold text-[#006194] dark:text-[#93ccff]">55%</span>
                  </div>
                  <div className="w-full bg-[#eaedff] dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#006194] h-1.5 rounded-full" style={{ width: '55%' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-[#707881] dark:text-slate-400">RTO Restore:</span>
                  <span className="font-bold text-[#0051d5] dark:text-[#93ccff]">~8 min (Full DB)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#707881] dark:text-slate-400">Delta WAL Logs:</span>
                  <span className="text-[#131b2e] dark:text-white">14.2 MB en cola</span>
                </div>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white dark:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs uppercase font-semibold text-[#707881] dark:text-slate-400 tracking-wider">
                    Almacenamiento DR
                  </span>
                  <p className="font-headline font-bold text-lg text-[#131b2e] dark:text-white mt-1">
                    42.8 GB / 100 GB
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                  <Cloud className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#707881] dark:text-slate-400">Cuota Utilizada</span>
                    <span className="font-mono font-bold text-[#131b2e] dark:text-white">42.8%</span>
                  </div>
                  <div className="w-full bg-[#eaedff] dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#0051d5] h-1.5 rounded-full" style={{ width: '42.8%' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-[#707881] dark:text-slate-400">Último Dump Gzip:</span>
                  <span className="font-bold text-[#131b2e] dark:text-white">1.42 GB (.sql.gz)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#707881] dark:text-slate-400">Bucket Storage:</span>
                  <span className="text-[#131b2e] dark:text-white">420 MB assets</span>
                </div>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white dark:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs uppercase font-semibold text-[#707881] dark:text-slate-400 tracking-wider">
                    Validación Criptográfica
                  </span>
                  <p className="font-headline font-bold text-lg text-emerald-600 dark:text-emerald-400 mt-1">
                    100% Sin Errores
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#707881] dark:text-slate-400">Hashes SHA-256:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">30/30 Verificados</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#707881] dark:text-slate-400">Bit-rot Scans:</span>
                  <span className="text-[#131b2e] dark:text-white">0 anomalías</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#707881] dark:text-slate-400">Test en Sandbox:</span>
                  <span className="text-[#0051d5] dark:text-[#93ccff] font-medium">Ayer 23:45 OK</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#dae2fd]/30 dark:border-slate-800 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <KeyRound className="w-4 h-4" />
                <span>Firmado con llave GPG de VoltAcc</span>
              </div>
            </div>
          </section>

          {/* SECTION 2: Grid Split - Manual Snapshot Trigger Form & Architecture Topology */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Manual Generator Form (8 Cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#dae2fd]/40 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#007bb9] text-white flex items-center justify-center shadow-xs">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-lg text-[#131b2e] dark:text-white">
                      Generador de Snapshot Manual
                    </h3>
                    <p className="text-xs text-[#707881] dark:text-slate-400">
                      Crea un punto de restauración seguro e inmutable antes de realizar cambios estructurales.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#eaedff] dark:bg-slate-800 text-[#006194] dark:text-[#93ccff] font-semibold self-start sm:self-auto">
                  HOT-BACKUP (ONLINE)
                </span>
              </div>

              <form onSubmit={handleTriggerBackup} className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#707881] dark:text-slate-400 mb-1.5">
                    Nota Descriptiva / Motivo del Snapshot <span className="text-[#006194]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={snapshotReason}
                    onChange={(e) => setSnapshotReason(e.target.value)}
                    placeholder="Ej: Migración masiva, actualización de catálogo..."
                    className="w-full px-4 py-3 rounded-lg bg-[#f2f3ff] dark:bg-[#141b2d] border border-transparent focus:border-[#006194] text-sm text-[#131b2e] dark:text-white outline-none transition-all"
                  />
                  <p className="mt-1 text-[11px] text-[#707881] dark:text-slate-400">
                    Esta etiqueta quedará registrada en el hash metadata y en los logs de auditoría de Supabase.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#707881] dark:text-slate-400 mb-1.5">
                      Alcance de la Base de Datos
                    </label>
                    <select
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-lg bg-[#f2f3ff] dark:bg-[#141b2d] text-sm text-[#131b2e] dark:text-white outline-none cursor-pointer"
                    >
                      <option value="full">PostgreSQL Completo (Esquema + Tablas + Triggers + WAL)</option>
                      <option value="data-only">Solo Datos Transaccionales (Ventas, Clientes, Inventario)</option>
                      <option value="schema-only">Solo Estructura DDL (Sin Registros)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#707881] dark:text-slate-400 mb-1.5">
                      Algoritmo de Compresión
                    </label>
                    <select
                      value={compression}
                      onChange={(e) => setCompression(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-lg bg-[#f2f3ff] dark:bg-[#141b2d] text-sm text-[#131b2e] dark:text-white outline-none cursor-pointer"
                    >
                      <option value="gzip">GZIP Nivel 9 (.sql.gz) - Máxima compatibilidad</option>
                      <option value="zstd">Zstandard Ultra (.sql.zst) - Alta velocidad</option>
                      <option value="custom">Custom Archive Tarball (.tar)</option>
                    </select>
                  </div>
                </div>

                {/* Option Checkboxes */}
                <div className="p-4 rounded-lg bg-[#f2f3ff]/70 dark:bg-[#141b2d]/60 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeAssets}
                      onChange={(e) => setIncludeAssets(e.target.checked)}
                      className="w-4 h-4 rounded text-[#006194] focus:ring-[#006194] cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#131b2e] dark:text-white flex items-center gap-1.5">
                        Incluir Supabase Storage Assets (Imágenes de accesorios & comprobantes)
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#dae2fd] dark:bg-slate-800 text-[#006194] dark:text-[#93ccff]">
                          +420 MB
                        </span>
                      </span>
                      <span className="text-xs text-[#707881] dark:text-slate-400">
                        Garantiza copia de avatares, fotos de productos y tickets fiscales digitales.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={generateHash}
                      onChange={(e) => setGenerateHash(e.target.checked)}
                      className="w-4 h-4 rounded text-[#006194] focus:ring-[#006194] cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#131b2e] dark:text-white">
                        Generar Checksum Criptográfico SHA-256 & Certificado de Integridad
                      </span>
                      <span className="text-xs text-[#707881] dark:text-slate-400">
                        Calcula hash unívoco en el nodo de origen antes del envío al bucket S3.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notifyOps}
                      onChange={(e) => setNotifyOps(e.target.checked)}
                      className="w-4 h-4 rounded text-[#006194] focus:ring-[#006194] cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#131b2e] dark:text-white">
                        Notificar finalización a canal de operaciones (#pos-ops-alerts)
                      </span>
                      <span className="text-xs text-[#707881] dark:text-slate-400">
                        Envía un webhook automático al bot de Telegram/Slack del equipo técnico.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#707881] dark:text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Operación no bloqueante: Las terminales POS operan con normalidad.</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isBackingUp}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#006194] hover:bg-[#007bb9] active:scale-95 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
                  >
                    {isBackingUp ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-white" />
                    )}
                    <span>{isBackingUp ? 'Ejecutando pg_dump...' : 'Disparar Snapshot Manual Ahora'}</span>
                  </button>
                </div>

                {/* Progress Bar Container */}
                {isBackingUp && (
                  <div className="mt-4 p-4 rounded-xl bg-[#eaedff] dark:bg-[#141b2d] border border-[#006194]/30">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-[#006194] dark:text-[#93ccff] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#006194] animate-ping" />
                        Procesando pg_dump con transaccionalidad SNAPSHOT...
                      </span>
                      <span className="font-mono font-bold text-[#131b2e] dark:text-white">
                        {backupProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-[#dae2fd] dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className="bg-[#006194] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${backupProgress}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-mono text-[#707881] dark:text-slate-400">
                      {backupStatusText}
                    </p>
                  </div>
                )}
              </form>
            </div>

            {/* Architecture Topology (4 Cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#dae2fd]/40 dark:border-slate-800">
                  <h3 className="font-headline font-semibold text-base text-[#131b2e] dark:text-white">
                    Topología de Resguardo
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                    S3 REPLICATED
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="p-3 rounded-lg bg-[#f2f3ff] dark:bg-[#141b2d] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#006194] text-white flex items-center justify-center shrink-0">
                      <Server className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-[#131b2e] dark:text-white">
                          PostgreSQL Primario
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          ACTIVO
                        </span>
                      </div>
                      <p className="text-[11px] text-[#707881] dark:text-slate-400 font-mono truncate">
                        pg-master.voltacc.internal:5432
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center -my-1 text-[#707881]">
                    <span className="text-xs font-mono">↓</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#f2f3ff] dark:bg-[#141b2d] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0051d5] text-white flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-[#131b2e] dark:text-white">
                          WAL Archiver Daemon
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          STREAMING
                        </span>
                      </div>
                      <p className="text-[11px] text-[#707881] dark:text-slate-400 font-mono truncate">
                        Compresión zstd en tiempo real (1s lag)
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center -my-1 text-[#707881]">
                    <span className="text-xs font-mono">↓</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#f2f3ff] dark:bg-[#141b2d] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-[#131b2e] dark:text-white">
                          AWS S3 Coldline Vault
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          ENCRIPTADO
                        </span>
                      </div>
                      <p className="text-[11px] text-[#707881] dark:text-slate-400 font-mono truncate">
                        s3://voltacc-backups-sa-east-1/
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#dae2fd]/40 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#707881] dark:text-slate-400">
                    Prueba de Recuperación Diaria:
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    100% OK
                  </span>
                </div>
                <p className="text-[11px] text-[#707881] dark:text-slate-400 leading-relaxed">
                  Cada madrugada a las 05:00 UTC un worker efímero descarga el último dump y restaura una réplica en sandbox para verificar que el backup sea booteable.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: Historial y Repositorio de Descargas */}
          <section className="bg-white dark:bg-[#1e293b] border border-[#dae2fd]/60 dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-semibold text-lg text-[#131b2e] dark:text-white">
                    Historial de Snapshots Disponibles
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#eaedff] dark:bg-slate-800 text-[#006194] dark:text-[#93ccff] font-semibold">
                    {filteredSnapshots.length} Archivos
                  </span>
                </div>
                <p className="text-xs text-[#707881] dark:text-slate-400">
                  Repositorio criptográficamente firmado disponible para descargas y auditoría técnica.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#707881]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por hash o nota..."
                    className="pl-9 pr-3 py-1.5 rounded-lg bg-[#f2f3ff] dark:bg-[#141b2d] text-xs text-[#131b2e] dark:text-white outline-none w-48 sm:w-64"
                  />
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-2 rounded-lg bg-[#f2f3ff] dark:bg-[#141b2d] hover:bg-[#eaedff] text-[#707881] hover:text-[#131b2e] transition-colors"
                  title="Limpiar Filtro"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#dae2fd]/40 dark:border-slate-800 text-[11px] uppercase tracking-wider font-mono text-[#707881] dark:text-slate-400 bg-[#f2f3ff]/50 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Descripción / Motivo</th>
                    <th className="py-3 px-4">Tamaño</th>
                    <th className="py-3 px-4">Hash SHA-256</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dae2fd]/30 dark:divide-slate-800">
                  {filteredSnapshots.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#f2f3ff]/40 dark:hover:bg-[#141b2d]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-[#131b2e] dark:text-white whitespace-nowrap">
                        {item.timestamp}{' '}
                        <span className="text-[#707881] dark:text-slate-400">{item.time}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.type === 'cron' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#eaedff] dark:bg-slate-800 text-[#006194] dark:text-[#93ccff]">
                            <Clock className="w-3 h-3" /> Programado (Cron)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0051d5]/10 text-[#0051d5] dark:text-[#93ccff]">
                            <Play className="w-3 h-3" /> Manual (On-Demand)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#131b2e] dark:text-white max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#131b2e] dark:text-white whitespace-nowrap">
                        {item.size}
                      </td>
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <button
                          onClick={() => handleCopyHash(item.id, item.sha256)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f2f3ff] dark:bg-[#141b2d] hover:bg-[#eaedff] text-[#707881] dark:text-slate-300 font-mono text-[11px] transition-colors"
                          title="Copiar Hash SHA-256"
                        >
                          <span>sha256:{item.sha256.substring(0, 8)}...</span>
                          {copiedHashId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {item.status === 'verified' ? 'Verificado OK' : 'En resguardo S3'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              showToast(`Descargando dump ${item.id} (.sql.gz)...`)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#006194]/10 hover:bg-[#006194]/20 text-[#006194] dark:text-[#93ccff] font-medium text-xs transition-colors"
                            title="Descargar archivo .sql.gz"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>.sql.gz</span>
                          </button>
                          <button
                            onClick={() =>
                              showToast(`Hash verificado contra S3: Integridad 100% OK`)
                            }
                            className="p-1 rounded text-[#707881] hover:text-[#131b2e] dark:hover:text-white transition-colors"
                            title="Test Integridad en Vivo"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#dae2fd]/40 dark:border-slate-800 text-xs text-[#707881] dark:text-slate-400">
              <span>
                Mostrando {filteredSnapshots.length} de {snapshots.length} puntos de restauración en línea (los snapshots &gt;30 días se archivan en AWS Glacier).
              </span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  disabled
                  className="px-2.5 py-1 rounded bg-[#f2f3ff] dark:bg-[#141b2d] disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-2 font-bold text-[#131b2e] dark:text-white">1</span>
                <button
                  onClick={() => showToast('Página 2 cargada')}
                  className="px-2.5 py-1 rounded bg-[#f2f3ff] dark:bg-[#141b2d] hover:bg-[#eaedff]"
                >
                  2
                </button>
                <button
                  onClick={() => showToast('Página 3 cargada')}
                  className="px-2.5 py-1 rounded bg-[#f2f3ff] dark:bg-[#141b2d] hover:bg-[#eaedff]"
                >
                  3
                </button>
                <button
                  onClick={() => showToast('Página 2 cargada')}
                  className="px-2.5 py-1 rounded bg-[#f2f3ff] dark:bg-[#141b2d] hover:bg-[#eaedff]"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 4: Disaster Recovery Safe Zone (Rollback) */}
          <section className="bg-white dark:bg-[#1e293b] border-2 border-red-500/20 dark:border-red-500/30 rounded-xl p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#dae2fd]/40 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline font-bold text-lg text-[#131b2e] dark:text-white">
                      Zona Crítica de Restauración y Rollback
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-600 dark:text-red-400">
                      REQUIERE ELEVACIÓN 2FA
                    </span>
                  </div>
                  <p className="text-xs text-[#707881] dark:text-slate-400">
                    Procedimiento de Disaster Recovery para revertir el estado de la base de datos o clonar en sandbox.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono bg-[#f2f3ff] dark:bg-[#141b2d] px-3 py-1.5 rounded-lg text-[#131b2e] dark:text-white self-start md:self-auto">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Sesión Admin Root Validada</span>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#131b2e] dark:text-slate-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-[#131b2e] dark:text-white">
                  Advertencia de Impacto Transaccional:
                </p>
                <p className="text-[#707881] dark:text-slate-300">
                  Efectuar una restauración en <strong className="text-[#131b2e] dark:text-white">Ambiente Producción</strong> desconectará de forma inmediata todas las terminales POS en caja, cancelará las operaciones de cobro en vuelo y reescribirá la base de datos completa. Para validaciones, utilice siempre el entorno <strong className="text-[#131b2e] dark:text-white">Staging Sandbox</strong>.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Source Selection */}
              <div className="flex flex-col gap-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#707881] dark:text-slate-400">
                  1. Origen del Archivo de Recuperación
                </label>

                <div className="grid grid-cols-2 gap-2 bg-[#f2f3ff] dark:bg-[#141b2d] p-1 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setRestoreSourceTab('history')}
                    className={`py-2 rounded-md font-bold transition-all text-center ${
                      restoreSourceTab === 'history'
                        ? 'bg-white dark:bg-[#1e293b] text-[#006194] dark:text-[#93ccff] shadow-xs'
                        : 'text-[#707881] hover:text-[#131b2e] dark:hover:text-white'
                    }`}
                  >
                    Desde Historial S3
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreSourceTab('upload')}
                    className={`py-2 rounded-md font-bold transition-all text-center ${
                      restoreSourceTab === 'upload'
                        ? 'bg-white dark:bg-[#1e293b] text-[#006194] dark:text-[#93ccff] shadow-xs'
                        : 'text-[#707881] hover:text-[#131b2e] dark:hover:text-white'
                    }`}
                  >
                    Subir Archivo Externo
                  </button>
                </div>

                {restoreSourceTab === 'history' ? (
                  <div className="space-y-3">
                    <select
                      value={selectedSnapshotId}
                      onChange={(e) => setSelectedSnapshotId(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-lg bg-[#f2f3ff] dark:bg-[#141b2d] text-[#131b2e] dark:text-white text-xs outline-none cursor-pointer"
                    >
                      {snapshots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.timestamp} {s.time} - {s.description.substring(0, 45)}... ({s.size})
                        </option>
                      ))}
                    </select>
                    <div className="p-3 rounded-lg bg-[#f2f3ff]/60 dark:bg-[#141b2d]/60 flex items-center justify-between text-xs font-mono">
                      <span className="text-[#707881] dark:text-slate-400">Hash Checksum Destino:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">SHA256 Match OK</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#dae2fd] dark:border-slate-700 hover:border-[#006194] rounded-xl p-6 text-center cursor-pointer bg-[#f2f3ff]/40 dark:bg-[#141b2d]/40 transition-all">
                    <Upload className="w-8 h-8 text-[#006194] mx-auto" />
                    <p className="mt-2 text-xs font-medium text-[#131b2e] dark:text-white">
                      Arrastra tu dump .sql, .sql.gz o .tar aquí
                    </p>
                    <p className="text-[11px] text-[#707881] dark:text-slate-400 mt-0.5">
                      Límite por carga HTTP: 2.5 GB. Para archivos mayores use SCP/S3.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Destination Target & Rollback Execution */}
              <div className="flex flex-col gap-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#707881] dark:text-slate-400">
                  2. Entorno Destino & Seguridad
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`relative flex flex-col p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      targetEnv === 'staging'
                        ? 'border-[#006194] bg-[#eaedff]/30 dark:bg-[#1e293b]'
                        : 'border-transparent bg-[#f2f3ff] dark:bg-[#141b2d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#006194] dark:text-[#93ccff]">
                        Staging / Sandbox
                      </span>
                      <input
                        type="radio"
                        name="targetEnv"
                        value="staging"
                        checked={targetEnv === 'staging'}
                        onChange={() => setTargetEnv('staging')}
                        className="accent-[#006194]"
                      />
                    </div>
                    <p className="text-[11px] text-[#707881] dark:text-slate-400">
                      Crea una instancia aislada para auditar datos sin tocar POS en vivo.
                    </p>
                    <span className="mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      RECOMENDADO
                    </span>
                  </label>

                  <label
                    className={`relative flex flex-col p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      targetEnv === 'prod'
                        ? 'border-red-500 bg-red-500/5 dark:bg-[#1e293b]'
                        : 'border-transparent bg-[#f2f3ff] dark:bg-[#141b2d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">
                        PRODUCCIÓN (VIVO)
                      </span>
                      <input
                        type="radio"
                        name="targetEnv"
                        value="prod"
                        checked={targetEnv === 'prod'}
                        onChange={() => setTargetEnv('prod')}
                        className="accent-red-600"
                      />
                    </div>
                    <p className="text-[11px] text-[#707881] dark:text-slate-400">
                      Sobrescritura total destructiva. Congela terminales hasta completar.
                    </p>
                    <span className="mt-2 text-[10px] font-semibold text-red-600 dark:text-red-400">
                      ALTO IMPACTO
                    </span>
                  </label>
                </div>

                <div className="mt-auto pt-2">
                  <label className="block text-xs font-semibold text-[#707881] dark:text-slate-400 mb-1.5">
                    Código de Autenticación TOTP (Google Auth / Authy):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="000 000"
                      className="w-32 tracking-widest text-center px-3 py-2.5 rounded-lg bg-[#f2f3ff] dark:bg-[#141b2d] font-mono font-bold text-sm text-[#131b2e] dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={handleRollback}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#131b2e] hover:bg-[#283044] dark:bg-white dark:hover:bg-slate-200 text-white dark:text-[#131b2e] font-semibold text-xs tracking-wide uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                      <span>Iniciar Asistente de Rollback...</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
    </div>
  );
};
