import { Project, Checkpoint, HandoffResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'API request failed');
  }
  return response.json();
}

export async function createProject(data: { name: string, description?: string, type: string }): Promise<Project> {
  const response = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Project>(response);
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${API_URL}/api/projects`);
  return handleResponse<Project[]>(response);
}

export async function getProject(id: string): Promise<Project> {
  const response = await fetch(`${API_URL}/api/projects/${id}`);
  return handleResponse<Project>(response);
}

export async function createCheckpoint(data: { project_id: string, platform: string, raw_conversation_summary: string }): Promise<Checkpoint> {
  const response = await fetch(`${API_URL}/api/checkpoints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Checkpoint>(response);
}

export async function getCheckpoints(projectId: string): Promise<Checkpoint[]> {
  const response = await fetch(`${API_URL}/api/checkpoints/${projectId}`);
  return handleResponse<Checkpoint[]>(response);
}

export async function generateHandoff(projectId: string, targetPlatform: string): Promise<HandoffResponse> {
  const response = await fetch(`${API_URL}/api/handoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, target_platform: targetPlatform }),
  });
  return handleResponse<HandoffResponse>(response);
}
