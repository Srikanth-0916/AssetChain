/**
 * Tool definitions for Gemini Function Calling.
 * Uses plain object schema (no SchemaType imports) for compatibility.
 */

export const PLATFORM_TOOLS = [
  {
    name: 'searchAssets',
    description: 'Search for tokenized real-world assets in the marketplace.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword or asset type' },
        asset_type: { type: 'string', description: 'Filter by asset type' },
        max_price: { type: 'number', description: 'Maximum token price in USD' },
        limit: { type: 'number', description: 'Number of results, default 5' },
      },
    },
  },
  {
    name: 'searchPortfolio',
    description: 'Get the current user portfolio holdings and investment summary.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'calculateROI',
    description: 'Calculate return on investment for a specific investment amount.',
    parameters: {
      type: 'object',
      properties: {
        asset_id: { type: 'string', description: 'Asset ID' },
        investment_amount: { type: 'number', description: 'Investment amount in USD' },
        holding_period_years: { type: 'number', description: 'Holding period in years' },
      },
      required: ['investment_amount'],
    },
  },
  {
    name: 'compareAssets',
    description: 'Compare two or more tokenized assets side by side.',
    parameters: {
      type: 'object',
      properties: {
        asset_ids: {
          type: 'array',
          description: 'Array of asset IDs to compare',
          items: { type: 'string' },
        },
      },
      required: ['asset_ids'],
    },
  },
  {
    name: 'getGovernanceProposals',
    description: 'Get active DAO governance proposals.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: active, passed, failed' },
      },
    },
  },
  {
    name: 'getMarketStatistics',
    description: 'Get platform-wide market statistics: TVL, top categories, trending assets.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getTransaction',
    description: 'Look up a blockchain transaction by hash.',
    parameters: {
      type: 'object',
      properties: {
        tx_hash: { type: 'string', description: 'Transaction hash starting with 0x' },
      },
      required: ['tx_hash'],
    },
  },
] as const;

export type ToolName = typeof PLATFORM_TOOLS[number]['name'];
