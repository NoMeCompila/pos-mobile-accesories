export interface SystemHealthKpis {
  activeSessions: {
    total: number;
    deltaVsLastHour: number;
    breakdownText: string;
  };
  securityEvents24h: {
    total: number;
    breakdownText: string;
    flaggedIp: string;
    flaggedLocation: string;
  };
  dbLatencyAndConnections: {
    latencyMs: number;
    status: 'Saludable' | 'Degradado' | 'Crítico';
    auxiliaryStatusText: string;
  };
  apiErrorRate: {
    ratePercent: number;
    errorTypeBadge: string;
    successText: string;
    pendingOfflineCount: number;
    sparklinePoints: number[];
  };
}

export type AuthEventCategory = 'LOGIN_SUCCESS' | 'TOKEN_REFRESH' | 'ALERT';
export type AuthEventFilter = 'ALL' | 'ALERT' | 'LOGIN_SUCCESS' | 'TOKEN_REFRESH';

export interface AuthAuditEvent {
  id: string;
  timestamp: string;
  category: AuthEventCategory;
  categoryLabel: string;
  userEmail: string;
  roleLabel: string;
  terminalId: string;
  clientInfo: string;
  ipAddress: string;
  countryCode?: string;
  statusBadge: {
    text: string;
    variant: 'success' | 'info' | 'warning' | 'error';
  };
  alertMessage?: string;
}

export interface ArcaIntegrationStatus {
  status: 'Operativo' | 'Degradado' | 'Fuera de Línea';
  serviceName: string;
  environment: string;
  traExpiration: {
    hoursRemainingText: string;
    elapsedPercent: number;
    validityHours: number;
    signaturePreview: string;
  };
  fecaeLatencyMs: number;
  lastAuthorizedCae: string;
  lastVoucherLabel: string;
  lastActionMessage: string;
  lastActionTime: string;
}

export interface CdnStorageStatus {
  status: 'Óptimo' | 'Alerta' | 'Lleno';
  serviceName: string;
  providers: string;
  usedGb: number;
  totalGb: number;
  usedPercent: number;
  catalogImagesCount: number;
  edgeCacheHitRatePercent: number;
}

export type AuditTableFilter = 'ALL' | 'sales' | 'cash_shifts' | 'products' | 'user_profiles';
export type AuditOperationType = 'INSERT' | 'UPDATE' | 'DELETE' | 'VOID';

export interface DatabaseAuditLog {
  id: string;
  timestamp: string;
  tableName: 'sales' | 'cash_shifts' | 'products' | 'user_profiles';
  operation: AuditOperationType;
  username: string;
  userRole: string;
  affectedRecordIdentifier: string;
  diffSummary: {
    oldValueText?: string;
    newValueText?: string;
    annotationText?: string;
  };
  details: {
    reason: string;
    transactionIdOrDetails: string;
    oldRecord: Record<string, unknown> | null;
    newRecord: Record<string, unknown> | null;
  };
}

export interface AdminDashboardData {
  kpis: SystemHealthKpis;
  authEvents: AuthAuditEvent[];
  arca: ArcaIntegrationStatus;
  cdn: CdnStorageStatus;
  auditLogs: DatabaseAuditLog[];
}

