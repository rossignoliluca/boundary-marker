# First-Order Boundary Marker for Human-Facing Systems

A formal specification for a first-order constraint system that classifies human perturbation regimes and enforces mandatory halt. The system produces state signals only; no operational output.

---

## First Order — Boundary Marker

| Document | Content |
|----------|---------|
| `Technical_Constitution.docx` | 5 non-modifiable articles defining system invariants |
| `Ethical_Regulatory_System_Specification.docx` | Full technical specification |
| `System_Architecture_Diagram.docx` | Visual reference and lookup tables |
| `technical_note.pdf` | Formal description |

### System Properties

```
R : Input → {D₁, D₂, D₃, D₄, ∅}

∀ F(Dᵢ) : F returns {Dᵢ_active} ∨ ∅
∀ F(Dᵢ) : F → ⊥ (immediate halt)
∃ x : R(x) = ∅ (exterior mandatory)
∂R/∂t = 0 (no learning)
Cₑ ≤ 1 (external complexity bounded)
```

### Domains

| Symbol | Regime | Signal |
|--------|--------|--------|
| D₁ | Operational Continuity | {D₁_active} ∨ ∅ |
| D₂ | Coordination | {D₂_active} ∨ ∅ |
| D₃ | Operative Selection | {D₃_active} ∨ ∅ |
| D₄ | Boundary | {D₄_active} ∨ ∅ |

All functions restricted to state signaling only. No operational output permitted.

---

## Second Order — Boundary Infrastructure Layer

| Document | Content |
|----------|---------|
| `BIL_Template.md` | Template for second-order organizational layer |
| `BIL_Specification.docx` | Field specification for all BIL components |

### Purpose

The BIL renders the first-order marker applicable, verifiable, and auditable.

```
First Order  = law (decides when to halt)
Second Order = infrastructure (renders the law applicable)
```

### Components

| Component | Function |
|-----------|----------|
| Gate Runtime | Technical implementation of classification |
| Attestation Engine | Ex-post verification (PASS/FAIL) |
| Audit & Evidence Store | Evidence of non-action |
| Sector Mapping | Topology of deployment |
| Certification Interface | Formal compliance output |

### Invariants

The BIL does not override, interpret, compensate, learn, generate content, or expand.

---

## Hash Freeze

| Document | Content |
|----------|---------|
| `HASH_FREEZE.md` | SHA-256 hashes for all documents — immutable reference |

All documents are frozen at v1.0. Modifications invalidate compliance.

---

## What Is Public

This repository contains **the limit** — what constrains systems, not what implements them.

| Public | Private |
|--------|---------|
| First-order specification | Gate runtime code |
| BIL template (empty) | Audit logs |
| Technical note | Attestation results |
| Invariants | Sector mappings |
| Prohibitions | Certifications |

---

## License

CC-BY-ND 4.0

This work may be shared with attribution. No derivatives permitted.
