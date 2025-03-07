import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  role: string | null;
  siteUser: {
    id: string;
    name: string;
    role: string;
  } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  siteUser: null,
  signIn: async () => {},
  signOut: async () => {},
  loading: true
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [siteUser, setSiteUser] = useState<{ id: string; name: string; role: string } | null>(null);

  const checkUserRole = async (userId: string) => {
    try {
      // Get the site_user record using the auth ID
      const { data: siteUserData, error: siteError } = await supabase
        .from('site_users')
        .select('*')  // Select all fields to get id, name, and role
        .eq('authid', userId)
        .single();

      if (siteError) throw siteError;

      if (siteUserData) {
        setRole(siteUserData.role);
        setSiteUser({
          id: siteUserData.id,
          name: siteUserData.name,
          role: siteUserData.role
        });
      } else {
        setRole(null);
        setSiteUser(null);
      }
    } catch (err) {
      console.error('Error checking user role:', err);
      setRole(null);
      setSiteUser(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        checkUserRole(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        checkUserRole(session.user.id);
      } else {
        setRole(null);
        setSiteUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (data.user) {
      checkUserRole(data.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, siteUser, signIn, signOut: logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};