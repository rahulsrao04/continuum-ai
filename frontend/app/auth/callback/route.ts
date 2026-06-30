import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.session) {
      // Redirect to extension-bridge with the access token
      const accessToken = data.session.access_token;
      return NextResponse.redirect(
        new URL(`/auth/extension-bridge?token=${accessToken}`, requestUrl.origin)
      );
    }
  }

  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}
