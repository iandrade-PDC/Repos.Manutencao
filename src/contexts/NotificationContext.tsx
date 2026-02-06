import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
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

  // Save to localStorage whenever notifications change
  // We use a useEffect or modify helpers directly. useEffect is cleaner.
  // importing useEffect at top first.

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const saveToStorage = (newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    localStorage.setItem('notifications', JSON.stringify(newNotifications));
  };

  const addNotification = (data: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toISOString(),
      read: false,
      ...data
    };
    saveToStorage([newNotification, ...notifications]);

    // Play Sound
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'); 
        // Use a better base64 for a noticeable beep "Ding"
        // This is a short sine beep encoded
        const beepUrl = "data:audio/wav;base64,UklGRn4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWoAAAB/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgH9/f4CAgIA=";
        // Real Base64 for a "Ding" sound (approx):
        // Since I can't upload a file, I will stick to AudioContext but FIX it to run on interaction or try this standard beep data URI. 
        // If AudioContext fails, this fallback needs to be good. But let's trust AudioContext improvement only.
        playNotificationSound();
    } catch (e) {
        console.error('Error playing sound:', e);
    }

    // System Notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
            body: data.message,
            icon: '/logo.png', // Assuming logo exists
            badge: '/logo.png'
        });
    }
  };

  const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        
        // Resume context if suspended (common in browsers)
        if (ctx.state === 'suspended') {
             ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // A pleasant "Ding" sound: Sine wave, high pitch to lower, short decay
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
      clearAll
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
