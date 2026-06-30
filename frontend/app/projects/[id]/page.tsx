'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, CheckCircle2, AlertCircle, List, Bug } from 'lucide-react';
import { getProject, getCheckpoints, generateHandoff } from '@/lib/api';
import { Project, Checkpoint, HandoffResponse } from '@/lib/types';
import CheckpointTimeline from '@/components/dashboard/CheckpointTimeline';
import PlatformBadge from '@/components/dashboard/PlatformBadge';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffResponse, setHandoffResponse] = useState<HandoffResponse | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const [projectData, checkpointsData] = await Promise.all([
        getProject(projectId),
        getCheckpoints(projectId),
      ]);
      setProject(projectData);
      setCheckpoints(checkpointsData);
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHandoff = async (platform: string) => {
    setSelectedPlatform(platform);
    setHandoffLoading(true);
    setHandoffResponse(null);

    try {
      const response = await generateHandoff(projectId, platform);
      setHandoffResponse(response);
    } catch (error) {
      console.error('Failed to generate handoff:', error);
    } finally {
      setHandoffLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (handoffResponse) {
      navigator.clipboard.writeText(handoffResponse.handoff_package);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const platforms = [
    { name: 'ChatGPT', color: '#10A37F' },
    { name: 'Gemini', color: '#4285F4' },
    { name: 'Grok', color: '#FFFFFF' },
    { name: 'Perplexity', color: '#20B2AA' },
  ];

  const getPlatformUrl = (platform: string) => {
    const urls: Record<string, string> = {
      ChatGPT: 'https://chat.openai.com',
      Gemini: 'https://gemini.google.com',
      Grok: 'https://grok.x.ai',
      Perplexity: 'https://perplexity.ai',
    };
    return urls[platform] || '#';
  };

  const latestCheckpoint = checkpoints.length > 0 ? checkpoints[0] : null;
  const latestState = latestCheckpoint?.extracted_state;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1E1E2E] border-t-[#6C63FF]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">Project not found</h2>
        <Link href="/dashboard" className="text-[#6C63FF] hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#8888AA] mb-6">
        <Link href="/dashboard" className="hover:text-white transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-white">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-[#8888AA]">{project.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowHandoffModal(true)}
            className="bg-[#6C63FF] hover:bg-[#5a52e6] text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Generate Handoff
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#6C63FF]/10 text-[#6C63FF]">
            {project.type}
          </span>
          {latestCheckpoint && (
            <div className="flex items-center gap-2">
              <PlatformBadge platform={latestCheckpoint.platform} />
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - Checkpoint Timeline */}
        <div className="lg:col-span-3">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Checkpoints</h2>
            <CheckpointTimeline checkpoints={checkpoints} />
          </div>
        </div>

        {/* Right Column - Current State */}
        <div className="lg:col-span-2">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 sticky top-8">
            <h2 className="text-xl font-bold text-white mb-6">Current State</h2>
            
            {latestState ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#6C63FF] mb-2">Current Goal</h3>
                  <p className="text-white">{latestState.current_goal}</p>
                </div>

                {latestState.open_tasks && latestState.open_tasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#6C63FF] mb-3 flex items-center gap-2">
                      <List size={16} />
                      Open Tasks
                    </h3>
                    <ul className="space-y-2">
                      {latestState.open_tasks.map((task, idx) => (
                        <li key={idx} className="text-sm text-white flex items-start gap-2">
                          <span className="text-[#6C63FF] mt-0.5">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestState.known_bugs && latestState.known_bugs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                      <Bug size={16} />
                      Known Bugs
                    </h3>
                    <ul className="space-y-2">
                      {latestState.known_bugs.map((bug, idx) => (
                        <li key={idx} className="text-sm text-white flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>{bug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestState.decisions && latestState.decisions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#6C63FF] mb-3">Decisions</h3>
                    <ol className="list-decimal list-inside space-y-2">
                      {latestState.decisions.map((decision, idx) => (
                        <li key={idx} className="text-sm text-white">
                          <span className="font-medium">{decision.decision}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="pt-4 border-t border-[#1E1E2E]">
                  <p className="text-xs text-[#8888AA]">
                    Last saved {getRelativeTime(latestCheckpoint.created_at)} from{' '}
                    <PlatformBadge platform={latestCheckpoint.platform} />
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#8888AA]">
                <p>No checkpoints yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Handoff Modal */}
      {showHandoffModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Continue on...</h2>
              <button
                onClick={() => {
                  setShowHandoffModal(false);
                  setHandoffResponse(null);
                  setSelectedPlatform('');
                }}
                className="text-[#8888AA] hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            </div>

            {!handoffResponse ? (
              <div className="grid grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => handleGenerateHandoff(platform.name)}
                    disabled={handoffLoading}
                    className="bg-[#0A0A0F] border border-[#1E1E2E] hover:border-[#00D4FF] rounded-xl p-6 flex items-center gap-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    <span className="text-white font-medium text-lg">{platform.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Handoff Package for {selectedPlatform}
                  </h3>
                  <textarea
                    readOnly
                    value={handoffResponse.handoff_package}
                    className="w-full h-64 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 text-white text-sm resize-none focus:outline-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex-1 border border-[#1E1E2E] hover:border-[#6C63FF] text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy size={18} />
                    Copy to clipboard
                  </button>
                  <a
                    href={getPlatformUrl(selectedPlatform)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#6C63FF] hover:bg-[#5a52e6] text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={18} />
                    Open {selectedPlatform}
                  </a>
                </div>
                <p className="text-xs text-[#8888AA] text-center">
                  The Chrome extension handles auto-injection. This is the manual fallback.
                </p>
              </div>
            )}

            {handoffLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1E1E2E] border-t-[#6C63FF]" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
