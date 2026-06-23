import { supabaseServer } from '@/lib/supabaseServer';
import { createHash } from 'crypto';

export function getDeterministicUUID(input: string): string {
  if (!input) return input;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(input)) return input;

  const hash = createHash('md5').update(input.toLowerCase()).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function resolveRealUserId(input: string): Promise<string> {
  if (!input) return input;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(input)) return input;

  // It's likely an email, try to find the actual UUID from auth.users
  if (supabaseServer) {
    const email = input.toLowerCase().trim();
    try {
      // Use direct lookup instead of listUsers (which is paginated and can miss users)
      const { data: existingUsers, error: listErr } = await supabaseServer.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      let foundUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email);

      if (!foundUser) {
        // Try creating the user in auth.users so FK constraints are satisfied
        console.log(`[auth.ts] User ${email} not found in auth.users, creating...`);
        const { data: newUser, error: createErr } = await supabaseServer.auth.admin.createUser({
          email,
          password: 'cc_temp_' + Date.now(),
          email_confirm: true,
        });

        if (createErr) {
          // User may already exist (race condition or duplicate). Try fetching again with higher page limit
          console.error('[auth.ts] Create user failed:', createErr.message);
          // Attempt to find via broader search
          const { data: retryUsers } = await supabaseServer.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });
          foundUser = retryUsers?.users?.find(u => u.email?.toLowerCase() === email);
          if (foundUser) return foundUser.id;
        } else if (newUser?.user) {
          console.log(`[auth.ts] Created auth user for ${email}: ${newUser.user.id}`);
          return newUser.user.id;
        }
      }

      if (foundUser) return foundUser.id;
    } catch (e) {
      console.error('[auth.ts] Error resolving real user ID:', e);
    }
  }

  return getDeterministicUUID(input);
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
  return resolveRealUserId(userId);
}

export async function verifyUserSession(request: Request): Promise<{ id: string; email: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!supabaseServer) return null;
  
  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user || !user.email) {
    return null;
  }
  return {
    id: user.id,
    email: user.email.toLowerCase()
  };
}
