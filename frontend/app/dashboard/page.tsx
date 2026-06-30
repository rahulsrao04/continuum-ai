'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getProjects, createProject } from '@/lib/api';
import { Project } from '@/lib/types';
import ProjectCard from '@/components/dashboard/ProjectCard';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Web App',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const newProject = await createProject(formData);
      setProjects([newProject, ...projects]);
      setShowModal(false);
      setFormData({ name: '', description: '', type: 'Web App' });
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1E1E2E] border-t-[#6C63FF]" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Your Projects</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#6C63FF] hover:bg-[#5a52e6] text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">No projects yet</h2>
          <p className="text-[#8888AA] mb-8">
            Start building and save your first checkpoint.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#6C63FF] hover:bg-[#5a52e6] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#8888AA] mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-white placeholder-[#8888AA] focus:outline-none focus:border-[#6C63FF] transition-colors"
                  placeholder="My Awesome Project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8888AA] mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-white placeholder-[#8888AA] focus:outline-none focus:border-[#6C63FF] transition-colors resize-none"
                  placeholder="What are you building?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8888AA] mb-2">
                  Project Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6C63FF] transition-colors"
                >
                  <option value="Web App">Web App</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Script">Script</option>
                  <option value="API">API</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-[#1E1E2E] hover:border-[#6C63FF] text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 bg-[#6C63FF] hover:bg-[#5a52e6] disabled:bg-[#6C63FF]/50 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  {modalLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
