import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'leader' | 'user';
  email: string;
  avatar?: string;
  approved: boolean; 
  sector?: string; // Add sector field
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, sector?: string) => Promise<void>;
  logout: () => Promise<void>;
  canManageUsers: () => boolean;
  canEditDemands: () => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        // Fallback for user without profile (should not happen with triggers)
        setUser({
          id: userId,
          name: email.split('@')[0],
          role: 'user',
          email: email,
          approved: false,
          sector: ''
        });
      } else if (data) {
        setUser({
          id: userId,
          name: data.full_name || email.split('@')[0],
          role: data.role || 'user',
          email: email,
          avatar: data.avatar_url,
          approved: data.approved !== false,
          sector: data.sector
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    // For demo/dev purposes, if no password provided, we might fail or simulate
    // But since we are moving to real DB, password IS required.
    if (!password) throw new Error("Senha obrigatória");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string, sector?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          sector: sector // Add sector to metadata
        }
      }
    });

    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const canManageUsers = () => user?.role === 'admin';
  const canEditDemands = () => user?.role === 'admin' || user?.role === 'leader';

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, logout, canManageUsers, canEditDemands }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
