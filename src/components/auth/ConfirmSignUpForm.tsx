"use client";

import React, { useState } from 'react';
import { useAuth } from '@/providers/Auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ConfirmSignUpFormProps {
  username: string;
  onBackToSignUp: () => void;
}

export function ConfirmSignUpForm({ username, onBackToSignUp }: ConfirmSignUpFormProps) {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { confirmSignUp, resendSignUpCode, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      await confirmSignUp(username, confirmationCode);
    } catch (err) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    clearError();

    try {
      await resendSignUpCode(username);
    } catch (err) {
      // Error is handled by the auth context
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Confirm Your Account</CardTitle>
        <CardDescription>
          We've sent a confirmation code to your email. Please enter it below to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation-code">Confirmation Code</Label>
            <Input
              id="confirmation-code"
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter the 6-digit code"
              maxLength={6}
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Confirming...' : 'Confirm Account'}
          </Button>
        </form>
        <div className="mt-4 space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResendCode}
            disabled={isResending}
          >
            {isResending ? 'Resending...' : 'Resend Code'}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={onBackToSignUp}
              className="text-sm text-muted-foreground hover:underline"
            >
              Back to Sign Up
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
