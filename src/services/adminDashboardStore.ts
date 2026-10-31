import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AdminDashboardData,
  AuthEventFilter,
  AuditTableFilter,
} from '../types/adminDashboard';

const initialMockDashboardData: AdminDashboardData = {
  kpis: {
    activeSessions: {
      total: 14,
      deltaVsLastHour: 2,
      breakdownText: '9 cajeros en TPV • 3 supervisores • 2 admins',
    },
    securityEvents24h: {
      total: 7,
      breakdownText: '5 reintentos fallidos • 2 bloqueos de PIN',
      flaggedIp: 'IP 190.224.88.14',
      flaggedLocation: 'Sucursal #104',
    },
    dbLatencyAndConnections: {
      latencyMs: 28,
      status: 'Saludable',
      auxiliaryStatusText: 'ARCA: Online 99.8% • Cloudinary: 42% cuota',
    },
    apiErrorRate: {
      ratePercent: 0.04,
      errorTypeBadge: '(4xx/5xx)',
      successText: '99.96% éxito (18.4k reqs)',
      pendingOfflineCount: 0,
      sparklinePoints: [18, 17, 19, 12, 14, 7, 6],
    },
  },
  authEvents: [
    {
      id: 'EVT-10928',
      timestamp: '18:41:22',
      category: 'LOGIN_SUCCESS',
      categoryLabel: 'LOGIN_SUCCESS',
      userEmail: 'marcos.lousteau@voltacc.pos',
      roleLabel: 'Supervisor de Turno',
      terminalId: 'TPV #02 (Sucursal Central)',
      clientInfo: 'Chrome 124 / Windows 11',
      ipAddress: '190.224.88.14',
      statusBadge: {
        text: 'Sesión Iniciada',
        variant: 'success',
      },
    },
    {
      id: 'EVT-10927',
      timestamp: '18:39:05',
      category: 'ALERT',
      categoryLabel: 'ACCESO_DENEGADO (RLS)',
      userEmail: 'vendedor.temporal@voltacc.pos',
      roleLabel: 'Cajero / Ventas',
      terminalId: 'TPV #01 (Sucursal Central)',
      clientInfo: 'Firefox 125 / Ubuntu',
      ipAddress: '190.224.88.14',
      statusBadge: {
        text: 'Violación RLS',
        variant: 'error',
      },
      alertMessage: 'Intento de lectura directa a tabla financiera restringida (cash_shifts_audit). Bloqueado por Postgres RLS.',
    },
    {
      id: 'EVT-10926',
      timestamp: '18:35:48',
      category: 'TOKEN_REFRESH',
      categoryLabel: 'TOKEN_REFRESH',
      userEmail: 'lucia.gomez@voltacc.pos',
      roleLabel: 'Cajero Titular',
      terminalId: 'TPV #04 (Sucursal Norte)',
      clientInfo: 'Edge 123 / Windows 10',
      ipAddress: '181.44.12.98',
      statusBadge: {
        text: 'Token Renovado',
        variant: 'info',
      },
    },
    {
      id: 'EVT-10925',
      timestamp: '18:30:11',
      category: 'ALERT',
      categoryLabel: 'LOGIN_FAILED (PASSWORD_HASH)',
      userEmail: 'admin@voltacc.pos',
      roleLabel: 'Usuario Desconocido',
      terminalId: 'Web Backoffice',
      clientInfo: 'Safari 17 / macOS',
      ipAddress: '201.250.77.10',
      statusBadge: {
        text: 'Contraseña Incorrecta',
        variant: 'warning',
      },
      alertMessage: '3er intento fallido consecutivo. Alerta emitida a Telegram @pos_security_bot.',
    },
    {
      id: 'EVT-10924',
      timestamp: '18:24:59',
      category: 'ALERT',
      categoryLabel: 'IP_GEO_MISMATCH',
      userEmail: 'system.daemon@voltacc.pos',
      roleLabel: 'Servicio Externo',
      terminalId: 'API Gateway',
      clientInfo: 'Linux (Curl/Automated)',
      ipAddress: '45.154.255.8',
      countryCode: 'RU',
      statusBadge: {
        text: 'Origen Bloqueado',
        variant: 'error',
      },
      alertMessage: 'Acceso foráneo denegado por políticas de Geofencing RLS y Cloudflare WAF.',
    },
  ],
  arca: {
    status: 'Operativo',
    serviceName: 'Servicio Fiscal ARCA',
    environment: 'AFIP WSAA / WSFEv1',
    traExpiration: {
      hoursRemainingText: '04h 28m',
      elapsedPercent: 63,
      validityHours: 12,
      signaturePreview: 'wsaa_sig_8f3a9e...',
    },
    fecaeLatencyMs: 312,
    lastAuthorizedCae: '74192837491023',
    lastVoucherLabel: 'Factura B #0004-00018921',
    lastActionMessage: 'Aprobado sin observaciones fiscales a las 18:40:55',
    lastActionTime: '18:40:55',
  },
  cdn: {
    status: 'Óptimo',
    serviceName: 'CDN & Multimedia',
    providers: 'Cloudinary & S3 Storage',
    usedGb: 8.4,
    totalGb: 20.0,
    usedPercent: 42,
    catalogImagesCount: 1480,
    edgeCacheHitRatePercent: 99.4,
  },
  auditLogs: [
    {
      id: 'AUD-99240',
      timestamp: '18:38:09',
      tableName: 'products',
      operation: 'UPDATE',
      username: 'marcos.lousteau',
      userRole: 'Supervisor de Tienda',
      affectedRecordIdentifier: 'SKU: APP-MAG-01',
      diffSummary: {
        oldValueText: '$22.99',
        newValueText: '$24.99',
        annotationText: '(+promo activa)',
      },
      details: {
        reason: 'Ajuste de lista de precios fin de semana (Campaña MagSafe)',
        transactionIdOrDetails: 'Transaction ID: 9f0018d-4a11',
        oldRecord: {
          price: 22.99,
          stock: 18,
          promo_active: false,
        },
        newRecord: {
          price: 24.99,
          stock: 18,
          promo_active: true,
        },
      },
    },
    {
      id: 'AUD-99239',
      timestamp: '18:22:40',
      tableName: 'cash_shifts',
      operation: 'UPDATE',
      username: 'camila.vega',
      userRole: 'Cajero Titular #02',
      affectedRecordIdentifier: 'Shift #CS-104-99',
      diffSummary: {
        oldValueText: 'init: $250.00',
        newValueText: 'declared: $1,420.80',
        annotationText: '(Cierre Z)',
      },
      details: {
        reason: 'Arqueo de Caja Final (Diferencia detectada: $0.00 exacto)',
        transactionIdOrDetails: 'Shift UUID: 489c-ca1-99',
        oldRecord: {
          status: 'active',
          declared_cash: null,
          closed_at: null,
        },
        newRecord: {
          status: 'closed',
          declared_cash: 1420.8,
          closed_at: '2026-10-30T18:22:40.104Z',
        },
      },
    },
    {
      id: 'AUD-99238',
      timestamp: '18:15:02',
      tableName: 'sales',
      operation: 'VOID',
      username: 'admin.root',
      userRole: 'Super Admin',
      affectedRecordIdentifier: 'Ticket #TRX-8940',
      diffSummary: {
        oldValueText: '"completed"',
        newValueText: '"voided"',
        annotationText: '(Anulación administrativa)',
      },
      details: {
        reason: 'Error de tipeo en cobro con tarjeta doble',
        transactionIdOrDetails: 'Nota de Crédito NC-B-0004-00000412 Emitida',
        oldRecord: {
          status: 'completed',
          total_amount: 89.5,
          cae_number: '74190011283',
        },
        newRecord: {
          status: 'voided',
          voided_by: 'admin.root',
          void_reason: 'Typo checkout',
        },
      },
    },
    {
      id: 'AUD-99237',
      timestamp: '17:50:11',
      tableName: 'user_profiles',
      operation: 'INSERT',
      username: 'admin.root',
      userRole: 'Super Admin',
      affectedRecordIdentifier: 'cajero.nuevo@voltacc.pos',
      diffSummary: {
        newValueText: 'Nuevo usuario cajero enrolado',
        annotationText: '(Sucursal #104)',
      },
      details: {
        reason: 'Creación de Credencial de Terminal POS (Role assignment: Cashier Level 1)',
        transactionIdOrDetails: 'Enrolamiento inicial por Administrador',
        oldRecord: null,
        newRecord: {
          email: 'cajero.nuevo@voltacc.pos',
          role: 'cashier',
          branch_id: 'Sucursal Central #104',
          status: true,
          pin_hash: 'argon2id$v=19$m=65536...',
        },
      },
    },
  ],
};

