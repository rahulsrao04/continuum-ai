'use client';

import { Home, Folder, Settings, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface SidebarProps {
  user: any;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/projects', label: 'Projects', icon: Folder },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#12121A] border-r border-[#1E1E2E] flex flex-col">
      <div className="p-6 border-b border-[#1E1E2E]">
        <div className="flex items-center gap-2">
          <span className="text-[#6C63FF] text-2xl font-bold">C∞</span>
          <span className="text-white text-xl font-semibold">Continuum</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-[#6C63FF] text-white'
                  : 'text-[#8888AA] hover:bg-[#1E1E2E] hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1E1E2E]">
        <div className="mb-4">
          <p className="text-[#8888AA] text-sm mb-1">Signed in as</p>
          <p className="text-white text-sm font-medium truncate">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[#8888AA] hover:bg-[#1E1E2E] hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
