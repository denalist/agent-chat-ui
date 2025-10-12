"use client";

import React, { useState } from 'react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { ConfirmSignUpForm } from './ConfirmSignUpForm';

type AuthView = 'signin' | 'signup' | 'confirm';

export function AuthContainer() {
  const [currentView, setCurrentView] = useState<AuthView>('signin');
  const [pendingUsername, setPendingUsername] = useState('');

  const handleSignUpSuccess = (username: string) => {
    setPendingUsername(username);
    setCurrentView('confirm');
  };

  const handleBackToSignUp = () => {
    setCurrentView('signup');
    setPendingUsername('');
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
