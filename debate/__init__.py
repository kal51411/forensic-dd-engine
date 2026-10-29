"""Adversarial debate package for forensic auditing."""

from debate.schemas import (
    AgentRole,
    DebateTurn,
    FactCheckVerdict,
    JudgeVerdict,
)
from debate.agents import (
    BearAgent,
    BullAgent,
    FactCheckerAgent,
    JudgeAgent,
)
from debate.orchestrator import ForensicDebateOrchestrator

__all__ = [
    "AgentRole",
    "DebateTurn",
    "FactCheckVerdict",
    "JudgeVerdict",
    "BearAgent",
    "BullAgent",
    "FactCheckerAgent",
    "JudgeAgent",
    "ForensicDebateOrchestrator",
]
