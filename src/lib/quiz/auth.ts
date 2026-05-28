import { supabaseServer } from '@/lib/supabaseServer';
import { createHash } from 'crypto';

export function getDeterministicUUID(input: string): string {
  if (!input) return input;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(input)) return input;

  const hash = createHash('md5').update(input.toLowerCase()).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

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
  if (!userId) return null;
  return getDeterministicUUID(userId);
}
