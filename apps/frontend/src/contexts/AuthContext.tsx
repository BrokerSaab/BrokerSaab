'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface AuthUser {
  id?: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  authReady: boolean;
  isModalOpen: boolean;
  openLoginModal: (afterLoginCallback?: () => void) => void;
  closeLoginModal: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// LoginModal is imported here to avoid circular dep — we import the component lazily
// by accepting it as a prop via the children pattern inside AuthProvider's JSX.
// Instead, we render it directly below after importing.
import LoginModal from '@/components/LoginModal';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const afterLoginCallbackRef = useRef<(() => void) | null>(null);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  // authReady stays false until this runs, so pages that redirect on
  // `!isLoggedIn` don't bounce an already-logged-in user before we've
  // had a chance to read their session back out of localStorage.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem('user');
    } finally {
      setAuthReady(true);
    }
  }, []);

  const openLoginModal = (callback?: () => void) => {
    afterLoginCallbackRef.current = callback ?? null;
    setIsModalOpen(true);
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
  };

  const closeLoginModal = () => {
    setIsModalOpen(false);
    afterLoginCallbackRef.current = null;
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tempToken');
    setUser(null);
    setIsModalOpen(false);
    afterLoginCallbackRef.current = null;
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  };

  // Private — passed directly to LoginModal, not exposed through context
  const handleLoginSuccess = (userData: AuthUser) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsModalOpen(false);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
    // Fire the pending callback after modal closes (1.6s to match modal's 1.5s success display)
    setTimeout(() => {
      afterLoginCallbackRef.current?.();
      afterLoginCallbackRef.current = null;
    }, 1600);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoggedIn: !!user, authReady, isModalOpen, openLoginModal, closeLoginModal, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, authReady, isModalOpen]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal
        isOpen={isModalOpen}
        onClose={closeLoginModal}
        onLoginSuccess={handleLoginSuccess}
      />
    </AuthContext.Provider>
  );
}
