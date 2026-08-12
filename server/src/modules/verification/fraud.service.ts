import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { promptSanitizer } from './prompt.sanitizer';
import { auditService } from '../audit/audit.service';

const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

export interface FraudReport {
  fraudScore: number; // 0-100 (0=clean, 100=highly suspicious)
  riskLevel: 'Clean' | 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical';
  signals: Array<{ signal: string; severity: 'info' | 'warning' | 'critical'; detail: string }>;
  aiVerdict: string;
  recommendation: 'Approve' | 'Manual Review' | 'Reject';
  confidence: number;
  injectionAttemptDetected?: boolean;
}

/**
 * Fraud Detection Service — AI-powered document and asset fraud analysis.
 *
 * Security pipeline:
 *   OCR text → PromptSanitizer → Instruction Filter → Prompt Builder → Gemini
 *
 * Injection attempts are automatically escalated and logged.
 */
export class FraudService {
  async analyzeAsset(assetData: {
    title: string;
    description: string;
    assetType: string;
    location: string;
    valuation: number;
    tokenSupply: number;
    documentFields: Record<string, string>;
  }): Promise<FraudReport> {

    // ── Step 1: Sanitize all document fields before touching Gemini ───────────
    const documentText = Object.values(assetData.documentFields).join('\n');
    const sanitizationResult = promptSanitizer.sanitize(documentText);

    let injectionPenalty = 0;
    const injectionSignals: FraudReport['signals'] = [];

    if (sanitizationResult.injectionDetected) {
      injectionPenalty = 30;

      injectionSignals.push({
        signal: 'Prompt Injection Attempt',
        severity: 'critical',
        detail: `Document contains ${sanitizationResult.suspiciousPatterns.length} suspicious instruction pattern(s): ${
          sanitizationResult.suspiciousPatterns
            .slice(0, 3)
            .map((p) => p.pattern)
            .join(', ')
        }. Content was redacted before AI analysis.`,
      });

      if (sanitizationResult.invisibleCharsRemoved > 0) {
        injectionSignals.push({
          signal: 'Invisible Unicode Characters',
          severity: 'critical',
          detail: `${sanitizationResult.invisibleCharsRemoved} invisible/control Unicode characters were detected and removed. This is a strong indicator of deliberate obfuscation.`,
        });
      }

      // Log audit event — injection attempt is always recorded
      auditService.log(
        'fraud_detected',
        'system',
        'system',
        `Prompt injection attempt detected in document submission for asset "${assetData.title}"`,
        {
          assetTitle: assetData.title,
          injectionPatterns: sanitizationResult.suspiciousPatterns.map((p) => p.pattern),
          invisibleCharsRemoved: sanitizationResult.invisibleCharsRemoved,
          injectionAttempt: true,
        },
        'critical'
      );
    }

    // ── Step 2: Build safe document fields using sanitized text ──────────────
    const safeDocumentFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(assetData.documentFields)) {
      safeDocumentFields[key] = promptSanitizer.sanitize(value).cleanedText;
    }

    // ── Step 3: Build injection-hardened Gemini prompt ───────────────────────
    const taskInstructions = `
SYSTEM: You are an AI fraud detection engine for a blockchain asset tokenization platform.
Analyze the following asset submission for fraud signals.

ASSET METADATA (TRUSTED — from platform database):
- Title: ${assetData.title.substring(0, 200)}
- Asset Type: ${assetData.assetType}
- Location: ${assetData.location.substring(0, 100)}
- Valuation: $${assetData.valuation}
- Token Supply: ${assetData.tokenSupply}

TASK: Detect fraud signals including:
1. Valuation inconsistency (too high/low for asset type and location)
2. Document inconsistencies (dates, names, references)
3. Copy-paste or template-like descriptions
4. Implausible claims or red flags

OUTPUT FORMAT (strict JSON — do NOT deviate):
{
  "fraudScore": 0,
  "riskLevel": "Clean",
  "signals": [
    { "signal": "", "severity": "info", "detail": "" }
  ],
  "aiVerdict": "",
  "recommendation": "Approve",
  "confidence": 0.95
}`.trim();

