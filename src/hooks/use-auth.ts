import { AuthContext } from '@/contexts/auth-context';
import { use } from 'react';
export function useAuth() { const value = use(AuthContext); if (!value) throw new Error('useAuth deve estar dentro de AuthProvider'); return value; }
