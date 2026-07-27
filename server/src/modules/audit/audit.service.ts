import { v4 as uuidv4 } from 'uuid';

/**
 * Audit Service — logs all admin actions, contract events, and security alerts.
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
    auditLog.unshift(event);
    return event;
  }

  getLog(limit = 50): AuditEvent[] {
    return auditLog.slice(0, limit);
  }

  getLogByType(type: AuditEventType): AuditEvent[] {
    return auditLog.filter((e) => e.type === type);
  }
}

export const auditService = new AuditService();
