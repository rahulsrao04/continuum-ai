-- ============================================
-- SEED DATA FOR CONTINUUM AI
-- ============================================
-- 
-- This file contains test data to verify the schema works.
-- Run this in the Supabase SQL Editor after running schema.sql
-- 
-- Note: When running this with RLS enabled, you may need to
-- temporarily disable RLS or run this as a service role to insert data.
-- To disable RLS temporarily:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE checkpoints DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE platform_sessions DISABLE ROW LEVEL SECURITY;
-- 
-- Then re-enable after seeding:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE platform_sessions ENABLE ROW LEVEL SECURITY;
-- 
-- ============================================

-- Insert test user
INSERT INTO users (id, email, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', NOW());

-- Insert test project
INSERT INTO projects (id, user_id, name, description, type, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 
 '550e8400-e29b-41d4-a716-446655440000', 
 'Test Project', 
 'A test project for Continuum AI', 
 'web app', 
 NOW());

-- Insert test checkpoints
INSERT INTO checkpoints (id, project_id, platform, raw_conversation_summary, extracted_state, delta, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 
 '550e8400-e29b-41d4-a716-446655440001', 
 'claude', 
 'Initial conversation about building a web application with React and TypeScript',
 '{"current_goal": "Build a React web application", "decisions": ["Use React", "Use TypeScript"], "rejected_ideas": ["Use Vue.js"], "open_tasks": ["Set up project structure", "Install dependencies"], "known_bugs": [], "constraints": ["Must use TypeScript"], "current_status": "Planning phase", "context_for_next_ai": "Starting new project setup"}',
 '{"current_goal": "Build a React web application", "decisions": ["Use React", "Use TypeScript"]}',
 NOW()),
('550e8400-e29b-41d4-a716-446655440003', 
 '550e8400-e29b-41d4-a716-446655440001', 
 'chatgpt', 
 'Follow-up conversation about implementing authentication',
 '{"current_goal": "Implement authentication", "decisions": ["Use Supabase Auth"], "rejected_ideas": ["Build custom auth"], "open_tasks": ["Set up Supabase client", "Create login component"], "known_bugs": [], "constraints": ["Must use Supabase"], "current_status": "Implementation phase", "context_for_next_ai": "Working on authentication flow"}',
 '{"current_goal": "Implement authentication", "decisions": ["Use Supabase Auth"]}',
 NOW());
