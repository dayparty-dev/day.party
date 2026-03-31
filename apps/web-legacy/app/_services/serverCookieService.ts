import { cookies } from 'next/headers';

// Server-side cookie operations
export const serverCookies = {
  get: async (name: string) => {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value || null;
  },
};
