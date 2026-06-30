from fastapi import APIRouter, HTTPException
from db.supabase import supabase
from models.schemas import HandoffRequest, HandoffResponse
from services.delta import get_platform_delta
from uuid import UUID

router = APIRouter()

# TODO: Add auth middleware to get real user_id from JWT
# For now, use hardcoded test user_id from seed.sql
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"


@router.post("/handoff", response_model=HandoffResponse)
async def generate_handoff(request: HandoffRequest):
    """Generate handoff package for a target platform."""
    try:
        # Verify project exists and belongs to user
        project_response = supabase.table("projects").select("*").eq("id", str(request.project_id)).eq("user_id", TEST_USER_ID).execute()
        
        if not project_response.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get the most recent checkpoint for this project
        checkpoint_response = supabase.table("checkpoints").select("*").eq("project_id", str(request.project_id)).order("created_at", desc=True).limit(1).execute()
        
        if not checkpoint_response.data:
            raise HTTPException(status_code=404, detail="No checkpoints found for this project")
        
        current_checkpoint = checkpoint_response.data[0]
        extracted_state = current_checkpoint["extracted_state"]
        
        # Check if target_platform has seen any previous checkpoint
        session_response = supabase.table("platform_sessions").select("*").eq("project_id", str(request.project_id)).eq("platform", request.target_platform).execute()
        
        delta_only = False
        from_checkpoint_id = None
        handoff_package = ""
        
        if session_response.data and session_response.data[0].get("last_checkpoint_id"):
            # Platform has seen a previous checkpoint, calculate delta
            last_checkpoint_id = session_response.data[0]["last_checkpoint_id"]
            delta = await get_platform_delta(str(request.project_id), request.target_platform, current_checkpoint)
            
            if delta:
                delta_only = True
                from_checkpoint_id = UUID(last_checkpoint_id)
                
                # Format delta content
                delta_content = ""
                for key, value in delta.items():
                    if key == "decisions":
                        delta_content += f"\nNew decisions:\n"
                        for i, decision in enumerate(value, 1):
                            delta_content += f"{i}. {decision.get('decision', '')} - {decision.get('reasoning', '')}\n"
                    elif key == "rejected_ideas":
                        delta_content += f"\nNew rejected ideas:\n"
                        for i, idea in enumerate(value, 1):
                            delta_content += f"{i}. {idea.get('idea', '')} - {idea.get('reason', '')}\n"
                    elif key == "open_tasks":
                        delta_content += f"\nNew open tasks:\n"
                        for i, task in enumerate(value, 1):
                            delta_content += f"{i}. {task}\n"
                    elif key == "known_bugs":
                        delta_content += f"\nNew known bugs:\n"
                        for i, bug in enumerate(value, 1):
                            delta_content += f"{i}. {bug}\n"
                    elif key == "constraints":
                        delta_content += f"\nNew constraints:\n"
                        for i, constraint in enumerate(value, 1):
                            delta_content += f"{i}. {constraint}\n"
                    else:
                        delta_content += f"\n{key.replace('_', ' ').title()}: {value}\n"
                
                handoff_package = f"""You previously worked on this project. Here is what changed since your last session:

{delta_content}

CURRENT STATUS:
{extracted_state.get('current_status', 'Unknown')}

Continue from here."""
            else:
                # No delta, send full context
                delta_only = False
                handoff_package = _format_full_handoff(extracted_state)
        else:
            # No previous session, send full context
            delta_only = False
            handoff_package = _format_full_handoff(extracted_state)
        
        # Update platform_sessions to record target_platform has now received this checkpoint
        if session_response.data:
            supabase.table("platform_sessions").update({
                "last_checkpoint_id": current_checkpoint["id"],
                "updated_at": "now()"
            }).eq("id", session_response.data[0]["id"]).execute()
        else:
            supabase.table("platform_sessions").insert({
                "project_id": str(request.project_id),
                "platform": request.target_platform,
                "last_checkpoint_id": current_checkpoint["id"],
                "updated_at": "now()"
            }).execute()
        
        return HandoffResponse(
            handoff_package=handoff_package,
            delta_only=delta_only,
            from_checkpoint_id=from_checkpoint_id
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _format_full_handoff(extracted_state: dict) -> str:
    """Format the full handoff package template."""
    current_goal = extracted_state.get("current_goal", "Unknown")
    current_status = extracted_state.get("current_status", "Unknown")
    decisions = extracted_state.get("decisions", [])
    rejected_ideas = extracted_state.get("rejected_ideas", [])
    open_tasks = extracted_state.get("open_tasks", [])
    known_bugs = extracted_state.get("known_bugs", [])
    constraints = extracted_state.get("constraints", [])
    context_for_next_ai = extracted_state.get("context_for_next_ai", "Unknown")
    
    # Format decisions as numbered list
    decisions_text = ""
    for i, decision in enumerate(decisions, 1):
        decisions_text += f"{i}. {decision.get('decision', '')} - {decision.get('reasoning', '')}\n"
    
    # Format rejected ideas as numbered list
    rejected_text = ""
    for i, idea in enumerate(rejected_ideas, 1):
        rejected_text += f"{i}. {idea.get('idea', '')} - {idea.get('reason', '')}\n"
    
    # Format open tasks as numbered list
    tasks_text = ""
    for i, task in enumerate(open_tasks, 1):
        tasks_text += f"{i}. {task}\n"
    
    # Format known bugs as numbered list
    bugs_text = ""
    for i, bug in enumerate(known_bugs, 1):
        bugs_text += f"{i}. {bug}\n"
    
    # Format constraints as numbered list
    constraints_text = ""
    for i, constraint in enumerate(constraints, 1):
        constraints_text += f"{i}. {constraint}\n"
    
    handoff_package = f"""You are continuing an existing project. Here is everything you need to know.

CURRENT GOAL:
{current_goal}

WHERE WE LEFT OFF:
{current_status}

DECISIONS ALREADY MADE — do not question these unless I ask you to:
{decisions_text if decisions_text else "None"}

REJECTED IDEAS — do not suggest these under any circumstances:
{rejected_text if rejected_text else "None"}

OPEN TASKS:
{tasks_text if tasks_text else "None"}

KNOWN BUGS:
{bugs_text if bugs_text else "None"}

CONSTRAINTS:
{constraints_text if constraints_text else "None"}

CONTEXT:
{context_for_next_ai}

You are now fully briefed. Ask me what I want to work on next."""
    
    return handoff_package
