/**
 * Real-Time WebSocket Event Server & Push Engine
 * 
 * Provides live bi-directional WebSocket push notifications for:
 * - Real-time dividend credits & payment confirmations
 * - Live continuous fraud alerts & legal risk warnings
 * - Live secondary marketplace token supply updates
 * - Real-time discussion comment broadcasts
 */

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface WebSocketEvent {
  type: 'DIVIDEND_CREDITED' | 'FRAUD_ALERT' | 'TOKEN_PURCHASED' | 'KYC_UPDATED' | 'DISCUSSION_COMMENT';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial connection welcome event
      ws.send(
        JSON.stringify({
          type: 'CONNECTED',
          title: 'WebSocket Live Connected',
          message: 'Real-time event stream connected to TrustChain AI backend.',
          timestamp: new Date().toISOString(),
        })
      );

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    console.log('[WebSocket] Live real-time event server listening on /ws');
  }

  /**
   * Broadcasts a real-time event to all connected clients.
   */
  broadcastEvent(event: Omit<WebSocketEvent, 'timestamp'>) {
    const payload = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const webSocketService = new WebSocketService();
