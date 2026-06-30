from db.supabase import supabase
from services.extraction import calculate_delta, ExtractedState


async def get_platform_delta(project_id: str, target_platform: str, current_checkpoint: dict) -> dict:
    """
    Query platform_sessions to find the last checkpoint this platform received.
    Calculate delta from that checkpoint to the current one.
    """
    # Query platform_sessions for this project and platform
    response = supabase.table("platform_sessions").select("*").eq("project_id", project_id).eq("platform", target_platform).execute()
    
    if not response.data:
        # No previous session exists, return None (send full context)
        return None
    
    session = response.data[0]
    last_checkpoint_id = session.get("last_checkpoint_id")
    
    if not last_checkpoint_id:
        # Session exists but no checkpoint recorded, return None
        return None
    
    # Get the last checkpoint
    last_checkpoint_response = supabase.table("checkpoints").select("*").eq("id", last_checkpoint_id).execute()
    
    if not last_checkpoint_response.data:
        # Checkpoint not found, return None
        return None
    
    last_checkpoint = last_checkpoint_response.data[0]
    
    # Calculate delta between last checkpoint and current checkpoint
    current_state = ExtractedState(**current_checkpoint["extracted_state"])
    last_state = ExtractedState(**last_checkpoint["extracted_state"])
    
    delta = calculate_delta(last_state, current_state)
    
    return delta
