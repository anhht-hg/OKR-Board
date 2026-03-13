'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'admin' | 'viewer';
interface AuthCtx { role: Role; isAdmin: boolean; refetch: () => Promise<void>; logout: () => Promise<void> }
const Ctx = createContext<AuthCtx>({ role: 'viewer', isAdmin: false, refetch: async () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('viewer');
  const router = useRouter();

  async function refetch() {
    try {
      const r = await fetch('/api/auth/me');
      if (!r.ok) return;
      const d = await r.json();
      if (d.role === 'admin' || d.role === 'viewer') setRole(d.role);
    } catch {
      // network error — keep current role
    }
  }

  useEffect(() => { refetch(); }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setRole('viewer');
    router.push('/login');
  }

  return <Ctx.Provider value={{ role, isAdmin: role === 'admin', refetch, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
