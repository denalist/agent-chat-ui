"use client";

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signIn, signUp, signOut, getCurrentUser, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import '@/lib/amplify-config';

interface User {
  userId: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, email: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (username: string, confirmationCode: string) => Promise<void>;
  resendSignUpCode: (username: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const resolveErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === "string") {
    return error || fallback;
  }
  return fallback;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const clearError = () => setError(null);

  const handleSignIn = async (username: string, password: string) => {
    try {
      setError(null);
      await signIn({ username, password });
    } catch (error) {
      const message = resolveErrorMessage(error, 'Sign in failed');
      setError(message);
      throw error;
    }
  };

  const handleSignUp = async (username: string, password: string, email: string, firstName?: string, lastName?: string) => {
    try {
      setError(null);
      const userAttributes: Record<string, string> = {
        email,
      };
      
      // Add name attributes if provided
      if (firstName) {
        userAttributes.given_name = firstName;
      }
      if (lastName) {
        userAttributes.family_name = lastName;
      }
      if (firstName && lastName) {
        userAttributes.name = `${firstName} ${lastName}`;
      } else if (firstName) {
        userAttributes.name = firstName;
      } else if (lastName) {
        userAttributes.name = lastName;
      }
      
      await signUp({
        username,
        password,
        options: {
          userAttributes,
        },
      });
    } catch (error) {
      const message = resolveErrorMessage(error, 'Sign up failed');
      setError(message);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await signOut();
    } catch (error) {
      const message = resolveErrorMessage(error, 'Sign out failed');
      setError(message);
      throw error;
    }
  };

  const handleConfirmSignUp = async (username: string, confirmationCode: string) => {
    try {
      setError(null);
      await confirmSignUp({ username, confirmationCode });
    } catch (error) {
      const message = resolveErrorMessage(error, 'Confirmation failed');
      setError(message);
      throw error;
    }
  };

  const handleResendSignUpCode = async (username: string) => {
    try {
      setError(null);
      await resendSignUpCode({ username });
    } catch (error) {
      const message = resolveErrorMessage(error, 'Failed to resend code');
      setError(message);
      throw error;
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser({
          userId: currentUser.userId,
          username: currentUser.username,
          email: currentUser.signInDetails?.loginId,
        });
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          checkUser();
          break;
        case 'signedOut':
          setUser(null);
          break;
        case 'tokenRefresh':
          checkUser();
          break;
        case 'tokenRefresh_failure':
          setUser(null);
          break;
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    confirmSignUp: handleConfirmSignUp,
    resendSignUpCode: handleResendSignUpCode,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
