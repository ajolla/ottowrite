import { useState, useEffect } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, UserProfile } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: AuthError | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        return;
      }

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setAuthState({
          user: session.user,
          profile,
          loading: false,
          error: null,
        });
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState(prev => ({ ...prev, error, loading: false }));
      toast.error('Failed to sign in: ' + error.message);
      return { user: null, error };
    }

    toast.success('Successfully signed in!');
    return { user: data.user, error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setAuthState(prev => ({ ...prev, error, loading: false }));
      toast.error('Failed to sign up: ' + error.message);
      return { user: null, error };
    }

    // Create user profile
    if (data.user) {
      await createUserProfile(data.user.id, email, fullName);
    }

    toast.success('Account created! Please check your email to verify your account.');
    return { user: data.user, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error('Failed to sign out: ' + error.message);
      return { error };
    }

    toast.success('Successfully signed out!');
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error('Failed to send reset email: ' + error.message);
      return { error };
    }

    toast.success('Password reset instructions sent to your email!');
    return { error: null };
  };

  const createUserProfile = async (userId: string, email: string, fullName: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          tier: 'free',
          usage_count: 0,
          usage_limit: 10000, // 10K tokens for free tier
        });

      if (error) {
        console.error('Error creating user profile:', error);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) return { error: new Error('No user logged in') };

    setAuthState(prev => ({ ...prev, loading: true }));

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', authState.user.id)
      .select()
      .single();

    if (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      toast.error('Failed to update profile: ' + error.message);
      return { error };
    }

    setAuthState(prev => ({
      ...prev,
      profile: data,
      loading: false,
    }));

    toast.success('Profile updated successfully!');
    return { error: null };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };
}