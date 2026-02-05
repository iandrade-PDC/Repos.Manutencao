import { useRef, useEffect, useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { cn } from '../../lib/utils';
// import { formatDistanceToNow } from 'date-fns';
// import { ptBR } from 'date-fns/locale';

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const formatTime = (isoString: string) => {
    try {
      // return formatDistanceToNow(new Date(isoString), { addSuffix: true, locale: ptBR });
      return new Date(isoString).toLocaleTimeString('pt-BR');
    } catch (e) {
      return 'agora mesmo';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="text-areia/80 hover:text-white relative p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white border border-marinho animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-marinho text-sm">Notificações</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-marinho/70 hover:text-marinho hover:bg-marinho/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  title="Marcar todas como lidas"
                >
                  <Check size={12} /> Lidas
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  onClick={clearAll}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  title="Limpar todas"
                >
                  <Trash2 size={12} /> Limpar
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={cn(
                    "p-4 hover:bg-slate-50 transition-colors relative group",
                    !notification.read ? "bg-blue-50/50" : ""
                  )}
                >
                  <div className="flex gap-3">
                     <div className={cn(
                       "w-2 h-2 rounded-full mt-1.5 shrink-0",
                       !notification.read ? "bg-mata" : "bg-slate-300"
                     )} />
                     <div className="flex-1 space-y-1">
                       <p className={cn("text-sm font-medium", !notification.read ? "text-marinho" : "text-slate-600")}>
                         {notification.title}
                       </p>
                       <p className="text-xs text-slate-500 line-clamp-2">
                         {notification.message}
                       </p>
                       <p className="text-[10px] text-slate-400">
                         {formatTime(notification.time)}
                       </p>
                     </div>
                     {!notification.read && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                         className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 text-slate-400 hover:text-mata hover:bg-mata/10 rounded transition-all"
                         title="Marcar como lida"
                       >
                         <Check size={14} />
                       </button>
                     )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
