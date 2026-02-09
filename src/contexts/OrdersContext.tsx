import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { uploadOrderPhoto } from '../lib/utils';
import { useAuth } from './AuthContext';
// useNotifications removed as it's no longer used here

export interface Order {
  id: string;
// ... (lines 8-36 omitted, implied context is fine if I match correct range)
// Actually I need to match the start of the file for imports.
// I will target imports specifically.

// I will target lines 1-6
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { uploadOrderPhoto } from '../lib/utils';
import { useAuth } from './AuthContext';

// ...
// Target useAuth and useNotifications lines
  const { user } = useAuth();
  // useNotifications removed

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        // payload removed as unused
        // Simple optimistic update strategy: re-fetch or manual merge
        // Re-fetching is safer for now to get joins if we add them later
        fetchOrders(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // We need to fetch logs for history, or we can fetch them on demand.
      // Current interface assumes history is part of Order. 
      // Let's fetch logs and map them. This might be heavy if many orders, 
      // but for this MVP it's okay. A better way is to join.
      
      const ordersWithLogs = await Promise.all(data.map(async (order) => {
        const { data: logs } = await supabase
          .from('order_logs')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false });
          
        return {
          ...order,
          history: logs?.map(l => ({
            ...l,
            date: new Date(l.created_at).toISOString().split('T')[0],
            time: new Date(l.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
            iconBg: l.type === 'creation' ? 'bg-marinho' : 'bg-blue-500' // Simple mapping
          })) || []
        };
      }));

      setOrders(ordersWithLogs);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const addOrder = async (data: NewOrderData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // 1. Upload photos
      const photoUrls = await Promise.all(data.photos.map(file => uploadOrderPhoto(file)));

      // 2. Create Order
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert({
          title: data.title,
          description: data.description,
          requester: data.requester, // We store name for display, but ideally link to ID
          requester_id: user.id,
          date: data.date,
          time: data.time,
          location: data.location,
          sector: data.sector,
          priority: data.priority,
          status: 'aberto',
          photos: photoUrls
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Create initial log
      const { error: logError } = await supabase
        .from('order_logs')
        .insert({
          order_id: newOrder.id,
          user_id: user.id,
          title: 'Solicitação criada',
          description: `Solicitação criada por ${data.requester}`,
          type: 'creation'
        });

      if (logError) console.error('Error creating log:', logError);
      
      // Realtime will update list, but we can optimistically add if needed.
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Create log for update (optional but authentic)
      // For now we skip log creation here to keep it simple, 
      // usually the component calling updateOrder should specify log details 
      // or we handle specific status changes.
      
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  };

  return (
    <OrdersContext.Provider value={{ orders, loading, addOrder, updateOrder, fetchOrders }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within a OrdersProvider');
  }
  return context;
}
