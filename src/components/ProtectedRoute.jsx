import React from 'react';
import { Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useUserPermissions } from './useUserPermissions';
import { XCircle, Loader2 } from 'lucide-react';

/**
 * Componente para proteger rotas baseado em permissões
 * Uso: <ProtectedRoute requirePermission="canViewPayments" fallback="/AdminDashboard">
 */
export function ProtectedRoute({ 
  children, 
  requirePermission = null, 
  requireUserType = null,
  fallback = null,
  showMessage = true 
}) {
  const { userType, permissions, loading } = useUserPermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#fbbf24]" size={32} />
      </div>
    );
  }

  // Verificar tipo de usuário específico
  if (requireUserType) {
    const types = Array.isArray(requireUserType) ? requireUserType : [requireUserType];
    if (!types.includes(userType)) {
      if (fallback) {
        return <Navigate to={createPageUrl(fallback)} replace />;
      }
      if (showMessage) {
        return (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <XCircle className="text-red-500" size={48} />
            <p className="text-white text-lg">Acesso negado</p>
            <p className="text-[#9ca3af] text-sm">Você não tem permissão para acessar esta página.</p>
          </div>
        );
      }
      return null;
    }
  }

  // Verificar permissão específica
  if (requirePermission && !permissions[requirePermission]) {
    if (fallback) {
      return <Navigate to={createPageUrl(fallback)} replace />;
    }
    if (showMessage) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <XCircle className="text-red-500" size={48} />
          <p className="text-white text-lg">Acesso negado</p>
          <p className="text-[#9ca3af] text-sm">Você não tem permissão para acessar esta funcionalidade.</p>
        </div>
      );
    }
    return null;
  }

  return children;
}

/**
 * Hook para verificar permissões em componentes
 */
export function useProtectedAccess(requirePermission) {
  const { permissions, loading } = useUserPermissions();
  
  return {
    hasAccess: !loading && (!requirePermission || permissions[requirePermission]),
    loading
  };
}