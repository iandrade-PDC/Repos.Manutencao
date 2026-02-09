import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  playNotificationSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        id: '1',
        title: 'Bem-vindo ao Sistema',
        message: 'Você agora tem acesso ao painel do Ancoradouro da Ponta.',
        time: new Date().toISOString(),
        read: false,
        type: 'info'
      }
    ];
  });

  // Audio Context Ref to avoid multiple contexts limit
  const audioContextRef = useRef<AudioContext | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Unlock Audio on interaction
    const unlockAudio = () => {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtor && !audioContextRef.current) {
            audioContextRef.current = new AudioCtor();
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true }); // Better for mobile

    return () => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
    };
  }, []);

  // Realtime Subscription for Maintenance Sector
  useEffect(() => {
    if (!user) return;

    // Check if user is relevant for notifications (Maintenance, Admin, Leader)
    const isMaintenance = user.sector === 'Manutenção' || user.role === 'admin' || user.role === 'leader';
    
    if (!isMaintenance) return;

    console.log('Setup Realtime Notifications for:', user.email);

    const channel = supabase
      .channel('global-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          const newOrder = payload.new;
          
          // Debug payload
          console.log('Realtime Order Received:', newOrder);

          // Notify if the user is NOT the one who created it (avoid double notification)
          // Also strict check on sector if needed, but we already filtered by user role above
          if (newOrder.requester_id !== user.id) {
             addNotification({
                title: 'Nova Solicitação',
                message: `Novo chamado de ${newOrder.priority} em ${newOrder.location}`,
                type: 'info'
             });
          }
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [user]);

  const saveToStorage = (newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    localStorage.setItem('notifications', JSON.stringify(newNotifications));
  };

  const playNotificationSound = () => {
    try {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtor) return;
        
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioCtor();
        }
        
        const ctx = audioContextRef.current;
        
        // Always try to resume
        if (ctx.state === 'suspended') {
             ctx.resume().catch(e => console.warn('Audio resume failed', e));
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // A pleasant "Ding" sound: Sine wave
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error('AudioContext error:', e);
    }
  };

  const addNotification = (data: Omit<Notification, 'id' | 'time' | 'read'>) => {
    // Play Sound immediately
    playNotificationSound();

    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toISOString(),
      read: false,
      ...data
    };
    
    // Add to state
    setNotifications(current => {
       const updated = [newNotification, ...current];
       saveToStorage(updated);
       return updated;
    });

    // System Notification
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification(data.title, {
                body: data.message,
                icon: '/vite.svg', // Default vite icon as placeholder if logo not present
                tag: 'maintenance-alert'
            });
        } catch (e) {
            console.error('System notification error', e);
        }
    }
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    saveToStorage(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveToStorage(updated);
  };

  const clearAll = () => {
    saveToStorage([]);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead,
      clearAll,
      playNotificationSound
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
