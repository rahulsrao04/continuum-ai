interface PlatformBadgeProps {
  platform: string;
}

export default function PlatformBadge({ platform }: PlatformBadgeProps) {
  const platformColors: Record<string, string> = {
    claude: '#CC785C',
    chatgpt: '#10A37F',
    gemini: '#4285F4',
    grok: '#FFFFFF',
    perplexity: '#20B2AA',
  };

  const color = platformColors[platform.toLowerCase()] || '#8888AA';
  const bgColor = platform.toLowerCase() === 'grok' ? '#000000' : 'transparent';

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: bgColor, 
        color: bgColor === '#000000' ? '#FFFFFF' : color,
        border: bgColor === '#000000' ? '1px solid #333' : 'none'
      }}
    >
      {platform}
    </span>
  );
}
