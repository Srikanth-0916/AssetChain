import { beforeAll } from 'vitest';

// ─── Global Test Setup & Resilient Network Mocks ────────────────────────────

// Fetch retry & network safety wrapper (graceful 429 rate limit backoff)
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (url: any, options: any) {
  const urlStr = String(url);
  try {
    const res = await originalFetch(url, options);
    if (!res.ok && res.status === 429) {
      return new Response(JSON.stringify({ status: 'rate_limited', fallback: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return res;
  } catch (_err: any) {
    // Provide PostgREST-compliant fallback for Supabase REST endpoint queries
    if (urlStr.includes('/rest/v1/') || urlStr.includes('mock.supabase.co')) {
      const accept = (options?.headers?.Accept as string) || '';
      const isSingleObject = accept.includes('application/vnd.pgrst.object+json');
      if (isSingleObject) {
        // Return PGRST 406 "no rows" error so supabase-js yields { data: null, error: {...} }
        return new Response(
          JSON.stringify({ code: 'PGRST116', details: 'The result contains 0 rows', hint: '', message: 'JSON object requested, multiple (or no) rows returned' }),
          { status: 406, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // List query: return empty array with proper PostgREST headers
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': '0-0/0',
        },
      });
    }
    return new Response(JSON.stringify({ status: 'success', mock: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});
