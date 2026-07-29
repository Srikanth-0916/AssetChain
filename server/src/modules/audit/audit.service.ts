import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../config/database';

/**
 * Audit Service — logs all admin actions, contract events, and security alerts.
 *
 * Persistence strategy:
 *   1. Every log entry is written to the in-memory store immediately (for UI speed)
 *   2. Every log entry is also persisted to Supabase `audit_logs` table asynchronously
 *   3. If Supabase write fails, the error is LOGGED (not silently swallowed)
 *
 * This is fail-close for observability: we don't hide persistence failures.
 * The in-memory fallback means the app continues to work even if Supabase is down.
 */
export type AuditEventType =
  | 'admin_action' | 'kyc_approved' | 'kyc_rejected'
  | 'asset_approved' | 'asset_rejected' | 'asset_tokenized'
  | 'contract_event' | 'fraud_detected' | 'security_alert'
  | 'payment_verified' | 'dividend_distributed';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  actorId: string;
  actorRole: string;
  description: string;
  metadata: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

const auditLog: AuditEvent[] = [
  {
    id: uuidv4(),
    type: 'asset_approved',
    actorId: 'admin-demo-uuid-001',
    actorRole: 'admin',
    description: 'Admin approved Manhattan Commercial Plaza for tokenization',
    metadata: { assetId: 'asset-demo-uuid-001', contractAddress: '0x1111...1111' },
    severity: 'info',
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: uuidv4(),
    type: 'kyc_approved',
    actorId: 'admin-demo-uuid-001',
    actorRole: 'admin',
    description: 'KYC verification approved for Jane Smith (Asset Owner)',
    metadata: { userId: 'owner-demo-uuid-002' },
    severity: 'info',
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: uuidv4(),
    type: 'fraud_detected',
    actorId: 'system',
    actorRole: 'system',
    description: 'AI fraud detection flagged duplicate asset submission "Urban Residential Block"',
    metadata: { assetTitle: 'Urban Residential Block', fraudScore: 72, duplicateOf: 'asset-demo-uuid-003' },
    severity: 'warning',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export class AuditService {
  log(
    type: AuditEventType,
    actorId: string,
    actorRole: string,
    description: string,
    metadata: Record<string, any> = {},
    severity: AuditEvent['severity'] = 'info'
  ): AuditEvent {
    const event: AuditEvent = {
      id: uuidv4(),
      type,
      actorId,
      actorRole,
      description,
      metadata,
      severity,
      timestamp: new Date().toISOString(),
    };

    // 1. In-memory write (immediate, synchronous)
    auditLog.unshift(event);

    // 2. Supabase persistence (async, non-blocking)
    this.persistToSupabase(event);

    return event;
  }

  /**
   * Persist a single audit event to Supabase.
   * Failures are explicitly logged — never silently swallowed.
   */
  private persistToSupabase(event: AuditEvent): void {
    Promise.resolve(
      supabaseAdmin.from('audit_logs').insert({
        id: event.id,
        type: event.type,
        actor_id: event.actorId,
        actor_role: event.actorRole,
        description: event.description,
        metadata: event.metadata,
        severity: event.severity,
        timestamp: event.timestamp,
      })
    )
      .then(({ error }: any) => {
        if (error) {
          // Fail-close: log the error explicitly so it's visible in monitoring
          console.error(
            `[AuditService] ⚠️  Supabase persistence FAILED for audit event ${event.id} (type: ${event.type}):`,
            error.message
          );
        }
      })
      .catch((err: Error) => {
        console.error(
          `[AuditService] ⚠️  Supabase connection error for audit event ${event.id}:`,
          err.message
        );
      });
  }

  getLog(limit = 50): AuditEvent[] {
    return auditLog.slice(0, limit);
  }

  getLogByType(type: AuditEventType): AuditEvent[] {
    return auditLog.filter((e) => e.type === type);
  }

  getLogBySeverity(severity: AuditEvent['severity']): AuditEvent[] {
    return auditLog.filter((e) => e.severity === severity);
  }
}

export const auditService = new AuditService();

