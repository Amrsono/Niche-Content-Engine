"use client";

import React from 'react';
import { useAdminGuard } from '@/app/hooks/useAdminGuard';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isLoaded, isAdmin } = useAdminGuard();

  if (!isLoaded) {
    return (
      fallback || (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: '#00f0ff' }} />
        </div>
      )
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
