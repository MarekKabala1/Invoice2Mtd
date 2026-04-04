/**
 * useAuth.ts
 *
 * Hook for Supabase authentication with user linking.
 * After login, links local user to Supabase auth user.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signOut, getCurrentUser } from '@/db/supabase/supabase';

interface UseAuthReturn {
  user: Awaited<ReturnType<typeof getCurrentUser>>['user'];
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  linkUserToAuth: (localUserId: string) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<UseAuthReturn['user']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { user } = await getCurrentUser();
      setUser(user);
      setIsLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    return { error };
  }, []);

  const handleSignOut = useCallback(async () => {
    const { error } = await signOut();
    return { error };
  }, []);

  const linkUserToAuth = useCallback(async (localUserId: string) => {
    if (!user) return;

    // Update the local user's auth_user_id in Supabase
    const { error } = await supabase
      .from('users')
      .update({ auth_user_id: user.id })
      .eq('local_id', localUserId);

    if (error) {
      console.error('Failed to link user to auth:', error);
    }
  }, [user]);

  return {
    user,
    isLoading,
    isSignedIn: !!user,
    signIn: handleSignIn,
    signOut: handleSignOut,
    linkUserToAuth,
  };
};
