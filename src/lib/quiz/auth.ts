import { supabaseServer } from '@/lib/supabaseServer';

export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (supabaseServer) {
      const { data: { user }, error } = await supabaseServer.auth.getUser(token);
      if (!error && user) {
        return user.id;
      }
    }
  }

  // Fallback to query param
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  return userId || null;
}
