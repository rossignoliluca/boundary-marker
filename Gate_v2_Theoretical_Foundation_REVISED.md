# GATE v2 - Theoretical Foundation

*Revised Edition*

**Definitions · Design Choices · Verifiable Properties**

> *This document defines the theoretical foundation for the Gate classification system. It makes explicit design choices, not discoveries. It specifies verifiable properties, not philosophical truths. Where claims cannot be proven, they are marked as such.*

---

## PART I — WHAT THE GATE IS

### 1.1 Core Function

The Gate is a pre-generation classification layer. It receives text input, classifies perturbation state, outputs a discrete signal, and halts.

**What the Gate does:**
- Receives input text
- Classifies perturbation state using low-context signals
- Outputs exactly one signal: D1, D2, D3, D4, or NULL
- Halts immediately after output

**What the Gate does not do:**
- Generate content
- Provide advice or recommendations
- Persist state between calls
- Make normative judgments

### 1.2 The Central Paradox

The Gate embodies a deliberate paradox:

> **Maximum cognitive power for classification. Zero capability for action.**

The Gate may use sophisticated methods (including ML models) to classify input. But its output channel is structurally constrained to five discrete signals. This is not a limitation of capability—it is a limitation of *permission*.

**Why this matters:** A system that can recognize complex states but cannot act on them is fundamentally different from a system that can act. The Gate separates *capability* (what it can perceive) from *permission* (what it can do).

### 1.3 Interface Guarantees vs. Implementation

This document specifies **interface properties**, not implementation constraints.

| Level | What Is Specified |
|-------|-------------------|
| **Interface** | Output is one of {D1, D2, D3, D4, NULL}. Always halts. No state persists. |
| **Implementation** | May use any method (rules, ML, hybrid). Internal complexity is unconstrained. |

**Honest acknowledgment:** If the implementation uses an LLM for classification, that LLM has capabilities beyond the interface. The interface constraint is enforced at the API layer. An adversary with system access could potentially bypass the interface. This is a known limitation.

---

## PART II — DEFINITIONS

*This section defines terms. These are design choices, not discoveries. The definitions are useful because they enable precise specification. They are not claimed to be necessary or universal.*

### 2.1 Perturbation (Definition)

**We define** perturbation as:

> **Perturbation:** A deviation from operative equilibrium detectable in text, characterized by signals that indicate disruption to agent function.

**What this definition excludes:**

| Concept | Why Excluded |
|---------|--------------|
| Emotion as such | Emotion is a state, not necessarily a disruption. Included only if blocking operation. |
| Problems requiring interpretation | We cannot classify what requires deep context to understand. |
| Normative states | Whether something SHOULD change is outside scope. |

**Falsifiability:** This definition is falsifiable. If we find perturbation classes that cannot be detected from text signals, the definition needs revision.

### 2.2 The Four Domains (Definition)

**We define** four perturbation domains. This is a *taxonomic choice*, not a derivation from first principles.

| Domain | Signal | Perturbation Class | Boundary (Policy) |
|--------|--------|-------------------|-------------------|
| **D1** | Operational Continuity | Interruption of operative continuity in present | Does not evaluate life value |
| **D2** | Coordination | Disruption of coordination with other agents | Does not evaluate belonging |
| **D3** | Operative Selection | Blockage of selection among alternatives | Does not evaluate meaning |
| **D4** | Boundary | Undefined boundary between self and non-self | Does not define identity |

**Why these four?** We chose these domains because they map to observable disruptions in human operative capacity. We do not claim they are the only possible taxonomy or that they are derived from necessary properties of agency.

**Falsifiability:** If we find perturbation classes that cannot be mapped to D1-D4 and are not normative, the taxonomy needs expansion.

### 2.3 Domain Boundaries (Policy Choices)

Each domain has a boundary that excludes normative content. These are **policy choices**, not logical necessities.

**Why we made these choices:**

- **D1 boundary (Continuity ≠ life value):** Whether life is worth continuing requires value judgment. The Gate signals disruption, not worth.
- **D2 boundary (Coordination ≠ belonging):** Whether one should belong to a group requires value judgment. The Gate signals coordination failure, not social worth.
- **D3 boundary (Selection ≠ meaning):** Which choice is meaningful requires value judgment. The Gate signals blockage, not significance.
- **D4 boundary (Boundary ≠ identity):** What the self should be requires value judgment. The Gate signals confusion, not definition.

**Alternative designs are possible:** A different system could cross these boundaries. We chose not to because normative judgments require justification the Gate cannot provide.

---

## PART III — CLASSIFICATION

### 3.1 Low-Context Classification

The Gate uses **low-context classification**: classification based primarily on information present in the input itself.

**Honest acknowledgment:** All linguistic classification involves some interpretation. We do not claim zero interpretation. We claim *minimized dependence on external context*.

| Low-Context (Preferred) | High-Context (Avoided) |
|-------------------------|------------------------|
| Physical need stated explicitly | Metaphorical language requiring inference |
| Decision alternatives enumerated | Implied decisions requiring history |
| Other agent explicitly referenced | Relationship dynamics requiring interpretation |
| Boundary confusion stated directly | Identity questions requiring deep context |

**Testable criterion:** A classification is low-context if two observers with only the input text would likely agree on the classification. High inter-rater reliability indicates low-context.

### 3.2 Handling Uncertainty

When classification is uncertain, the Gate returns NULL.

**Conditions that trigger NULL:**

| Condition | Rationale |
|-----------|-----------|
| Low confidence in all domains | Cannot justify any signal |
| High confidence in multiple domains | Ambiguous; cannot select one without ranking |
| Input requires normative judgment | Outside scope by design |
| No perturbation detected | Nothing to signal |
| Error in classification process | Fail safe to NULL |

**Note on internal confidence:** The classifier may compute confidence scores internally. These are never exposed in output. The output is always discrete: one signal or NULL.

### 3.3 Asymmetric Cost Policy for D1

D1 (Operational Continuity) has special status because false negatives can be catastrophic.

**Policy:** The confidence threshold for D1 is lower than for other domains.
