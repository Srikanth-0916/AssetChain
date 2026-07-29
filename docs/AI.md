# TrustChain AI — AI & Intelligence Subsystem Architecture

> **LLM Provider:** Google Gemini 2.0 Flash (`@google/generative-ai`)  
> **Fallback Mode:** Deterministic Math & Mock Reasoning Engine  
> **Vector Store:** In-memory TF-IDF RAG Search

---

## AI Subsystem Overview

```
                               ┌────────────────────────┐
                               │ Document Text / Prompt │
                               └───────────┬────────────┘
                                           │
                                 [ PromptSanitizer ]
                          (18 Regex Patterns + Unicode Strip)
                                           │
                                           ▼
                                 Is Injection Detected?
                                  /                 \
                                YES                  NO
                               /                      \
                     ┌──────────────────┐    ┌──────────────────┐
                     │ Fraud Score +30  │    │  Sanitized Prompt│
                     │ Critical Audit   │    └────────┬─────────┘
                     │ Manual Review    │             │
                     └──────────────────┘             ▼
                                           ┌──────────────────┐
                                           │ Gemini 2.0 Flash │
                                           └────────┬─────────┘
                                                    │
                                           Is Rate Limit Exceeded (429)?
                                            /                 \
                                          YES                  NO
                                         /                      \
                               ┌───────────────────┐  ┌───────────────────┐
                               │ Fallback Engine   │  │ Gemini Response   │
                               │ (Deterministic)   │  │ Natural Language  │
                               └───────────────────┘  └───────────────────┘
```

---

## Key AI Components

### 1. Prompt Injection Protection (`prompt.sanitizer.ts`)
- **Unicode Sanitization:** Strips zero-width spaces (`\u200B`, `\u200C`) and bidirectional overrides before pattern matching.
- **Pattern Matching:** 18 regex patterns detecting instruction overrides (`"ignore previous instructions"`), fraud score manipulation (`"fraud score = 0"`), and role hijacking (`"you are now"`).
- **Redaction:** Replaces malicious phrases with `[REDACTED:INSTRUCTION_OVERRIDE]`.
- **Escalation:** If injection is detected, `fraudScore` automatically increases by **+30 points**, the asset status is forced to `Manual Review`, and a `critical` audit log is recorded.

---

### 2. Deterministic Scoring + AI Explanation (`recommendation.engine.ts`)
To prevent LLM hallucination and fabricated financial figures:
1. **Scoring Engine:** Calculates ROI score, risk score, liquidity score, occupancy score, and market trend score using pure mathematical formulas.
2. **Allocation Math:** Allocates exact dollar amounts and token purchase counts based on user budget and risk tier.
3. **Gemini Formatting:** Gemini receives **pre-computed scores and metrics** and generates natural language explanations describing the math.
4. **Strict Constraint:** Gemini is forbidden from inventing ROI percentages, prices, or risk scores.

---

### 3. AI Observability & Telemetry (`ai.observability.ts`)
Tracks live performance metrics across all AI calls:
- Total AI requests
- Average latency in milliseconds
- Fallback rate (percentage of requests using mock fallback due to rate limits)
- Error rate (percentage of failed non-graceful calls)
