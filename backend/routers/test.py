from fastapi import APIRouter, HTTPException
from db.supabase import supabase
from routers import projects, checkpoints, handoff

router = APIRouter()

@router.post("/test/full-flow")
async def test_full_flow():
    """
    Test endpoint that creates a test project, creates two checkpoints with hardcoded data,
    generates a handoff package for ChatGPT, and returns everything for inspection.
    """
    try:
        # Step 1: Create a test project
        test_project_data = {
            "name": "Test Project - Full Flow",
            "description": "Automated test project for full flow verification",
            "type": "web-app"
        }
        
        project_response = supabase.table("projects").insert(test_project_data).execute()
        
        if not project_response.data:
            raise HTTPException(status_code=500, detail="Failed to create test project")
        
        test_project = project_response.data[0]
        project_id = test_project["id"]
        
        # Step 2: Create first checkpoint with hardcoded test data
        checkpoint1_data = {
            "project_id": project_id,
            "platform": "claude",
            "extracted_state": {
                "current_goal": "Build a React todo app with TypeScript",
                "decisions": [
                    {
                        "decision": "Use React with TypeScript",
                        "reasoning": "Type safety and better developer experience"
                    },
                    {
                        "decision": "Use Tailwind CSS for styling",
                        "reasoning": "Rapid development and consistent design"
                    }
                ],
                "rejected_ideas": [
                    {
                        "idea": "Use plain JavaScript",
                        "reason": "Lack of type safety makes it harder to maintain"
                    },
                    {
                        "idea": "Use CSS modules",
                        "reason": "Tailwind is faster for prototyping"
                    }
                ],
                "open_tasks": [
                    "Set up React project structure",
                    "Create TodoItem component",
                    "Implement add/delete functionality",
                    "Add local storage persistence"
                ],
                "known_bugs": [],
                "constraints": [
                    "Must use TypeScript",
                    "Must be responsive",
                    "Must support dark mode"
                ],
                "current_status": "Initial setup complete, starting component development",
                "context_for_next_ai": "Continue building the todo app. Focus on the TodoItem component next."
            },
            "delta": {}
        }
        
        checkpoint1_response = supabase.table("checkpoints").insert(checkpoint1_data).execute()
        
        if not checkpoint1_response.data:
            raise HTTPException(status_code=500, detail="Failed to create first checkpoint")
        
        checkpoint1 = checkpoint1_response.data[0]
        
        # Step 3: Create second checkpoint with updated state
        checkpoint2_data = {
            "project_id": project_id,
            "platform": "claude",
            "extracted_state": {
                "current_goal": "Complete the todo app with local storage",
                "decisions": [
                    {
                        "decision": "Use React with TypeScript",
                        "reasoning": "Type safety and better developer experience"
                    },
                    {
                        "decision": "Use Tailwind CSS for styling",
                        "reasoning": "Rapid development and consistent design"
                    },
                    {
                        "decision": "Use localStorage for persistence",
                        "reasoning": "Simple and works without backend"
                    }
                ],
                "rejected_ideas": [
                    {
                        "idea": "Use plain JavaScript",
                        "reason": "Lack of type safety makes it harder to maintain"
                    },
                    {
                        "idea": "Use CSS modules",
                        "reason": "Tailwind is faster for prototyping"
                    },
                    {
                        "idea": "Use IndexedDB",
                        "reason": "Overkill for simple todo list"
                    }
                ],
                "open_tasks": [
                    "Implement add/delete functionality",
                    "Add local storage persistence",
                    "Add dark mode toggle",
                    "Add edit functionality for todos"
                ],
                "known_bugs": [
                    "Todo items not persisting on refresh",
                    "Dark mode not applying to all components"
                ],
                "constraints": [
                    "Must use TypeScript",
                    "Must be responsive",
                    "Must support dark mode"
                ],
                "current_status": "TodoItem component complete, working on persistence",
                "context_for_next_ai": "Implement localStorage persistence for the todo list. Fix the dark mode issue with the header component."
            },
            "delta": {
                "open_tasks": ["Add local storage persistence", "Add dark mode toggle", "Add edit functionality for todos"],
                "known_bugs": ["Todo items not persisting on refresh", "Dark mode not applying to all components"],
                "decisions": [
                    {
                        "decision": "Use localStorage for persistence",
                        "reasoning": "Simple and works without backend"
                    }
                ],
                "rejected_ideas": [
                    {
                        "idea": "Use IndexedDB",
                        "reason": "Overkill for simple todo list"
                    }
                ]
            }
        }
        
        checkpoint2_response = supabase.table("checkpoints").insert(checkpoint2_data).execute()
        
        if not checkpoint2_response.data:
            raise HTTPException(status_code=500, detail="Failed to create second checkpoint")
        
        checkpoint2 = checkpoint2_response.data[0]
        
        # Step 4: Generate handoff package for ChatGPT
        handoff_request = {
            "project_id": project_id,
            "target_platform": "chatgpt"
        }
        
        handoff_response = await handoff.generate_handoff(handoff_request)
        
        # Step 5: Return everything for inspection
        return {
            "success": True,
            "project": test_project,
            "checkpoints": [checkpoint1, checkpoint2],
            "handoff": handoff_response,
            "summary": {
                "project_id": project_id,
                "checkpoint_count": 2,
                "handoff_platform": "chatgpt",
                "handoff_package_length": len(handoff_response.get("handoff_package", ""))
            }
        }
        
    except Exception as e:
        # Clean up test data if something failed
        try:
            if 'project_id' in locals():
                supabase.table("checkpoints").delete().eq("project_id", project_id).execute()
                supabase.table("projects").delete().eq("id", project_id).execute()
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Test flow failed: {str(e)}")
