from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str


class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    type: str
    created_at: datetime

    class Config:
        from_attributes = True


class CheckpointCreate(BaseModel):
    project_id: UUID
    platform: str
    raw_conversation_summary: str


class Decision(BaseModel):
    decision: str
    reasoning: str


class RejectedIdea(BaseModel):
    idea: str
    reason: str


class ExtractedState(BaseModel):
    current_goal: str
    decisions: List[Decision]
    rejected_ideas: List[RejectedIdea]
    open_tasks: List[str]
    known_bugs: List[str]
    constraints: List[str]
    current_status: str
    context_for_next_ai: str


class CheckpointResponse(BaseModel):
    id: UUID
    project_id: UUID
    platform: str
    extracted_state: ExtractedState
    delta: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class HandoffRequest(BaseModel):
    project_id: UUID
    target_platform: str


class HandoffResponse(BaseModel):
    handoff_package: str
    delta_only: bool
    from_checkpoint_id: Optional[UUID] = None
