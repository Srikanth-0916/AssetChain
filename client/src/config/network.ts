/**
 * Centralized runtime network configuration.
 *
 * Strategy:
 *   1. If VITE_API_URL is set in .env AND does NOT contain "localhost" → use it as-is (production/staging).
 *   2. Otherwise → derive the backend URL from window.location.hostname at runtime.
 *      - This makes localhost dev AND LAN cross-device testing work automatically
 *        without any code changes.
 *
 * Examples:
 *   Developer machine:   window.location.hostname = "localhost"   → http://localhost:3001/api/v1
 *   Friend's laptop:     window.location.hostname = "10.10.32.207" → http://10.10.32.207:3001/api/v1
 *   Production:          VITE_API_URL = "https://api.assetchain.io/api/v1" → used directly
 */

const BACKEND_PORT = 3001;

function deriveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;

  // If a non-localhost env URL is explicitly configured, use it (production/staging).
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, ''); // trim trailing slash
  }

  // Dynamically derive from the hostname the browser actually connected to.
  // This works for both localhost and any LAN IP.
  const hostname = window.location.hostname; // e.g. "localhost" or "10.10.32.207"
  const protocol = window.location.protocol; // "http:" or "https:"
  return `${protocol}//${hostname}:${BACKEND_PORT}/api/v1`;
}

function deriveWsBaseUrl(): string {
  const envUrl = import.meta.env.VITE_WS_URL as string | undefined;

  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  const hostname = window.location.hostname;
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${hostname}:${BACKEND_PORT}`;
}

/**
 * The single source of truth for the API base URL.
 * Import this in api.ts and any component that needs to make direct fetch() calls.
 */
export const API_BASE_URL = deriveApiBaseUrl();

/**
 * The single source of truth for the WebSocket URL.
 */
export const WS_BASE_URL = deriveWsBaseUrl();