// In-memory persistent state across queries during session
let currentDashboardData: AdminDashboardData = { ...initialMockDashboardData };

export const ADMIN_DASHBOARD_QUERY_KEY = ['admin', 'dashboard'] as const;

export function useAdminDashboardData() {
  return useQuery({
    queryKey: ADMIN_DASHBOARD_QUERY_KEY,
    queryFn: async (): Promise<AdminDashboardData> => {
      // Prepared for future: const { data } = await supabase.from(...)...
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(currentDashboardData);
        }, 150);
      });
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useRenewArcaTraMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Simulates WSAA TRA token renewal
      await new Promise((resolve) => setTimeout(resolve, 400));
      const now = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      currentDashboardData = {
        ...currentDashboardData,
        arca: {
          ...currentDashboardData.arca,
          traExpiration: {
            ...currentDashboardData.arca.traExpiration,
            hoursRemainingText: '12h 00m',
            elapsedPercent: 0,
            signaturePreview: `wsaa_sig_${Math.random().toString(36).substring(2, 8)}...`,
          },
          lastActionMessage: `TRA renovado exitosamente ante WSAA a las ${now}`,
          lastActionTime: now,
        },
      };
      return currentDashboardData.arca;
    },
    onSuccess: (updatedArca) => {
      queryClient.setQueryData<AdminDashboardData>(ADMIN_DASHBOARD_QUERY_KEY, (prev) =>
        prev ? { ...prev, arca: updatedArca } : prev
      );
    },
  });
}

export function usePingArcaWsfeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Simulates WSFEv1 FEDummy test ping
      await new Promise((resolve) => setTimeout(resolve, 350));
      const latency = Math.floor(Math.random() * 80) + 260; // 260 - 340 ms
      const now = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      currentDashboardData = {
        ...currentDashboardData,
        arca: {
          ...currentDashboardData.arca,
          fecaeLatencyMs: latency,
          lastActionMessage: `Ping WSFEv1 exitoso (${latency} ms) a las ${now}`,
          lastActionTime: now,
        },
      };
      return currentDashboardData.arca;
    },
    onSuccess: (updatedArca) => {
      queryClient.setQueryData<AdminDashboardData>(ADMIN_DASHBOARD_QUERY_KEY, (prev) =>
        prev ? { ...prev, arca: updatedArca } : prev
      );
    },
  });
}

export function filterAuthEvents(
  events: AdminDashboardData['authEvents'],
  filter: AuthEventFilter
) {
  if (filter === 'ALL') return events;
  return events.filter((e) => e.category === filter);
}

export function filterAuditLogs(
  logs: AdminDashboardData['auditLogs'],
  filter: AuditTableFilter
) {
  if (filter === 'ALL') return logs;
  return logs.filter((l) => l.tableName === filter);
}

