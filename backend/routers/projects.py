from fastapi import APIRouter, HTTPException
from db.supabase import supabase
from models.schemas import ProjectCreate, ProjectResponse
from uuid import UUID

router = APIRouter()

# TODO: Add auth middleware to get real user_id from JWT
# For now, use hardcoded test user_id from seed.sql
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"


@router.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate):
    """Create a new project."""
    try:
        response = supabase.table("projects").insert({
            "user_id": TEST_USER_ID,
            "name": project.name,
            "description": project.description,
            "type": project.type
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create project")
        
        return ProjectResponse(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects():
    """List all projects for the authenticated user."""
    try:
        response = supabase.table("projects").select("*").eq("user_id", TEST_USER_ID).execute()
        return [ProjectResponse(**project) for project in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: UUID):
    """Get a single project with its checkpoint count."""
    try:
        # Get project
        project_response = supabase.table("projects").select("*").eq("id", str(project_id)).eq("user_id", TEST_USER_ID).execute()
        
        if not project_response.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = project_response.data[0]
        
        # Get checkpoint count
        checkpoints_response = supabase.table("checkpoints").select("id", count="exact").eq("project_id", str(project_id)).execute()
        checkpoint_count = len(checkpoints_response.data)
        
        # Add checkpoint count to project (not in schema, but useful)
        project["checkpoint_count"] = checkpoint_count
        
        return ProjectResponse(**project)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
