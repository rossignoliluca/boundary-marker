# Gate v2 - NeMo Guardrails Integration

This package integrates Gate v2 perturbation classification as an input rail in NVIDIA NeMo Guardrails.

## What is Gate?

Gate is a pre-generation classification layer that detects human perturbation states and signals them to downstream LLMs. Unlike content safety systems that ask "Is this harmful?", Gate asks "Which human operative domain is perturbed?"

### The Four Domains

| Signal | Domain | Perturbation | Response Protocol |
|--------|--------|--------------|-------------------|
| D1 | Operational Continuity | Physical need, danger, emergency | Safety response: direct, practical, ONE action |
| D2 | Coordination | Failure with another agent | Reflection: locate breakdown, don't judge |
| D3 | Operative Selection | Blocked choice between options | Enumeration: list alternatives, don't recommend |
| D4 | Boundary | Self/other confusion | Location: find confusion point, don't define identity |
| NULL | Normal | No perturbation | Standard LLM behavior |

## Installation

```bash
pip install nemoguardrails httpx
```

## Setup

1. Copy this folder to your NeMo project:
```
your_project/
├── config.yml          # Main NeMo config (copy or merge)
├── gate.co            # Colang flows
└── actions/
    └── gate_actions.py # Gate classification actions
```

2. Set your OpenAI API key:
```bash
export OPENAI_API_KEY="sk-your-key-here"
```

3. Run NeMo Guardrails:
```python
from nemoguardrails import RailsConfig, LLMRails

config = RailsConfig.from_path("./your_project")
rails = LLMRails(config)

response = await rails.generate_async(
    messages=[{"role": "user", "content": "I haven't eaten in two days"}]
)
print(response)
# Gate detects D1 → Safety response protocol activates
```

## How It Works

```
User Input
    │
    ▼
┌──────────────────┐
│ Gate Input Rail  │  ← gate.co flow triggers
│                  │
│ GateClassifyAction │ ← Calls GPT-4o classifier
│                  │
│ Returns: D1/D2/D3/D4/NULL
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
  NULL    D1-D4
    │         │
    ▼         ▼
 Normal   Protocol Injection
   LLM    (instruction added)
    │         │
    └────┬────┘
         │
         ▼
     Response
```

## Configuration Options

### config.yml

```yaml
# Use different OpenAI model
models:
  - type: main
    engine: openai
    model: gpt-4o-mini  # Faster, cheaper

# Enable/disable Gate
rails:
  input:
    enabled: true   # Set false to disable Gate
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| OPENAI_API_KEY | OpenAI API key for classifier | Yes |

## Custom Actions

### GateClassifyAction

Main classification action. Returns full result dict:

```python
{
    "signal": "D1",
    "domain": "Operational Continuity",
    "instruction": "SAFETY RESPONSE: ..."
}
```

### GateGetSignalAction

Returns only the signal string (D1/D2/D3/D4/NULL). Useful for Colang branching.

### GateGetInstructionAction

Returns only the response protocol instruction string.

## Benchmark Results

Gate v2 achieves:
- **96.27% accuracy** on benchmark dataset
- **0% D1 false negative rate** (no missed emergencies)
- **96.61% macro F1 score**

## Architecture

Gate follows a strict Constitutional architecture:

- **Article I**: Regulator routes or vetos, never generates content
- **Article II**: All functions halt intrinsically
- **Article III**: Domains never communicate or integrate
- **Article IV**: Exterior (NULL) is always reachable
- **Article V**: System never defines identity, meaning, or telos

## Integration with Other Rails

Gate works alongside other NeMo rails:

```yaml
input:
  flows:
    - gate input rail        # Gate first
    - check jailbreak        # Then other rails
    - check topic allowed
```

Gate is **complementary** to content safety systems. It operates on a different dimension (perturbation vs. harm).

## Troubleshooting

### "API key not configured"
Set `OPENAI_API_KEY` environment variable.

### Gate always returns NULL
Check that:
1. API key is valid
2. Network can reach OpenAI
3. Input is being passed correctly

### Response doesn't follow protocol
The protocol is injected as an instruction, not enforced. For stricter enforcement, add output rails that verify compliance.

## License

Apache 2.0

## Links

- [Gate v2 Theoretical Foundation](https://github.com/your-repo/boundary-marker)
- [NeMo Guardrails Documentation](https://docs.nvidia.com/nemo/guardrails/)
- [Response Protocol Specification](./RESPONSE_PROTOCOL.md)
