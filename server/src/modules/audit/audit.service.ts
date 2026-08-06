import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../config/database';
import { indexedEventStore } from '../indexer/event.indexer';

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
  | 'admin_action' | 'kyc_submitted' | 'kyc_approved' | 'kyc_rejected'
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

const auditLog: AuditEvent[] = [];

export class AuditService {
  /**
   * Log an audit event.
   * Supports two call signatures for backward compatibility:
   *   1. Positional: log(type, actorId, actorRole, description, metadata?, severity?)
   *   2. Object:     log({ type, actorId, actorRole, description, metadata?, severity? })
   */
  log(
    typeOrObj:
      | AuditEventType
      | { type: AuditEventType; actorId: string; actorRole: string; description: string; metadata?: Record<string, any>; severity?: AuditEvent['severity'] },
    actorId?: string,
    actorRole?: string,
    description?: string,
    metadata: Record<string, any> = {},
    severity: AuditEvent['severity'] = 'info'
  ): AuditEvent {
    // Resolve object vs positional
    let resolvedType: AuditEventType;
    let resolvedActorId: string;
    let resolvedActorRole: string;
    let resolvedDescription: string;
    let resolvedMetadata: Record<string, any>;
    let resolvedSeverity: AuditEvent['severity'];

    if (typeof typeOrObj === 'object') {
      resolvedType = typeOrObj.type;
      resolvedActorId = typeOrObj.actorId;
      resolvedActorRole = typeOrObj.actorRole;
      resolvedDescription = typeOrObj.description;
      resolvedMetadata = typeOrObj.metadata ?? {};
      resolvedSeverity = typeOrObj.severity ?? 'info';
    } else {
      resolvedType = typeOrObj;
      resolvedActorId = actorId!;
      resolvedActorRole = actorRole!;
      resolvedDescription = description!;
      resolvedMetadata = metadata;
      resolvedSeverity = severity;
    }
    const event: AuditEvent = {
      id: uuidv4(),
      type: resolvedType,
      actorId: resolvedActorId,
      actorRole: resolvedActorRole,
      description: resolvedDescription,
      metadata: resolvedMetadata,
      severity: resolvedSeverity,
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
   * Schema: id, actor_id, actor_role, action, entity_type, entity_id, description, old_value, new_value, created_at
   * Failures are explicitly logged — never silently swallowed.
   */
  private persistToSupabase(event: AuditEvent): void {
    // Map internal 'type' → DB 'action' column. Derive entity_type from type string.
    const actionMap: Record<AuditEventType, string> = {
      admin_action: 'admin_action',
      kyc_submitted: 'kyc_submitted',
      kyc_approved: 'kyc_approved',
      kyc_rejected: 'kyc_rejected',
      asset_approved: 'asset_approved',
      asset_rejected: 'asset_rejected',
      asset_tokenized: 'asset_tokenized',
      contract_event: 'contract_event',
      fraud_detected: 'fraud_detected',
      security_alert: 'security_alert',
      payment_verified: 'payment_verified',
      dividend_distributed: 'dividend_distributed',
    };

    const entityTypeMap: Record<AuditEventType, string> = {
      admin_action: 'system',
      kyc_submitted: 'user',
      kyc_approved: 'user',
      kyc_rejected: 'user',
      asset_approved: 'asset',
      asset_rejected: 'asset',
      asset_tokenized: 'asset',
      contract_event: 'blockchain',
      fraud_detected: 'asset',
      security_alert: 'system',
      payment_verified: 'payment',
      dividend_distributed: 'asset',
    };

    Promise.resolve(
      supabaseAdmin.from('audit_logs').insert({
        id: event.id,
        actor_id: event.actorId,
        actor_role: event.actorRole,
        action: actionMap[event.type] ?? event.type,
        entity_type: entityTypeMap[event.type] ?? 'system',
        entity_id: (event.metadata?.assetId || event.metadata?.userId || event.metadata?.id || null) as string | null,
        // description column may not exist in older DB deployments — store in new_value JSONB
        new_value: {
          description: event.description,
          severity: event.severity,
          ...(Object.keys(event.metadata).length > 0 ? event.metadata : {}),
        },
      })
    )
      .then(({ error }: any) => {
        if (error) {
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
    // 1. Blockchain indexed events (Primary Source of Truth)
    const { events: onChainEvents } = indexedEventStore.getAll(1, limit);
    const mappedBlockchainAudits: AuditEvent[] = onChainEvents.map((evt) => ({
      id: evt.id,
      type: 'contract_event',
      actorId: evt.args['owner'] || evt.args['buyer'] || evt.args['proposer'] || evt.contractAddress,
      actorRole: 'blockchain',
      description: `On-Chain Verified Event: ${evt.eventName} [Block #${evt.blockNumber}]`,
      metadata: {
        txHash: evt.txHash,
        blockNumber: evt.blockNumber,
        confirmations: evt.confirmations,
        contractAddress: evt.contractAddress,
        eventName: evt.eventName,
        args: evt.args,
      },
      severity: 'info',
      timestamp: evt.timestamp,
    }));

    // 2. Merge with cached operational audit entries, sorted newest first
    const combined = [...mappedBlockchainAudits, ...auditLog];
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return combined.slice(0, limit);
  }

  getLogByType(type: AuditEventType): AuditEvent[] {
    const all = this.getLog(100);
    return all.filter((e) => e.type === type);
  }

  getLogBySeverity(severity: AuditEvent['severity']): AuditEvent[] {
    const all = this.getLog(100);
    return all.filter((e) => e.severity === severity);
  }
}

export const auditService = new AuditService();

