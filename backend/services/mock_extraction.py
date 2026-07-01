"""Deterministic extraction for e2e tests when NVIDIA NIM is unavailable."""
from models.schemas import ExtractedState, Decision, RejectedIdea


def mock_extract_state(raw_conversation: str) -> ExtractedState:
    text = raw_conversation.lower()
    fixed_persistence = "fixed the persistence bug" in text or "fixed the persistence" in text

    state = ExtractedState(
        current_goal="Build a todo app with Next.js and Supabase",
        decisions=[
            Decision(
                decision="Use server components for the list and client components for the form",
                reasoning="Stated in conversation",
            ),
            Decision(
                decision="Use Zustand for state management",
                reasoning="Rejected Redux in favor of Zustand",
            ),
        ],
        rejected_ideas=[
            RejectedIdea(idea="Use Redux", reason="Rejected in favor of Zustand"),
        ],
        open_tasks=["Build delete functionality"],
        known_bugs=[] if fixed_persistence else ["Completed items don't persist after page refresh"],
        constraints=["Next.js", "Supabase"],
        current_status=(
            "Persistence bug fixed; delete functionality still open"
            if fixed_persistence
            else "Todo app in progress with persistence bug outstanding"
        ),
        context_for_next_ai=(
            "Todo app using Next.js/Supabase with Zustand. Persistence bug is fixed; delete feature still needed."
            if fixed_persistence
            else "Todo app using Next.js/Supabase with Zustand. Persistence bug needs fixing; delete feature still needed."
        ),
    )
    return state
