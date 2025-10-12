"use client";

/* eslint-disable react-refresh/only-export-components */
import { validate } from "uuid";
import { Thread } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { createClient } from "./client";
import { useAuth } from "@/providers/Auth";

interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

const DEFAULT_API_URL = "/api/langgraph";
const DEFAULT_ASSISTANT_ID = "agent";

function getThreadSearchMetadata(
  assistantId: string,
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export function ThreadProvider({ children }: { children: ReactNode }) {
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  const envAssistantId =
    process.env.NEXT_PUBLIC_ASSISTANT_ID ?? DEFAULT_ASSISTANT_ID;

  const [apiUrl] = useQueryState("apiUrl", { defaultValue: envApiUrl });
  const [assistantId] = useQueryState("assistantId", {
    defaultValue: envAssistantId,
  });
  const [, setThreadId] = useQueryState("threadId");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const activeUserId = user?.userId || user?.username || user?.email || undefined;
  const hasInitializedThread = useRef(false);

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    if (!apiUrl || !assistantId) return [];

    const client = createClient(apiUrl);
    const metadataFilter: Record<string, string> = {
      ...getThreadSearchMetadata(assistantId),
    };

    if (activeUserId) {
      metadataFilter.user_id = activeUserId;
    }

    const searchArgs = {
      metadata: metadataFilter,
      limit: 100,
      sortBy: "updated_at" as const,
      sortOrder: "desc" as const,
    };

    let threads = await client.threads.search(searchArgs);

    if (activeUserId && threads.length === 0) {
      threads = await client.threads.search({
        ...searchArgs,
        metadata: getThreadSearchMetadata(assistantId),
      });
    }

    const sortedThreads = [...threads].sort((a, b) => {
      const toTimestamp = (value?: string) =>
        value ? new Date(value).getTime() : 0;
      return toTimestamp(b.updated_at ?? b.created_at) -
        toTimestamp(a.updated_at ?? a.created_at);
    });

    return sortedThreads;
  }, [activeUserId, apiUrl, assistantId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setThreads([]);
      setThreadsLoading(false);
      hasInitializedThread.current = false;
      setThreadId(null);
      return;
    }

    let isActive = true;

    setThreadsLoading(true);

    getThreads()
      .then((fetchedThreads) => {
        if (!isActive) return;

        setThreads(fetchedThreads);

        if (!hasInitializedThread.current && fetchedThreads.length > 0) {
          hasInitializedThread.current = true;
          setThreadId((current) => current ?? fetchedThreads[0].thread_id);
        } else if (!hasInitializedThread.current && fetchedThreads.length === 0) {
          hasInitializedThread.current = false;
        }
      })
      .catch((error) => {
        if (isActive) {
          console.error("Failed to load threads", error);
        }
      })
      .finally(() => {
        if (isActive) {
          setThreadsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [getThreads, isAuthenticated, setThreadId]);

  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
  };

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider");
  }
  return context;
}
