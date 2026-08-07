import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchProfile, mapProfileToAppUser, resolveAuthEmail } from './api/appData';
import type { AppUser } from './types';
import { supabase } from '../lib/supabase';

type AppAuthContextValue = {
  user: AppUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AppUser | null>;
  logout: () => Promise<void>;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

async function loadAppUser(userId: string): Promise<AppUser | null> {
  const profile = await fetchProfile(userId);
  return profile ? mapProfileToAppUser(profile) : null;
}

function appUsersEqual(a: AppUser | null, b: AppUser | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.role === b.role &&
    a.displayName === b.displayName &&
    a.loginUsername === b.loginUsername &&
    a.organizationId === b.organizationId
  );
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (data.session?.user) {
        const appUser = await loadAppUser(data.session.user.id);
        if (isMounted) setUser(appUser);
      }

      if (isMounted) setIsLoading(false);
    };

    void init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Token refresh on Chrome focus/resume must not rebuild app user state
      // (that remounts admin bootstrap and wipes UI position).
      if (event === 'TOKEN_REFRESHED') return;

      if (!session?.user) {
        setUser(null);
        return;
      }

      const appUser = await loadAppUser(session.user.id);
      if (!isMounted) return;
      setUser((current) => (appUsersEqual(current, appUser) ? current : appUser));
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const authEmail = await resolveAuthEmail(username);
    if (!authEmail) return null;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (error || !data.user) return null;

    const appUser = await loadAppUser(data.user.id);
    if (appUser) setUser(appUser);
    return appUser;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (!context) {
    throw new Error('useAppAuth must be used within AppAuthProvider');
  }
  return context;
}
