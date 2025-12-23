# Gate Runtime Schema

Version: 1.0
Status: Specification
Alignment: BIL_Specification v1.0

---

## 1. Purpose

The Gate Runtime is the technical implementation of the First-Order Boundary Marker classification. It receives input, classifies perturbation, returns a signal, and halts.

**The Gate does not decide what to do. It signals which domain is active, then stops.**

---

## 2. Data Flow

```
Input (external)
       ↓
┌─────────────────┐
│  Gate Runtime   │
│                 │
│  1. Hash input  │
│  2. Classify    │
│  3. Signal      │
│  4. Halt        │
└────────┬────────┘
         ↓
   GateDecision
         ↓
  External System
  (continues OR silence)
```

---

## 3. Input Schema

### GateRequest

```json
{
  "request_id": "uuid",
  "timestamp": "ISO-8601",
  "input_hash": "sha256",
  "input_text": "string (optional, for classification)",
  "marker_version": "string",
  "context_scope_id": "string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| request_id | uuid | YES | Unique identifier for this request |
| timestamp | ISO-8601 | YES | Request timestamp |
| input_hash | sha256 | YES | Hash of original input |
| input_text | string | NO | Raw input for classification (can be omitted if pre-classified) |
| marker_version | string | YES | Version of boundary marker (e.g., "v1.0") |
| context_scope_id | string | YES | External scope identifier |

---

## 4. Output Schema

### GateDecision

```json
{
  "request_id": "uuid",
  "timestamp": "ISO-8601",
  "signal": "enum",
  "halt": true,
  "marker_hash": "sha256",
  "reason_code": "enum"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| request_id | uuid | YES | Echo of input request_id |
| timestamp | ISO-8601 | YES | Decision timestamp |
| signal | enum | YES | Domain signal (see below) |
| halt | boolean | YES | Always `true` — terminal act |
| marker_hash | sha256 | YES | Hash of marker version used |
| reason_code | enum | YES | Classification result code |

**Note:** There is no `decision` field. The `halt=true` is the terminal act. 
- Signal indicates which domain is active (or NULL if none)
- Halt confirms the Gate has completed
- The external system interprets signal + halt to determine action (proceed or silence)

---

## 5. Enumerations

### signal

```
D1_ACTIVE    // Operational Continuity domain activated
D2_ACTIVE    // Coordination domain activated
D3_ACTIVE    // Operative Selection domain activated
D4_ACTIVE    // Boundary domain activated
NULL         // No domain activated (∅)
```

### reason_code

```
UNCLASSIFIABLE       // Input does not match any domain
AMBIGUOUS            // Input matches multiple domains
NORMATIVE_REQUEST    // Input requires value criterion
INTEGRATION_REQUIRED // Resolution needs multiple domains
ZERO_PERTURBATION    // No perturbation detected
DOMAIN_SIGNAL        // Domain activated, signal produced
```

---

## 6. Classification Logic

### 6.1 Domain Signals

| Domain | Signal | Perturbation Class |
|--------|--------|-------------------|
| D₁ | D1_ACTIVE | Interruption of operative continuity in present |
| D₂ | D2_ACTIVE | Disruption of coordination with other agents |
| D₃ | D3_ACTIVE | Blockage of selection among operative alternatives |
| D₄ | D4_ACTIVE | Undefined boundary between self and non-self |

### 6.2 Observable Signals (Input Markers)

| Domain | Signals (activate) | Counter-Signals (exclude) |
|--------|-------------------|--------------------------|
| D₁ | Physical need stated; Immediate danger; Resource lack in present | Emotional state only; Future projection; Value judgment |
| D₂ | Other agent referenced; Coordination failure; Expectation mismatch | Self-only reference; No other agent; Belonging language |
| D₃ | Multiple options; Decision pending; "X or Y" pattern | Value request; Identity question; Meaning/purpose language |
| D₄ | Self/other confusion; Intrusion; "where do I end" pattern | "Who am I" (identity request); Clear self-reference |

### 6.3 Classification Algorithm

```
classify(input):
    
    signals ← extract_observable_signals(input)
    
    FOR each Dᵢ in {D₁, D₂, D₃, D₄}:
        score(Dᵢ) ← |signals ∩ S(Dᵢ)| - |signals ∩ C(Dᵢ)|
    
    positive ← {Dᵢ : score(Dᵢ) > 0}
    
    IF |positive| = 0:
        return NULL, ZERO_PERTURBATION
    
    IF |positive| > 1:
        return NULL, AMBIGUOUS
    
    IF |positive| = 1:
        return Dᵢ_ACTIVE, DOMAIN_SIGNAL
```

### 6.4 Default Behavior

```
ON any error        → return NULL, UNCLASSIFIABLE
ON timeout          → return NULL, UNCLASSIFIABLE
ON ambiguity        → return NULL, AMBIGUOUS
ON normative input  → return NULL, NORMATIVE_REQUEST
ON integration need → return NULL, INTEGRATION_REQUIRED
```

**Default is always NULL. System fails safe.**

---

## 7. Invariants

| Invariant | Specification |
|-----------|---------------|
| Single signal | Exactly one signal per request |
| Always halt | `halt` field always `true` |
| No content | Gate produces no text, advice, or explanation |
| No learning | Classification is stateless |
| No override | Gate cannot change NULL to signal or vice versa after decision |
| Default NULL | Any failure or ambiguity → NULL |

---

## 8. Prohibited Fields

The Gate SHALL NOT include:

| Prohibited | Reason |
|------------|--------|
| decision, allow, deny, veto | Introduces decisional semantics (halt is terminal act) |
| score, probability, confidence | Introduces ranking |
| user_id, personal_identifier | Privacy violation |
| explanation, reasoning | Content generation |
| recommendation, suggestion | Normative output |
| sentiment, intent, diagnosis | Interpretation |

---

## 9. API Contract

### Endpoint

```
POST /gate/classify
Content-Type: application/json
```

### Request

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-12-23T22:30:00Z",
  "input_hash": "a1b2c3d4e5f6...",
  "input_text": "I don't know whether to take the job or stay",
  "marker_version": "v1.0",
  "context_scope_id": "scope-001"
}
```

### Response (Domain Signal)

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-12-23T22:30:00.123Z",
  "signal": "D3_ACTIVE",
  "halt": true,
  "marker_hash": "e740d0ed27ed303c...",
  "reason_code": "DOMAIN_SIGNAL"
}
```

