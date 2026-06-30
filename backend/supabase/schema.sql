-- ============================================
-- SUPABASE DATABASE SETUP FOR CONTINUUM AI
-- ============================================
-- 
-- STEP BY STEP INSTRUCTIONS:
-- 
-- 1. Open your Supabase project dashboard
-- 2. Navigate to the SQL Editor (icon looks like a terminal)
-- 3. Click "New Query"
-- 4. Copy and paste this entire SQL file into the editor
-- 5. Click "Run" to execute the schema setup
-- 
-- This will:
-- - Enable the pgvector extension for vector operations
-- - Create all required tables (users, projects, checkpoints, platform_sessions)
-- - Add necessary indexes for performance
-- - Enable Row Level Security (RLS) on all tables
-- - Create policies to ensure users can only access their own data
-- 
-- ============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT, -- web app, mobile app, script, other
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create checkpoints table
CREATE TABLE checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- claude, chatgpt, gemini, grok, perplexity
    raw_conversation_summary TEXT,
    extracted_state JSONB, -- stores: current_goal, decisions, rejected_ideas, open_tasks, known_bugs, constraints, current_status, context_for_next_ai
    delta JSONB, -- stores only what changed since previous checkpoint
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create platform_sessions table
CREATE TABLE platform_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    last_checkpoint_id UUID REFERENCES checkpoints(id),
    conversation_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_checkpoints_project_id ON checkpoints(project_id);
CREATE INDEX idx_checkpoints_created_at ON checkpoints(created_at);
CREATE INDEX idx_platform_sessions_project_id ON platform_sessions(project_id);
CREATE INDEX idx_platform_sessions_platform ON platform_sessions(platform);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for checkpoints table (join through projects to verify ownership)
CREATE POLICY "Users can view checkpoints for their projects" ON checkpoints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = checkpoints.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert checkpoints for their projects" ON checkpoints
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = checkpoints.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update checkpoints for their projects" ON checkpoints
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = checkpoints.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete checkpoints for their projects" ON checkpoints
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = checkpoints.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- RLS Policies for platform_sessions table (join through projects to verify ownership)
CREATE POLICY "Users can view platform_sessions for their projects" ON platform_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = platform_sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert platform_sessions for their projects" ON platform_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = platform_sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update platform_sessions for their projects" ON platform_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = platform_sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete platform_sessions for their projects" ON platform_sessions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = platform_sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );
