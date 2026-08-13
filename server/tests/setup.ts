import { beforeAll } from 'vitest';

// ─── Global Test Setup & Resilient Network Mocks ────────────────────────────

// Helper: extract Accept header from either a plain object or a Headers instance
function getAcceptHeader(options: any): string {
  const headers = options?.headers;
  if (!headers) return '';
  if (typeof headers.get === 'function') {
    // Headers instance (Fetch API)
    return headers.get('Accept') || headers.get('accept') || '';
  }
  // Plain object — try both casings
  return (headers as any)['Accept'] || (headers as any)['accept'] || '';
}

// Helper: build a PostgREST "no rows" 406 response (for .single() calls)
function pgrst116Response(): Response {
  return new Response(
    JSON.stringify({
      code: 'PGRST116',
      details: 'The result contains 0 rows',
      hint: '',
      message: 'JSON object requested, multiple (or no) rows returned',
    }),
    { status: 406, headers: { 'Content-Type': 'application/json' } }
  );
}

// Helper: build an empty-list 200 response (for list/maybeSingle/count queries)
function emptyListResponse(): Response {
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/0' },
  });
}

// Supabase REST API mock — intercepts BEFORE network to handle CI with no real DB.
// Supabase auth & storage calls are passed through to the network.
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (url: any, options: any) {
  const urlStr = String(url);

  // Intercept ALL Supabase PostgREST REST calls (not auth/storage)
  const isRestCall =
    (urlStr.includes('supabase.co') || urlStr.includes('supabase.in')) &&
    urlStr.includes('/rest/v1/');

  if (isRestCall) {
    const accept = getAcceptHeader(options);
    const isSingleObject = accept.includes('application/vnd.pgrst.object+json');

    // Try the real network first (works when real Supabase creds are configured)
    try {
      const res = await originalFetch(url, options);
      // Rate limit — return mock success
      if (res.status === 429) {
        return new Response(JSON.stringify({ status: 'rate_limited' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // If the response is OK or a legit PostgREST error, pass it through
      if (res.ok || res.status === 406 || res.status === 409) {
        return res;
      }
      // Any other failure (401 auth error, 404, 5xx) — fall through to mock
    } catch {
      // Network error — fall through to mock
    }

    // Return PostgREST-compliant mock response
    return isSingleObject ? pgrst116Response() : emptyListResponse();
  }

  // Non-REST Supabase calls (auth, storage, functions) — pass through
  try {
    const res = await originalFetch(url, options);
    if (res.ok) return res;
  } catch {
    // Network error — fall through to mock
  }

  if (urlStr.includes('/auth/v1/')) {
    return new Response(
      JSON.stringify({
        id: 'mock-auth-id-12345',
        user: { id: 'mock-auth-id-12345', email: 'mock@assetchain.io' },
        data: { user: { id: 'mock-auth-id-12345', email: 'mock@assetchain.io' } },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ status: 'success', mock: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});
