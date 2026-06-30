const CONFIG = {
  API_URL: 'PRODUCTION_API_URL', // Replace with actual Render URL after deployment
  SUPABASE_URL: 'https://wkponoglvdnkebqioyli.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcG9ub2dsdmRua2VicWlveWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5Mjc0NjEsImV4cCI6MjA5NzUwMzQ2MX0.nkRvio4fiBq5DDU5PjEJ2Tz7Fxk02zPEh3QbRbsPbiU'
};

async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['continuum_auth_token'], (result) => {
      resolve(result.continuum_auth_token || null);
    });
  });
}

async function createCheckpoint(projectId, platform, rawConversationSummary) {
  const token = await getAuthToken();
  const response = await fetch(`${CONFIG.API_URL}/api/checkpoints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      project_id: projectId,
      platform: platform,
      raw_conversation_summary: rawConversationSummary,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create checkpoint');
  }

  return response.json();
}

async function generateHandoff(projectId, targetPlatform) {
  const token = await getAuthToken();
  const response = await fetch(`${CONFIG.API_URL}/api/handoff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      project_id: projectId,
      target_platform: targetPlatform,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to generate handoff');
  }

  return response.json();
}

async function getProjects() {
  const token = await getAuthToken();
  const response = await fetch(`${CONFIG.API_URL}/api/projects`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch projects');
  }

  return response.json();
}

async function createProject(name, description, type) {
  const token = await getAuthToken();
  const response = await fetch(`${CONFIG.API_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: name,
      description: description,
      type: type,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create project');
  }

  return response.json();
}
