"use client";

import React, { useState, useEffect } from 'react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { ConfirmSignUpForm } from './ConfirmSignUpForm';
import { ApiKeyInput } from './ApiKeyInput';
import { getApiKey } from '@/lib/api-key';

type AuthView = 'signin' | 'signup' | 'confirm' | 'apikey';

export function AuthContainer() {
  const [currentView, setCurrentView] = useState<AuthView>('signin');
  const [pendingUsername, setPendingUsername] = useState('');

  useEffect(() => {
    // Check if API key is available, if not show API key input
    const apiKey = getApiKey();
    if (!apiKey) {
      setCurrentView('apikey');
    }
  }, []);

  const handleSignUpSuccess = (username: string) => {
    setPendingUsername(username);
    setCurrentView('confirm');
  };

  const handleBackToSignUp = () => {
    setCurrentView('signup');
    setPendingUsername('');
  };

  const handleApiKeySet = () => {
    setCurrentView('signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Property Agent Chat</h1>
          <p className="mt-2 text-sm text-gray-600">
            AI-powered property assistance
          </p>
        </div>
        
        {currentView === 'apikey' && (
          <ApiKeyInput onApiKeySet={handleApiKeySet} />
        )}
        
        {currentView === 'signin' && (
          <SignInForm onSwitchToSignUp={() => setCurrentView('signup')} />
        )}
        
        {currentView === 'signup' && (
          <SignUpForm 
            onSwitchToSignIn={() => setCurrentView('signin')}
            onSignUpSuccess={handleSignUpSuccess}
          />
        )}
        
        {currentView === 'confirm' && (
          <ConfirmSignUpForm 
            username={pendingUsername}
            onBackToSignUp={handleBackToSignUp}
          />
        )}
      </div>
    </div>
  );
}
