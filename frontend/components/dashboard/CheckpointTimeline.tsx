'use client';

import { useState } from 'react';
import { Checkpoint } from '@/lib/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import PlatformBadge from './PlatformBadge';

interface CheckpointTimelineProps {
  checkpoints: Checkpoint[];
}

export default function CheckpointTimeline({ checkpoints }: CheckpointTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const getSummary = (checkpoint: Checkpoint) => {
    if (checkpoint.delta && Object.keys(checkpoint.delta).length > 0) {
      const changes = Object.entries(checkpoint.delta).slice(0, 2);
      return changes.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ');
    }
    return checkpoint.extracted_state.current_status;
  };

  if (checkpoints.length === 0) {
    return (
      <div className="text-center text-[#8888AA] py-12">
        <p className="text-lg">No checkpoints yet</p>
        <p className="text-sm mt-2">Start building to create your first checkpoint</p>
      </div>
    );
  }

  const sortedCheckpoints = [...checkpoints].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedCheckpoints.map((checkpoint) => {
        const isExpanded = expandedId === checkpoint.id;
        const state = checkpoint.extracted_state;

        return (
          <div key={checkpoint.id} className="border-l-2 border-[#1E1E2E] pl-6 relative">
            <div className="absolute w-3 h-3 bg-[#6C63FF] rounded-full -left-[7px] top-2" />
            
            <button
              onClick={() => setExpandedId(isExpanded ? null : checkpoint.id)}
              className="w-full text-left hover:bg-[#12121A]/50 rounded-lg p-2 -m-2 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <PlatformBadge platform={checkpoint.platform} />
                <span className="text-sm text-[#8888AA]">
                  {getRelativeTime(checkpoint.created_at)}
                </span>
                {isExpanded ? (
                  <ChevronDown size={16} className="text-[#8888AA]" />
                ) : (
                  <ChevronRight size={16} className="text-[#8888AA]" />
                )}
              </div>
              <p className="text-sm text-white line-clamp-2">
                {getSummary(checkpoint)}
              </p>
            </button>

            {isExpanded && (
              <div className="mt-4 space-y-4 pb-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#6C63FF] mb-2">Current Goal</h4>
                  <p className="text-sm text-white">{state.current_goal}</p>
                </div>

                {state.decisions && state.decisions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#6C63FF] mb-2">Decisions</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {state.decisions.map((decision, idx) => (
                        <li key={idx} className="text-sm text-white">
                          <span className="font-medium">{decision.decision}</span>
                          <span className="text-[#8888AA] ml-2">— {decision.reasoning}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {state.rejected_ideas && state.rejected_ideas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#6C63FF] mb-2">Rejected Ideas</h4>
                    <ul className="space-y-1">
                      {state.rejected_ideas.map((idea, idx) => (
                        <li key={idx} className="text-sm text-white">
                          <span className="line-through text-[#8888AA]">{idea.idea}</span>
                          <span className="text-[#8888AA] ml-2">— {idea.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {state.open_tasks && state.open_tasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#6C63FF] mb-2">Open Tasks</h4>
                    <ul className="space-y-1">
                      {state.open_tasks.map((task, idx) => (
                        <li key={idx} className="text-sm text-white flex items-start gap-2">
                          <span className="text-[#6C63FF] mt-1">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {state.known_bugs && state.known_bugs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-2">Known Bugs</h4>
                    <ul className="space-y-1">
                      {state.known_bugs.map((bug, idx) => (
                        <li key={idx} className="text-sm text-white flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>{bug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {state.constraints && state.constraints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#6C63FF] mb-2">Constraints</h4>
                    <ul className="space-y-1">
                      {state.constraints.map((constraint, idx) => (
                        <li key={idx} className="text-sm text-white flex items-start gap-2">
                          <span className="text-[#6C63FF] mt-1">•</span>
                          <span>{constraint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-[#6C63FF] mb-2">Current Status</h4>
                  <p className="text-sm text-white">{state.current_status}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#6C63FF] mb-2">Context for Next AI</h4>
                  <p className="text-sm text-[#8888AA]">{state.context_for_next_ai}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
