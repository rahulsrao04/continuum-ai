from fastapi import APIRouter, HTTPException
from db.supabase import supabase
from models.schemas import CheckpointCreate, CheckpointResponse
from services.extraction import extract_state, calculate_delta, ExtractedState
from uuid import UUID

router = APIRouter()

# TODO: Add auth middleware to get real user_id from JWT
# For now, use hardcoded test user_id from seed.sql
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"


@router.post("/checkpoints", response_model=CheckpointResponse)
async def create_checkpoint(checkpoint: CheckpointCreate):
    """Create a new checkpoint with extracted state and delta."""
    try:
        # Verify project exists and belongs to user
        project_response = supabase.table("projects").select("*").eq("id", str(checkpoint.project_id)).eq("user_id", TEST_USER_ID).execute()
        
        if not project_response.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Extract state from raw conversation
        extracted_state = await extract_state(checkpoint.raw_conversation_summary)
        
        # Get previous checkpoint for this project if it exists
        previous_checkpoint_response = supabase.table("checkpoints").select("*").eq("project_id", str(checkpoint.project_id)).order("created_at", desc=True).limit(1).execute()
        
        delta = None
        if previous_checkpoint_response.data:
            previous_state = ExtractedState(**previous_checkpoint_response.data[0]["extracted_state"])
            delta = calculate_delta(previous_state, extracted_state)
        
        # Save checkpoint to Supabase
        checkpoint_data = {
            "project_id": str(checkpoint.project_id),
            "platform": checkpoint.platform,
            "raw_conversation_summary": checkpoint.raw_conversation_summary,
            "extracted_state": extracted_state.model_dump(),
            "delta": delta
        }
        
        checkpoint_response = supabase.table("checkpoints").insert(checkpoint_data).execute()
        
        if not checkpoint_response.data:
            raise HTTPException(status_code=500, detail="Failed to create checkpoint")
        
        new_checkpoint = checkpoint_response.data[0]
        
        # Update or create platform_sessions record
        session_response = supabase.table("platform_sessions").select("*").eq("project_id", str(checkpoint.project_id)).eq("platform", checkpoint.platform).execute()
        
        if session_response.data:
            # Update existing session
            supabase.table("platform_sessions").update({
                "last_checkpoint_id": new_checkpoint["id"],
                "updated_at": "now()"
            }).eq("id", session_response.data[0]["id"]).execute()
        else:
            # Create new session
            supabase.table("platform_sessions").insert({
                "project_id": str(checkpoint.project_id),
                "platform": checkpoint.platform,
                "last_checkpoint_id": new_checkpoint["id"],
                "updated_at": "now()"
            }).execute()
        
        return CheckpointResponse(**new_checkpoint)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/checkpoints/{project_id}", response_model=list[CheckpointResponse])
async def list_checkpoints(project_id: UUID):
    """List all checkpoints for a project ordered by created_at descending."""
    try:
        # Verify project exists and belongs to user
        project_response = supabase.table("projects").select("*").eq("id", str(project_id)).eq("user_id", TEST_USER_ID).execute()
        
        if not project_response.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get checkpoints
        checkpoints_response = supabase.table("checkpoints").select("*").eq("project_id", str(project_id)).order("created_at", desc=True).execute()
        
        return [CheckpointResponse(**checkpoint) for checkpoint in checkpoints_response.data]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
