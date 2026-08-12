'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { attendanceApi } from '@/services/api';
import { User } from '@/types';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout, updateUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser && !isAuthenticated) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          login(parsedUser, storedToken);
        } catch {
          logout();
        }
      }
    }
  }, [isAuthenticated, login, logout]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  return { user, token, isAuthenticated, updateUser, logout: handleLogout };
}

export function useServerTime() {
  return useQuery({
    queryKey: ['server-time'],
    queryFn: async () => {
      const response = await attendanceApi.getServerTime();
      return response.data.data;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await (await import('@/services/api')).notificationsApi.getAll();
      return response.data.data;
    },
    refetchInterval: 180000,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const response = await (await import('@/services/api')).notificationsApi.getUnreadCount();
      return response.data.data.count;
    },
    refetchInterval: 180000,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const response = await (await import('@/services/api')).notificationsApi.markAsRead(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const response = await (await import('@/services/api')).notificationsApi.markAllAsRead();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
