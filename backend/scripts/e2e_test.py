#!/usr/bin/env python3
"""
End-to-end API test for Continuum AI handoff flows.

Run from backend/ with the API server up:
  py -m uvicorn main:app --port 8000
  py scripts/e2e_test.py

Tests scenarios 1–3 at the API layer (extraction, checkpoints, handoff, delta).
"""
import asyncio
import json
import sys
import httpx

API = "http://127.0.0.1:8000"
TEST_USER_PROJECT_PREFIX = "E2E Todo App"

CONVERSATION_1 = """Human: I'm building a todo app with Next.js and Supabase. I've decided to use server components for the list and client components for the form. I tried using Redux but rejected it in favor of Zustand for state management. I still need to build the delete functionality and there's a bug where completed items don't persist after page refresh."""

CONVERSATION_2 = """Human: I'm building a todo app with Next.js and Supabase. I've decided to use server components for the list and client components for the form. I tried using Redux but rejected it in favor of Zustand for state management. I still need to build the delete functionality and there's a bug where completed items don't persist after page refresh.

ChatGPT: I can help fix the persistence bug. Let's use localStorage or Supabase to persist completed state.

Human: Great, we fixed the persistence bug. Completed items now survive page refresh. Delete functionality is still open."""


def assert_contains(text: str, needle: str, label: str):
    if needle.lower() not in text.lower():
        raise AssertionError(f"{label}: expected '{needle}' in text")


def assert_state_field(state: dict, field: str, needles: list[str]):
    blob = json.dumps(state.get(field, [])).lower()
    for n in needles:
        if n.lower() not in blob and n.lower() not in str(state.get("current_goal", "")).lower():
            raise AssertionError(f"extracted_state.{field} missing '{n}'")


async def main():
    async with httpx.AsyncClient(timeout=120.0) as client:
        # Health
        health = await client.get(f"{API}/health")
        health.raise_for_status()
        print("[OK] Health check OK")

        nim = await client.get(f"{API}/health/nim")
        nim_data = nim.json()
        if nim_data.get("status") != "ok":
            print(f"[WARN] NVIDIA NIM health: {nim_data}")
        else:
            print("[OK] NVIDIA NIM OK")

        # --- Scenario 1: create project + checkpoint from Claude conversation ---
        project_res = await client.post(f"{API}/api/projects", json={
            "name": TEST_USER_PROJECT_PREFIX,
            "description": "E2E test project",
            "type": "web-app",
        })
        project_res.raise_for_status()
        project = project_res.json()
        project_id = project["id"]
        print(f"[OK] Created project {project_id}")

        cp1_res = await client.post(f"{API}/api/checkpoints", json={
            "project_id": project_id,
            "platform": "claude",
            "raw_conversation_summary": CONVERSATION_1,
        })
        cp1_res.raise_for_status()
        cp1 = cp1_res.json()
        state1 = cp1["extracted_state"]
        print("[OK] Checkpoint 1 saved")

        assert_contains(state1.get("current_goal", ""), "todo", "current_goal")
        assert_state_field(state1, "decisions", ["server", "zustand"])
        assert_state_field(state1, "rejected_ideas", ["redux"])
        assert_state_field(state1, "open_tasks", ["delete"])
        assert_state_field(state1, "known_bugs", ["persist"])
        print("[OK] Scenario 1: extracted state validated")

        # Handoff to ChatGPT (first time = full package)
        handoff1_res = await client.post(f"{API}/api/handoff", json={
            "project_id": project_id,
            "target_platform": "chatgpt",
        })
        handoff1_res.raise_for_status()
        handoff1 = handoff1_res.json()
        pkg1 = handoff1["handoff_package"]

        assert not handoff1["delta_only"], "First ChatGPT handoff should be full context"
        assert_contains(pkg1, "zustand", "handoff package")
        assert_contains(pkg1, "redux", "handoff package")
        assert_contains(pkg1, "persist", "handoff package")
        print(f"[OK] Scenario 1: ChatGPT handoff generated ({len(pkg1)} chars, full)")

        # --- Scenario 2: second checkpoint on ChatGPT, delta handoff to Claude ---
        cp2_res = await client.post(f"{API}/api/checkpoints", json={
            "project_id": project_id,
            "platform": "chatgpt",
            "raw_conversation_summary": CONVERSATION_2,
        })
        cp2_res.raise_for_status()
        cp2 = cp2_res.json()
        state2 = cp2["extracted_state"]
        delta2 = cp2.get("delta") or {}
        print("[OK] Checkpoint 2 saved")

        if delta2.get("resolved_bugs"):
            print(f"  delta resolved_bugs: {delta2['resolved_bugs']}")
        else:
            print(f"  [WARN] delta keys: {list(delta2.keys())} (resolved_bugs may depend on LLM output)")

        handoff2_res = await client.post(f"{API}/api/handoff", json={
            "project_id": project_id,
            "target_platform": "claude",
        })
        handoff2_res.raise_for_status()
        handoff2 = handoff2_res.json()
        pkg2 = handoff2["handoff_package"]

        if handoff2["delta_only"]:
            assert "DECISIONS ALREADY MADE" not in pkg2 or len(pkg2) < len(pkg1), (
                "Delta handoff should be shorter than full handoff"
            )
            print(f"[OK] Scenario 2: Claude delta handoff ({len(pkg2)} chars, delta_only=True)")
            if "resolved" in pkg2.lower() or "fixed" in pkg2.lower():
                print("  [OK] Delta mentions resolved/fixed bug")
        else:
            print(f"  [WARN] Claude handoff was full package (no prior Claude session) — {len(pkg2)} chars")

        # --- Scenario 3: manual handoff to Gemini ---
        handoff3_res = await client.post(f"{API}/api/handoff", json={
            "project_id": project_id,
            "target_platform": "gemini",
        })
        handoff3_res.raise_for_status()
        handoff3 = handoff3_res.json()
        pkg3 = handoff3["handoff_package"]
        assert_contains(pkg3, "todo", "Gemini handoff")
        print(f"[OK] Scenario 3: Gemini handoff ({len(pkg3)} chars)")

        print("\n=== All API e2e checks passed ===")
        print(f"Project ID: {project_id}")
        return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(main()))
    except httpx.ConnectError:
        print("ERROR: Cannot connect to API. Start the server: py -m uvicorn main:app --port 8000")
        sys.exit(1)
    except AssertionError as e:
        print(f"FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
