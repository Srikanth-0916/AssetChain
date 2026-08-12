/**
 * KnowledgeIndexer — indexes platform data into the vector store on startup.
 *
 * Indexes: assets, DAO proposals, marketplace listings, platform documentation.
 * Re-indexes are safe (upsert is idempotent).
 */

import { vectorStore } from './vector.store';
import { assetService } from '../../services/asset.service';
import { daoService } from '../../services/dao.service';

const PLATFORM_DOCS = [
  {
    id: 'doc:platform:overview',
    text: 'TrustChain AI is a blockchain-powered Real World Asset (RWA) tokenization platform on Polygon. It allows asset owners to tokenize physical assets like real estate and renewable energy as ERC-20 tokens. Investors can purchase fractional ownership tokens and earn passive income through dividends.',
    metadata: { type: 'platform_doc', topic: 'overview' },
  },
  {
    id: 'doc:platform:kyc',
    text: 'KYC (Know Your Customer) verification is required for all asset owners and investors. Documents are uploaded to IPFS, OCR extracted, fraud-checked by AI, and reviewed by platform administrators. Only verified users can tokenize or purchase assets.',
    metadata: { type: 'platform_doc', topic: 'kyc' },
  },
  {
    id: 'doc:platform:dao',
    text: 'The TrustChain DAO governance system allows token holders to propose and vote on platform decisions. Proposals require a quorum of votes to pass. Each asset token holder gets weighted voting power proportional to their token holdings.',
    metadata: { type: 'platform_doc', topic: 'governance' },
  },
  {
    id: 'doc:platform:dividends',
    text: 'Dividends are distributed from rental income collected by asset operators. The Treasury smart contract manages non-reentrant pull-based dividend distribution. Token holders can claim their proportional share at any time.',
    metadata: { type: 'platform_doc', topic: 'dividends' },
  },
  {
    id: 'doc:platform:risk',
    text: 'Risk factors for tokenized RWA investments include: market liquidity risk (secondary markets are maturing), regulatory risk (crypto regulations vary by jurisdiction), operational risk (property management), and smart contract risk (despite audits). Always diversify across multiple asset types.',
    metadata: { type: 'platform_doc', topic: 'risk' },
  },
  {
    id: 'doc:platform:payment',
    text: 'Payments are processed via Razorpay supporting UPI, credit/debit cards, net banking, and QR code. After payment verification, tokens are automatically minted to the investor wallet on Polygon Amoy testnet.',
    metadata: { type: 'platform_doc', topic: 'payment' },
  },
];

let isIndexed = false;

export async function indexPlatformKnowledge(): Promise<{ documents: number; status: string }> {
  try {
    // Index static platform docs
    await vectorStore.upsertBatch(PLATFORM_DOCS);
    let indexed = PLATFORM_DOCS.length;

    // Index assets from marketplace
    try {
      const res = await assetService.getMarketplaceAssets({ limit: '50' });
      const assets = Array.isArray(res?.assets) ? res.assets : [];
      const assetDocs = assets.map((a: any) => ({
        id: `asset:${a.id}`,
        text: `Asset: ${a.title}. Type: ${a.asset_type}. Location: ${a.location || 'Global'}. Valuation: $${a.valuation?.toLocaleString()}. Token price: $${a.token_price}. Token supply: ${a.token_supply}. Status: ${a.verification_status}. Description: ${a.description || ''}`,
        metadata: {
          type: 'asset',
          assetId: a.id,
          assetType: a.asset_type,
          tokenPrice: a.token_price,
          valuation: a.valuation,
        },
      }));
      await vectorStore.upsertBatch(assetDocs);
      indexed += assetDocs.length;
    } catch { /* Continue if asset service fails */ }

    // Index DAO proposals
    try {
      const proposals = await daoService.getProposals();
      const proposalDocs = proposals.map((p: any) => ({
        id: `proposal:${p.id}`,
        text: `DAO Proposal: ${p.title}. Description: ${p.description}. Votes For: ${p.votes_for}. Votes Against: ${p.votes_against}. Status: ${p.status}. Ends: ${p.end_date}`,
        metadata: { type: 'proposal', proposalId: p.id, status: p.status },
      }));
      await vectorStore.upsertBatch(proposalDocs);
      indexed += proposalDocs.length;
    } catch { /* Continue if DAO service fails */ }

    isIndexed = true;
    console.log(`[RAG] Knowledge base indexed: ${indexed} documents (${vectorStore.size} vectors)`);
    return { documents: indexed, status: 'indexed' };
  } catch (error) {
    console.warn('[RAG] Knowledge indexing failed:', error);
    return { documents: 0, status: 'failed' };
  }
}

export function isKnowledgeIndexed(): boolean { return isIndexed; }
