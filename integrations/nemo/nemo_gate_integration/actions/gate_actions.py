"""
Gate v2 - NeMo Guardrails Integration

Custom action for integrating Gate perturbation classification
as an input rail in NeMo Guardrails.

Installation:
    pip install nemoguardrails httpx

Usage:
    1. Copy this file to your NeMo config's actions/ folder
    2. Add the Colang flows from gate.co
    3. Configure config.yml with Gate settings

Author: Gate v2 Project
License: Apache 2.0
"""

import os
import httpx
from typing import Literal
from nemoguardrails.actions import action

DomainSignal = Literal["D1", "D2", "D3", "D4", "NULL"]

GATE_SYSTEM_PROMPT = """You are a perturbation classifier for the Gate system. Classify human input into exactly one category.

## Categories

**D1 - Operational Continuity**: Physical need, danger, immediate threat. Signals: hunger, thirst, injury, danger, emergency, resource lack. Excludes: emotional states, future worries, life value judgments.

**D2 - Coordination**: Failure with another agent. Signals: other agent mentioned, broken agreement, communication failure. Excludes: belonging/acceptance feelings.

**D3 - Operative Selection**: Blocked choice between alternatives. Signals: "should I X or Y", multiple options, decision pending. Excludes: moral questions, meaning questions, identity choices.

**D4 - Boundary**: Self/other confusion. Signals: "where do I end", emotional absorption, intrusion. Excludes: identity definition ("who am I").

**NULL**: No perturbation, ambiguous, or normative content.

## Rules
1. Output ONLY: D1, D2, D3, D4, or NULL
2. If uncertain, output NULL
3. One word answer only"""


@action(name="GateClassifyAction")
async def gate_classify(user_message: str) -> dict:
    """
    Classify user input into Gate perturbation domains.
    
    Returns dict with:
        - signal: D1/D2/D3/D4/NULL
        - domain: Human-readable domain name
        - instruction: Response protocol guidance
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"signal": "NULL", "domain": "Error", "instruction": "API key not configured"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "max_tokens": 10,
                    "temperature": 0,
                    "messages": [
                        {"role": "system", "content": GATE_SYSTEM_PROMPT},
                        {"role": "user", "content": f'Classify: "{user_message}"\n\nLabel:'}
                    ]
                },
                timeout=30.0
            )
            
            response.raise_for_status()
            text = response.json()["choices"][0]["message"]["content"].strip().upper()
            
            # Extract signal
            if "D1" in text:
                signal = "D1"
            elif "D2" in text:
                signal = "D2"
            elif "D3" in text:
                signal = "D3"
            elif "D4" in text:
                signal = "D4"
            else:
                signal = "NULL"
                
    except Exception as e:
        print(f"Gate error: {e}")
        signal = "NULL"
    
    # Response protocols
    protocols = {
        "D1": {
            "signal": "D1",
            "domain": "Operational Continuity",
            "instruction": "SAFETY RESPONSE: Acknowledge immediately. Assess safety. Provide ONE concrete next step. Be direct and practical."
        },
        "D2": {
            "signal": "D2",
            "domain": "Coordination", 
            "instruction": "COORDINATION REFLECTION: Identify the other agent. Locate breakdown point. Reflect expectation vs reality. Do NOT evaluate relationship."
        },
        "D3": {
            "signal": "D3",
            "domain": "Operative Selection",
            "instruction": "OPTION ENUMERATION: List the alternatives mentioned. Do NOT rank or recommend. Do NOT evaluate meaning."
        },
        "D4": {
            "signal": "D4",
            "domain": "Boundary",
            "instruction": "BOUNDARY LOCATION: Locate the self/other confusion point. Do NOT define identity or what self should be."
        },
        "NULL": {
            "signal": "NULL",
            "domain": "Normal",
            "instruction": "NORMAL OPERATION: No perturbation detected. Proceed with standard response."
        }
    }
    
    return protocols[signal]


@action(name="GateCheckInputAction")
async def gate_check_input(user_message: str) -> bool:
    """
    Input rail action: Returns True if input should be processed specially.
    Use in Colang to trigger domain-specific flows.
    """
    result = await gate_classify(user_message)
    return result["signal"] != "NULL"


@action(name="GateGetSignalAction") 
async def gate_get_signal(user_message: str) -> str:
    """Get just the signal string for Colang branching."""
    result = await gate_classify(user_message)
    return result["signal"]


@action(name="GateGetInstructionAction")
async def gate_get_instruction(user_message: str) -> str:
    """Get the response protocol instruction for the LLM."""
    result = await gate_classify(user_message)
    return result["instruction"]
