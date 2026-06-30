import Link from 'next/link';
import { Project } from '@/lib/types';
import { CheckCircle2 } from 'lucide-react';
import PlatformBadge from './PlatformBadge';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
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

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 hover:border-[#6C63FF] transition-colors cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-white">{project.name}</h3>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#6C63FF]/10 text-[#6C63FF]">
            {project.type}
          </span>
        </div>
        
        {project.description && (
          <p className="text-[#8888AA] text-sm mb-6 line-clamp-2 flex-1">
            {project.description}
          </p>
        )}
        
        <div className="space-y-3 pt-4 border-t border-[#1E1E2E]">
          <div className="flex items-center gap-2 text-sm text-[#8888AA]">
            <CheckCircle2 size={16} className="text-[#6C63FF]" />
            <span>No checkpoints yet</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#8888AA]">Last active</span>
            <span className="text-white">{getRelativeTime(project.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
