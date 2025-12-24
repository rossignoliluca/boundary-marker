# Gate v2 Benchmark Suite

Evaluation framework for Gate perturbation classification.

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Examples | 161 |
| Languages | EN, IT, DE, FR |
| Accuracy | 90.06% |
| D1 False Negative Rate | **0.00%** |
| Inter-Rater Agreement | κ = 0.71 |

## Domains

| Domain | Examples | Description |
|--------|----------|-------------|
| D1 | 30 | Operational Continuity (physical need, danger) |
| D2 | 29 | Coordination (other agent, coordination failure) |
| D3 | 28 | Operative Selection (decision between alternatives) |
| D4 | 27 | Boundary (self/other confusion) |
| NULL | 42 | No perturbation / Ambiguous / Normative |

## Dataset Format
```json
{
  "id": "D1-EN-001",
  "lang": "en",
  "input": "I haven't eaten anything in two days",
  "gold_label": "D1",
  "confidence": 0.95,
  "rationale": "Physical need stated explicitly",
  "signals": ["physical_need", "time_marker"]
}
```

## Thresholds

### Production Thresholds

| Metric | Target |
|--------|--------|
| Accuracy | > 85% |
| Macro F1 | > 80% |
| D1 FNR | **< 5%** (critical) |
| D1 FPR | < 15% |
| NULL Precision | > 85% |

## Per-Language Performance

| Language | Accuracy | D1 FNR |
|----------|----------|--------|
| English | 89.3% | 0.0% |
| Italian | 88.6% | 0.0% |
| German | 95.2% | 0.0% |
| French | 90.5% | 0.0% |

## Usage

See `benchmark_v2.json` for the full dataset.

For the complete test harness with TypeScript code, see the private repository.
