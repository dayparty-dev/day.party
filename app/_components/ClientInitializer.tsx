'use client';

import { useEffect } from 'react';
import { useTasks } from '../_hooks/useTasks';
import { useAuth } from '../auth/_hooks/useAuth';
import AdminPanel from './AdminPanel/AdminPanel';

const ClientInitializer = () => {
    const isCloudSyncEnabled =
        process.env.NEXT_PUBLIC_IS_CLOUD_SYNC_ENABLED === 'true';

    const { isLoggedIn, user } = useAuth();
    const { isInitialized, initialize, syncTasks } = useTasks();

    useEffect(() => {
        if (!isInitialized) {
            initialize();
        }
    }, [isInitialized, initialize]);

    useEffect(() => {
        if (!isLoggedIn || !isCloudSyncEnabled || !isInitialized) return;

        const interval = setInterval(() => {
            console.log('🕒 Auto-sync triggered');
            syncTasks();
        }, 60000); // cada min

        return () => clearInterval(interval); // limpieza al desmontar
    }, [isLoggedIn, isInitialized, isCloudSyncEnabled, syncTasks]);

    // Check if the user is an admin
    const isAdminPanelEnabled =
        user.role === 'admin';

    return isAdminPanelEnabled && <AdminPanel />;
};

export default ClientInitializer;
