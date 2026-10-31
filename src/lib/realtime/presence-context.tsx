'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useCRM } from '@/lib/store/crm-context';

interface PresenceContextType {
  onlineUserIds: Set<string>;
  isUserOnline: (userIdOrEmail?: string | null) => boolean;
  onlineCount: number;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUserIds: new Set<string>(),
  isUserOnline: () => false,
  onlineCount: 0,
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated } = useCRM();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Helper to extract all online user identifiers (IDs, emails, keys) from presenceState
  const syncPresenceState = useCallback((channel: RealtimeChannel) => {
    try {
      const state = channel.presenceState();
      const nextOnlineSet = new Set<string>();

      for (const key of Object.keys(state)) {
        if (key) {
          nextOnlineSet.add(key);
          nextOnlineSet.add(key.toLowerCase());
        }

        const presences = state[key] as Array<{ user_id?: string; email?: string }>;
        if (Array.isArray(presences)) {
          for (const item of presences) {
            if (item.user_id) {
              nextOnlineSet.add(item.user_id);
              nextOnlineSet.add(item.user_id.toLowerCase());
            }
            if (item.email) {
              nextOnlineSet.add(item.email.toLowerCase());
            }
          }
        }
      }

      setOnlineUserIds(nextOnlineSet);
    } catch (err) {
      console.warn('[Presence] Error reading presence state:', err);
    }
  }, []);

  useEffect(() => {
    // Only track presence if user is authenticated and has an ID
    if (!isAuthenticated || !currentUser?.id) {
      if (channelRef.current) {
        channelRef.current.untrack().catch(() => {});
        const supabase = createClient();
        if (supabase) {
          supabase.removeChannel(channelRef.current);
        }
        channelRef.current = null;
      }
      setOnlineUserIds(new Set());
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const currentUserId = currentUser.id;
    const currentUserEmail = currentUser.email?.toLowerCase() || '';

    // Create a single shared channel for the whole application
    // Using currentUser.id as the presence key ensures Supabase handles multiple tabs for the same user cleanly
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channelRef.current = channel;

    const trackPresence = async () => {
      try {
        await channel.track({
          user_id: currentUserId,
          email: currentUserEmail,
          online_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[Presence] Track presence failed:', err);
      }
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        syncPresenceState(channel);
      })
      .on('presence', { event: 'join' }, () => {
        syncPresenceState(channel);
      })
      .on('presence', { event: 'leave' }, () => {
        syncPresenceState(channel);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          trackPresence();
        }
      });

    // Re-track on visibility change (mobile coming back from background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && channelRef.current) {
        trackPresence();
      }
    };

    // Re-track when device comes back online
    const handleOnline = () => {
      if (channelRef.current) {
        trackPresence();
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', handleOnline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
      }

      if (channelRef.current) {
        channelRef.current.untrack().catch(() => {});
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, currentUser?.id, currentUser?.email, syncPresenceState]);

  const isUserOnline = useCallback(
    (userIdOrEmail?: string | null): boolean => {
      if (!userIdOrEmail) return false;
      const normalized = userIdOrEmail.trim().toLowerCase();
      return onlineUserIds.has(userIdOrEmail.trim()) || onlineUserIds.has(normalized);
    },
    [onlineUserIds]
  );

  return (
    <PresenceContext.Provider
      value={{
        onlineUserIds,
        isUserOnline,
        onlineCount: onlineUserIds.size,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    return {
      onlineUserIds: new Set<string>(),
      isUserOnline: () => false,
      onlineCount: 0,
    };
  }
  return context;
}
