// src/components/debug/AuthStatusMonitor.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

export function AuthStatusMonitor() {
  const { user, isAuthLoading, claims } = useAuth();

  const status = {
    isAuthLoading,
    isAuthenticated: !!user,
    userId: user?.id || null,
    role: claims?.role || 'No role claim',
    email: user?.email || null,
  };

  const statusColor = isAuthLoading
    ? 'bg-yellow-500'
    : user
    ? 'bg-green-500'
    : 'bg-red-500';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        zIndex: 9999,
        padding: '10px 15px',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
      }}
      className={statusColor}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px' }}>Auth Status</div>
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
}
