import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/db';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [pendingCount, setPendingCount] = useState<number>(0);

  // 1. Check network connection status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');

      const handleOnline = () => {
        setIsOnline(true);
        setSyncStatus('synced');
        triggerSync(); // Sync automatically upon reconnection
      };

      const handleOffline = () => {
        setIsOnline(false);
        setSyncStatus('offline');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Update pending outbox count
  const updatePendingCount = useCallback(async () => {
    const count = await db.syncOutbox.count();
    setPendingCount(count);
    if (count > 0 && !isOnline) {
      setSyncStatus('offline');
    }
  }, [isOnline]);

  useEffect(() => {
    updatePendingCount();
    // Set up a quick interval to poll outbox count
    const interval = setInterval(updatePendingCount, 3000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  // 2. Perform synchronization
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    console.log('[SyncManager] Starting sync cycle...');

    try {
      // Get JWT token from local storage
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Phase A: Drain Outbox sequentially
      const outboxItems = await db.syncOutbox.orderBy('timestamp').toArray();

      for (const item of outboxItems) {
        try {
          let url = '';
          let method = '';
          const cleanStore = item.storeName.toLowerCase();

          // Resolve API endpoint based on local IndexedDB store names
          if (cleanStore === 'clients') {
            url = `${API_BASE_URL}/clients`;
          } else if (cleanStore === 'appointments') {
            url = `${API_BASE_URL}/appointments`;
          } else if (cleanStore === 'services') {
            url = `${API_BASE_URL}/appointments/services`;
          } else if (cleanStore === 'inventory') {
            url = `${API_BASE_URL}/inventory/items`;
          } else if (cleanStore === 'suppliers') {
            url = `${API_BASE_URL}/inventory/suppliers`;
          } else if (cleanStore === 'equipment') {
            url = `${API_BASE_URL}/equipment`;
          } else if (cleanStore === 'expenses') {
            url = `${API_BASE_URL}/finance/expenses`;
          } else if (cleanStore === 'income') {
            url = `${API_BASE_URL}/finance/income`;
          } else if (cleanStore === 'dailynotes') {
            url = `${API_BASE_URL}/daily-notes`;
          }

          if (item.action === 'CREATE') {
            method = 'POST';
            // Strip out local mock IDs to let backend generate standard UUIDs
            const { id, ...postData } = item.data;
            const response = await fetch(url, {
              method,
              headers,
              body: JSON.stringify(postData),
            });
            if (!response.ok) throw new Error(`Create failed with status ${response.status}`);
          } else if (item.action === 'UPDATE') {
            method = 'PUT';
            const response = await fetch(`${url}/${item.entityId}`, {
              method,
              headers,
              body: JSON.stringify(item.data),
            });
            if (!response.ok) throw new Error(`Update failed with status ${response.status}`);
          } else if (item.action === 'DELETE') {
            method = 'DELETE';
            const response = await fetch(`${url}/${item.entityId}`, {
              method,
              headers,
            });
            if (!response.ok) throw new Error(`Delete failed with status ${response.status}`);
          }

          // Successfully synchronized. Remove from outbox
          if (item.id !== undefined) {
            await db.syncOutbox.delete(item.id);
          }
        } catch (itemError) {
          console.error(`[SyncManager] Failed to sync outbox item:`, item, itemError);
          // Stop outbox drain if a network error occurs to preserve order
          throw itemError;
        }
      }

      // Phase B: Pull down fresh data snapshots and update local IndexedDB cache
      if (token) {
        // Fetch Clients
        const clientsRes = await fetch(`${API_BASE_URL}/clients`, { headers });
        if (clientsRes.ok) {
          const clients = await clientsRes.json();
          await db.clients.clear();
          await db.clients.bulkPut(clients);
        }

        // Fetch Services
        const servicesRes = await fetch(`${API_BASE_URL}/appointments/services`, { headers });
        if (servicesRes.ok) {
          const services = await servicesRes.json();
          await db.services.clear();
          await db.services.bulkPut(services);
        }

        // Fetch Appointments
        const appointmentsRes = await fetch(`${API_BASE_URL}/appointments`, { headers });
        if (appointmentsRes.ok) {
          const appointments = await appointmentsRes.json();
          await db.appointments.clear();
          await db.appointments.bulkPut(appointments);
        }

        // Fetch Inventory Items
        const inventoryRes = await fetch(`${API_BASE_URL}/inventory/items`, { headers });
        if (inventoryRes.ok) {
          const inventory = await inventoryRes.json();
          await db.inventory.clear();
          await db.inventory.bulkPut(inventory);
        }

        // Fetch Equipment
        const equipmentRes = await fetch(`${API_BASE_URL}/equipment`, { headers });
        if (equipmentRes.ok) {
          const equipment = await equipmentRes.json();
          await db.equipment.clear();
          await db.equipment.bulkPut(equipment);
        }

        // Fetch Income & Expenses
        const incomeRes = await fetch(`${API_BASE_URL}/finance/income`, { headers });
        if (incomeRes.ok) {
          const income = await incomeRes.json();
          await db.income.clear();
          await db.income.bulkPut(income);
        }

        const expensesRes = await fetch(`${API_BASE_URL}/finance/expenses`, { headers });
        if (expensesRes.ok) {
          const expenses = await expensesRes.json();
          await db.expenses.clear();
          await db.expenses.bulkPut(expenses);
        }

        // Fetch Suppliers
        const suppliersRes = await fetch(`${API_BASE_URL}/inventory/suppliers`, { headers });
        if (suppliersRes.ok) {
          const suppliers = await suppliersRes.json();
          await db.suppliers.clear();
          await db.suppliers.bulkPut(suppliers);
        }

        // Fetch Daily Notes
        const notesRes = await fetch(`${API_BASE_URL}/daily-notes`, { headers });
        if (notesRes.ok) {
          const notes = await notesRes.json();
          await db.dailyNotes.clear();
          await db.dailyNotes.bulkPut(notes);
        }
      }

      setSyncStatus('synced');
      setPendingCount(0);
      console.log('[SyncManager] Sync completed successfully.');
    } catch (error) {
      console.error('[SyncManager] Synchronization cycle failed:', error);
      setSyncStatus('error');
    }
  }, []);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    triggerSync,
  };
}
