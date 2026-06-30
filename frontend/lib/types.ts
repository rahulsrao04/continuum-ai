export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  type: string
  created_at: string
}

export interface ExtractedState {
  current_goal: string
  decisions: Array<{ decision: string; reasoning: string }>
  rejected_ideas: Array<{ idea: string; reason: string }>
  open_tasks: string[]
  known_bugs: string[]
  constraints: string[]
  current_status: string
  context_for_next_ai: string
}

export interface Checkpoint {
  id: string
  project_id: string
  platform: string
  extracted_state: ExtractedState
  delta: Record<string, any>
  created_at: string
}

export interface PlatformSession {
  id: string
  project_id: string
  platform: string
  last_checkpoint_id: string
  conversation_url?: string
  updated_at: string
}

export interface HandoffRequest {
  project_id: string
  target_platform: string
}

export interface HandoffResponse {
  handoff_package: string
  delta_only: boolean
  from_checkpoint_id?: string
}
