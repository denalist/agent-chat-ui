"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/Auth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import React from "react";
import { headers } from "next/headers";

export default function DemoPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <AuthProvider>
        <AuthGuard>
          <Toaster />
          <ThreadProvider>
            <StreamProvider>
              <ArtifactProvider>
                <Thread />
              </ArtifactProvider>
            </StreamProvider>
          </ThreadProvider>
        </AuthGuard>
      </AuthProvider>
    </React.Suspense>
  );
}
