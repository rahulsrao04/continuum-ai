import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-[#0A0A0F]">
        <Sidebar user={user} />
        <main className="flex-1">{children}</main>
      </div>
    </ErrorBoundary>
  );
}
