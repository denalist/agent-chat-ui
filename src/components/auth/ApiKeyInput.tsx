"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { getApiKey } from '@/lib/api-key';

interface ApiKeyInputProps {
  onApiKeySet: () => void;
}

export function ApiKeyInput({ onApiKeySet }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if API key is already set
    const existingKey = getApiKey();
    if (existingKey) {
      onApiKeySet();
    }
  }, [onApiKeySet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!apiKey.trim()) {
        setError('Please enter your LangSmith API key');
        return;
      }

      // Store the API key in localStorage
      localStorage.setItem("lg:chat:apiKey", apiKey.trim());
      
      // Notify parent component that API key is set
      onApiKeySet();
    } catch (err: any) {
      setError(err.message || 'Failed to set API key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>LangSmith API Key</CardTitle>
        <CardDescription>
          Enter your LangSmith API key to access the Property Agent Chat
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">LangSmith API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your LangSmith API key"
            />
            <p className="text-xs text-muted-foreground">
              You can find your API key in the LangSmith dashboard under Settings → API Keys
            </p>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Setting API Key...' : 'Set API Key'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
