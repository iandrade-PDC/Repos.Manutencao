import { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export function NotificationToast() {
  const { notifications } = useNotifications();
  const [visibleToasts, setVisibleToasts] = useState<any[]>([]);

  useEffect(() => {
    // Determine which notifications are new (added in last 3 seconds for simple logic)
    // Or simpler: Compare with previous length.
    // Actually, we can just look at the latest notification.
    if (notifications.length > 0) {
        const latest = notifications[0];
        // Check if it's recent (e.g. within 20 seconds) - Increased for safety
        const timeDiff = new Date().getTime() - new Date(latest.time).getTime();
        console.log('Last notification age:', timeDiff, latest);
        
        if (timeDiff < 20000 && !latest.read) { 
           showToast(latest);
        }
    }
  }, [notifications]);

  const showToast = (notification: any) => {
      // Prevent duplicate if already showing
      setVisibleToasts(prev => {
          if (prev.find(t => t.id === notification.id)) return prev;
          return [...prev, notification];
      });

      // Auto remove after 5 seconds
      setTimeout(() => {
          removeToast(notification.id);
      }, 5000);
  };

  const removeToast = (id: string) => {
      setVisibleToasts(prev => prev.filter(t => t.id !== id));
  };

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
      {visibleToasts.map(toast => (
        <div 
            key={toast.id}
            className="bg-white rounded-lg shadow-lg border border-slate-200 p-4 w-80 animate-in slide-in-from-right-full duration-300 pointer-events-auto flex gap-3"
        >
           <div className={`mt-0.5 p-1.5 rounded-full h-fit shrink-0 ${
               toast.type === 'success' ? 'bg-green-100 text-green-600' :
               toast.type === 'warning' ? 'bg-amber-100 text-amber-600' :
               toast.type === 'error' ? 'bg-red-100 text-red-600' :
               'bg-blue-100 text-blue-600'
           }`}>
               {toast.type === 'success' ? <CheckCircle size={16} /> :
                toast.type === 'warning' ? <AlertTriangle size={16} /> :
                toast.type === 'error' ? <AlertTriangle size={16} /> :
                <Info size={16} />}
           </div>
           
           <div className="flex-1">
               <h4 className="text-sm font-bold text-slate-800">{toast.title}</h4>
               <p className="text-xs text-slate-600 mt-1 line-clamp-2">{toast.message}</p>
           </div>

           <button 
             onClick={() => removeToast(toast.id)}
             className="text-slate-400 hover:text-slate-600 h-fit"
           >
             <X size={16} />
           </button>
        </div>
      ))}
    </div>
  );
}
