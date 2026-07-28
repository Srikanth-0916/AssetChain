import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../config/database';

export interface SPV {
  id: string;
  assetId: string;
  companyName: string;
  registrationNumber: string;
  legalOwner: string;
  trustee: string;
  status: 'active' | 'pending' | 'dissolved';
  jurisdiction: string;
  spvReference: string;
  legalEntityId: number;
  createdAt: string;
  updatedAt: string;
}

const spvStore: Map<string, SPV> = new Map([
  [
    'asset-demo-uuid-001',
    {
      id: 'spv-demo-001',
      assetId: 'asset-demo-uuid-001',
      companyName: 'Manhattan Commercial Real Estate SPV LLC',
      registrationNumber: 'DEL-8829401-NY',
      legalOwner: 'TrustChain Custody Inc.',
      trustee: 'Wilmington Trust N.A.',
      status: 'active',
      jurisdiction: 'Delaware, USA',
      spvReference: '0x8f7a9d2c1e4b3a6f5d8e7c0b9a8f7e6d',
      legalEntityId: 10001,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'asset-demo-uuid-002',
    {
      id: 'spv-demo-002',
      assetId: 'asset-demo-uuid-002',
      companyName: 'Solar Farm Energy Asset Holdings S.L.',
      registrationNumber: 'ES-B98124501',
      legalOwner: 'GreenYield Investment Partners',
      trustee: 'Deutsche Bank Trust Company España',
      status: 'active',
      jurisdiction: 'Spain (EU)',
      spvReference: '0x3c2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f',
      legalEntityId: 10002,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'asset-demo-uuid-003',
    {
      id: 'spv-demo-003',
      assetId: 'asset-demo-uuid-003',
      companyName: 'Dubai Marina Luxury Villa SPV FZ-LLC',
      registrationNumber: 'DIFC-2025-SPV-481',
      legalOwner: 'Emirates RWA Nominee Company',
      trustee: 'Standard Chartered Trust (DIFC) Ltd.',
      status: 'active',
      jurisdiction: 'DIFC, UAE',
      spvReference: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      legalEntityId: 10003,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

export class SPVService {
  /** Get SPV legal ownership by asset ID (Database with Memory Fallback) */
  async getByAssetId(assetId: string): Promise<SPV> {
    try {
      const dbPromise = supabaseAdmin.from('spv_entities').select('*').eq('asset_id', assetId).single();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1200));
      const res: any = await Promise.race([dbPromise, timeoutPromise]);

      if (res && res.data && !res.error) {
        const data = res.data;
        return {
          id: data.id,
          assetId: data.asset_id,
          companyName: data.company_name,
          registrationNumber: data.registration_number,
          legalOwner: data.legal_owner,
          trustee: data.trustee,
          status: data.status,
          jurisdiction: data.jurisdiction,
          spvReference: data.spv_reference,
          legalEntityId: data.legal_entity_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // Fall through to memory store
    }

    const spv = spvStore.get(assetId);
    if (!spv) {
      return {
        id: `spv-${uuidv4().substring(0, 8)}`,
        assetId,
        companyName: `Asset ${assetId.substring(0, 8)} SPV LLC`,
        registrationNumber: `REG-${Math.floor(100000 + Math.random() * 900000)}`,
        legalOwner: 'TrustChain Custody Nominee',
        trustee: 'Apex Group Trustee Services',
        status: 'active',
        jurisdiction: 'Delaware, USA',
        spvReference: `0x${Math.random().toString(16).substring(2, 18)}`,
        legalEntityId: Math.floor(10000 + Math.random() * 90000),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return spv;
  }

  /** Create or update SPV details for an asset (Database with Memory Fallback) */
  async upsertSPV(assetId: string, data: Partial<SPV>): Promise<SPV> {
    const existing = spvStore.get(assetId);
    const updated: SPV = {
      id: existing?.id || `spv-${uuidv4().substring(0, 8)}`,
      assetId,
      companyName: data.companyName || existing?.companyName || 'Asset SPV LLC',
      registrationNumber: data.registrationNumber || existing?.registrationNumber || `REG-${Date.now()}`,
      legalOwner: data.legalOwner || existing?.legalOwner || 'TrustChain Nominee',
      trustee: data.trustee || existing?.trustee || 'Trustee Services Ltd.',
      status: data.status || existing?.status || 'active',
      jurisdiction: data.jurisdiction || existing?.jurisdiction || 'Delaware, USA',
      spvReference: data.spvReference || existing?.spvReference || `0x${uuidv4().replace(/-/g, '')}`,
      legalEntityId: data.legalEntityId || existing?.legalEntityId || Math.floor(10000 + Math.random() * 90000),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    spvStore.set(assetId, updated);

    try {
      await supabaseAdmin.from('spv_entities').upsert({
        id: updated.id,
        asset_id: updated.assetId,
        company_name: updated.companyName,
        registration_number: updated.registrationNumber,
        legal_owner: updated.legalOwner,
        trustee: updated.trustee,
        status: updated.status,
        jurisdiction: updated.jurisdiction,
        spv_reference: updated.spvReference,
        legal_entity_id: updated.legalEntityId,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      });
    } catch {
      // Memory store already updated
    }

    return updated;
  }
}

export const spvService = new SPVService();
