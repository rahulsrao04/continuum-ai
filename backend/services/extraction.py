import os
import httpx
import json
import re
from typing import Optional
from pydantic import ValidationError
from models.schemas import ExtractedState, Decision, RejectedIdea
from dotenv import load_dotenv

load_dotenv()

NVIDIA_NIM_API_KEY = os.getenv("NVIDIA_NIM_API_KEY")


def _clean_json_content(content: str) -> str:
    """Strip markdown fences and extract JSON object from model output."""
    content = content.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)
    # If model wrapped JSON in prose, extract the outermost object
    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1 and end > start:
        content = content[start : end + 1]
    return content.strip()


def _parse_extracted_state(content: str) -> ExtractedState:
    state_dict = json.loads(_clean_json_content(content))
    return ExtractedState(**state_dict)


async def extract_state(raw_conversation: str, previous_state: Optional[dict] = None) -> ExtractedState:
    """
    Extract structured project state from raw conversation text using NVIDIA NIM API.
    Includes retry logic for JSON parsing failures.
    """
    if os.getenv("MOCK_EXTRACTION", "").lower() in ("1", "true", "yes"):
        from services.mock_extraction import mock_extract_state
        return mock_extract_state(raw_conversation)

    if not NVIDIA_NIM_API_KEY:
        raise ValueError("NVIDIA_NIM_API_KEY must be set in environment variables")

    system_prompt = """You are a technical project state extractor. Your job is to analyze AI coding conversations and extract structured project state. You must respond with valid JSON only, no markdown, no explanation. Extract exactly what is present in the conversation, do not invent or assume anything not explicitly stated."""

    user_prompt = f"""Analyze this conversation and extract the project state in this exact JSON structure:

{{
  "current_goal": "what the user is trying to build or solve right now",
  "decisions": [{{"decision": "...", "reasoning": "..."}}],
  "rejected_ideas": [{{"idea": "...", "reason": "..."}}],
  "open_tasks": ["..."],
  "known_bugs": ["..."],
  "constraints": ["..."],
  "current_status": "exactly where we left off in plain English",
  "context_for_next_ai": "a 2-3 sentence briefing paragraph that gets a new AI up to speed instantly"
}}

Conversation:
{raw_conversation}"""

    headers = {
        "Authorization": f"Bearer {NVIDIA_NIM_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "meta/llama-3.3-70b-instruct",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3,
        "response_format": {"type": "json_object"}
    }

    max_retries = 3
    last_error = None

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://integrate.api.nvidia.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                return _parse_extracted_state(content)
        except (json.JSONDecodeError, ValidationError, KeyError, TypeError) as e:
            last_error = e
            # Make prompt stricter on retry
            if attempt < max_retries - 1:
                stricter_user_prompt = f"""You must respond with valid JSON only. No markdown, no explanation, no code blocks. Extract project state from this conversation:

{{
  "current_goal": "...",
  "decisions": [{{"decision": "...", "reasoning": "..."}}],
  "rejected_ideas": [{{"idea": "...", "reason": "..."}}],
  "open_tasks": ["..."],
  "known_bugs": ["..."],
  "constraints": ["..."],
  "current_status": "...",
  "context_for_next_ai": "..."
}}

Conversation:
{raw_conversation}"""

                payload["messages"][1]["content"] = stricter_user_prompt
                payload["temperature"] = 0.1  # Lower temperature for more deterministic output
    
    # All retries failed, return sensible default
    return ExtractedState(
        current_goal="Unknown",
        decisions=[],
        rejected_ideas=[],
        open_tasks=[],
        known_bugs=[],
        constraints=[],
        current_status=f"Error extracting state: {str(last_error)}",
        context_for_next_ai="State extraction failed. Please provide context manually."
    )


def calculate_delta(previous_state: ExtractedState, current_state: ExtractedState) -> dict:
    """
    Compare two states and return only what changed.
    """
    delta = {}

    # Compare current_goal
    if previous_state.current_goal != current_state.current_goal:
        delta["current_goal"] = current_state.current_goal

    # Compare decisions - find new decisions
    prev_decisions = {d.decision for d in previous_state.decisions}
    new_decisions = [d for d in current_state.decisions if d.decision not in prev_decisions]
    if new_decisions:
        delta["decisions"] = [d.model_dump() for d in new_decisions]

    # Compare rejected_ideas - find new rejections
    prev_rejected = {r.idea for r in previous_state.rejected_ideas}
    new_rejected = [r for r in current_state.rejected_ideas if r.idea not in prev_rejected]
    if new_rejected:
        delta["rejected_ideas"] = [r.model_dump() for r in new_rejected]

    # Compare known_bugs - find new and resolved bugs
    prev_bugs = set(previous_state.known_bugs)
    curr_bugs = set(current_state.known_bugs)
    new_bugs = [b for b in current_state.known_bugs if b not in prev_bugs]
    if new_bugs:
        delta["known_bugs"] = new_bugs
    resolved_bugs = [b for b in previous_state.known_bugs if b not in curr_bugs]
    if resolved_bugs:
        delta["resolved_bugs"] = resolved_bugs

    # Compare open_tasks - find new and completed tasks
    prev_tasks = set(previous_state.open_tasks)
    curr_tasks = set(current_state.open_tasks)
    new_tasks = [t for t in current_state.open_tasks if t not in prev_tasks]
    if new_tasks:
        delta["open_tasks"] = new_tasks
    completed_tasks = [t for t in previous_state.open_tasks if t not in curr_tasks]
    if completed_tasks:
        delta["completed_tasks"] = completed_tasks

    # Compare constraints - find new constraints
    prev_constraints = set(previous_state.constraints)
    new_constraints = [c for c in current_state.constraints if c not in prev_constraints]
    if new_constraints:
        delta["constraints"] = new_constraints

    # Compare current_status
    if previous_state.current_status != current_state.current_status:
        delta["current_status"] = current_state.current_status

    # Compare context_for_next_ai
    if previous_state.context_for_next_ai != current_state.context_for_next_ai:
        delta["context_for_next_ai"] = current_state.context_for_next_ai

    return delta
