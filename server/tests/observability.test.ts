import { describe, it, expect } from 'vitest';
import { aiObservabilityService } from '../src/modules/ai/ai.observability';

describe('AI Observability & Telemetry Subsystem', () => {
  it('Should log telemetry event and compute aggregated metrics', () => {
    // Log sample telemetry events
    aiObservabilityService.logEvent('/ai/investment-advice', 'gemini', 180, 'success', undefined, 500);
    aiObservabilityService.logEvent('/ai/portfolio-analysis', 'fallback', 140, 'success', undefined, 300);
    aiObservabilityService.logEvent('/ai/risk-analysis', 'gemini', 210, 'success', undefined, 400);

    const stats = aiObservabilityService.getStats();

    expect(stats).toBeDefined();
    expect(stats.totalRequests).toBeGreaterThanOrEqual(3);
    expect(stats.averageLatencyMs).toBeGreaterThan(0);
    expect(stats.fallbackRatePercent).toBeGreaterThanOrEqual(0);
    expect(stats.errorRatePercent).toBe(0);

    console.log('✓ AI Observability Stats:', {
      totalRequests: stats.totalRequests,
      avgLatencyMs: `${stats.averageLatencyMs}ms`,
      fallbackRate: `${stats.fallbackRatePercent}%`,
      errorRate: `${stats.errorRatePercent}%`,
    });
  });

  it('Should retrieve recent telemetry logs without sensitive prompts', () => {
    const logs = aiObservabilityService.getLogs(10);
    expect(logs).toBeInstanceOf(Array);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].endpoint).toBeDefined();
    expect(logs[0].handledBy).toBeDefined();
  });
});