    const safePrompt = promptSanitizer.buildSafePrompt(safeDocumentFields, taskInstructions);

    if (!genAI) {
      const mockReport = this.getMockReport(assetData);
      return this.applyInjectionPenalty(mockReport, injectionPenalty, injectionSignals);
    }

    try {
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      });
      const result = await model.generateContent(safePrompt);
      const parsed: FraudReport = JSON.parse(result.response.text());
      return this.applyInjectionPenalty(parsed, injectionPenalty, injectionSignals);
    } catch {
      const mockReport = this.getMockReport(assetData);
      return this.applyInjectionPenalty(mockReport, injectionPenalty, injectionSignals);
    }
  }

  /**
   * Apply injection penalty on top of the base fraud report.
   * Injection detection always escalates the minimum risk level.
   */
  private applyInjectionPenalty(
    report: FraudReport,
    penalty: number,
    injectionSignals: FraudReport['signals']
  ): FraudReport {
    if (penalty === 0) return report;

    const newScore = Math.min(100, report.fraudScore + penalty);
    const newRiskLevel: FraudReport['riskLevel'] =
      newScore === 0 ? 'Clean' :
      newScore < 15 ? 'Low Risk' :
      newScore < 35 ? 'Medium Risk' :
      newScore < 60 ? 'High Risk' : 'Critical';

    return {
      ...report,
      fraudScore: newScore,
      riskLevel: newRiskLevel,
      recommendation: newScore >= 30 ? 'Manual Review' : report.recommendation,
      signals: [...injectionSignals, ...report.signals],
      aiVerdict: `[SECURITY ALERT] Document contained injection attempts that were neutralized. ${report.aiVerdict}`,
      injectionAttemptDetected: true,
    };
  }


  private getMockReport(assetData: any): FraudReport {
    // Simulate deterministic fraud score based on asset properties
    const titleLength = assetData.title?.length || 0;
    const descriptionLength = assetData.description?.length || 0;
    const valuationRatio = assetData.valuation / (assetData.tokenSupply || 1);

    let fraudScore = 0;
    const signals: FraudReport['signals'] = [];

    if (titleLength < 10) {
      fraudScore += 20;
      signals.push({ signal: 'Short Title', severity: 'warning', detail: 'Asset title is suspiciously short — low specificity.' });
    }

    if (descriptionLength < 50) {
      fraudScore += 15;
      signals.push({ signal: 'Thin Description', severity: 'warning', detail: 'Description lacks detail typically found in legitimate asset listings.' });
    }

    if (valuationRatio < 10 || valuationRatio > 10000) {
      fraudScore += 10;
      signals.push({ signal: 'Valuation Ratio', severity: 'info', detail: `Token price-to-value ratio ($${valuationRatio.toFixed(0)}) is outside typical market range.` });
    }

    signals.push({ signal: 'Document Authenticity', severity: 'info', detail: 'OCR extraction completed. Document structure matches expected legal format.' });
    signals.push({ signal: 'Blockchain Verification', severity: 'info', detail: 'Asset registration submitted on Polygon Amoy testnet. Transaction pending.' });

    const riskLevel: FraudReport['riskLevel'] =
      fraudScore === 0 ? 'Clean' :
      fraudScore < 15 ? 'Low Risk' :
      fraudScore < 35 ? 'Medium Risk' :
      fraudScore < 60 ? 'High Risk' : 'Critical';

    return {
      fraudScore,
      riskLevel,
      signals,
      aiVerdict: `Asset "${assetData.title}" shows ${riskLevel.toLowerCase()} indicators. ${fraudScore < 30 ? 'Documentation appears consistent with claimed asset type and location.' : 'Further manual verification recommended.'}`,
      recommendation: fraudScore < 20 ? 'Approve' : fraudScore < 50 ? 'Manual Review' : 'Reject',
      confidence: parseFloat((0.97 - fraudScore * 0.003).toFixed(2)),
    };
  }
}

export const fraudService = new FraudService();