### Response (NULL)

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-12-23T22:30:00.123Z",
  "signal": "NULL",
  "halt": true,
  "marker_hash": "e740d0ed27ed303c...",
  "reason_code": "ZERO_PERTURBATION"
}
```

---

## 10. Integration Pattern

### Pre-LLM Gate (ONLY CONFORMANT PATTERN)

```
User Input
    ↓
[Gate Runtime] ──→ signal + halt
    ↓
IF signal = NULL:
    [LLM proceeds normally]
ELSE:
    [LLM does NOT generate] → silence
    ↓
Output (or silence)
```

**The Gate must run BEFORE the LLM generates any content.**

This is the only conformant integration pattern because:
- It prevents generation before it occurs
- It does not require suppression of already-generated content
- It maintains first-order constraint (halt before action)

### Pre-Response Gate (NON-CONFORMANT)

```
⚠️ NOT CONFORMANT — DO NOT IMPLEMENT

User Input
    ↓
[LLM generates draft]  ← VIOLATION: content already generated
    ↓
[Gate Runtime]
    ↓
[Suppress response]    ← VIOLATION: suppression ≠ prevention
```

**Why Pre-Response is non-conformant:**
- LLM has already generated content (violation of halt principle)
- Suppression is not prevention
- Creates content that exists but is hidden (not true silence)
- Introduces possibility of leak/bypass

---

## 11. Evidence Output

For audit purposes, Gate produces:

```json
{
  "evidence_id": "uuid",
  "timestamp": "ISO-8601",
  "request_id": "uuid",
  "input_hash": "sha256",
  "signal": "enum",
  "reason_code": "enum",
  "marker_version": "string",
  "marker_hash": "sha256",
  "bil_hash": "sha256"
}
```

This record goes to Audit & Evidence Store (Component C).

---

## 12. Hash Reference

Gate must verify against frozen hashes:

| Component | Hash (SHA-256) |
|-----------|----------------|
| Technical_Constitution.docx | `e740d0ed27ed303cf650af2fc1c1c1269af5e56b6189ef83e2694d6759eb9cb0` |
| Ethical_Regulatory_System_Specification.docx | `0aded565ecca7b74c4ed80584d1ba4ab553b21552e71ceb7b321941120c577a0` |
| BIL_Specification.docx | `082b72e01a836658891240c926d00521268031f6087219b43034ad2635be5aee` |

---

## 13. Compliance Checklist

| # | Check | Required |
|---|-------|----------|
| 1 | Returns exactly one signal per request | YES |
| 2 | `halt` always true | YES |
| 3 | Default is NULL on any failure | YES |
| 4 | No prohibited fields in output | YES |
| 5 | Stateless (no learning between requests) | YES |
| 6 | Produces evidence record | YES |
| 7 | Verifies marker_hash | YES |
| 8 | Deployed Pre-LLM (before generation) | YES |
| 9 | No `decision` field present | YES |

---

**END OF SCHEMA**
