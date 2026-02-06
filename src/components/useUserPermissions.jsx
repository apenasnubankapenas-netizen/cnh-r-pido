import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook centralizado para gerenciar permissões e tipo de usuário
 * 
 * Hierarquia de acesso:
 * 1. SUPERADMIN (tcnhpara@gmail.com) - Acesso total
 * 2. AUTHORIZED_VIEWERS - Podem ver pagamentos se autorizados
 * 3. SELLERS (consultores) - Acesso a alunos, aulas, conversas
 * 4. INSTRUCTORS - Acesso limitado, SEM pagamentos
 * 5. STUDENTS - Interface do aluno
 */
export function useUserPermissions() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [permissions, setPermissions] = useState({
    canViewPayments: false,
    canEditSettings: false,
    canManageInstructors: false,
    canManageSellers: false,
    canViewAllStudents: true,
    canViewAllLessons: true,
  });
  const [metadata, setMetadata] = useState({
    student: null,
    instructor: null,
    seller: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // HIERARQUIA 1: SUPERADMIN - Acesso total
      if (currentUser.role === 'admin' && currentUser.email === 'tcnhpara@gmail.com') {
        setUserType('superadmin');
        setPermissions({
          canViewPayments: true,
          canEditSettings: true,
          canManageInstructors: true,
          canManageSellers: true,
          canViewAllStudents: true,
          canViewAllLessons: true,
        });
        setLoading(false);
        return;
      }

      // Para admins, verificar autorização de pagamentos
      let canViewPayments = false;
      if (currentUser.role === 'admin') {
        const settingsList = await base44.entities.AppSettings.list();
        const authorizedEmails = settingsList[0]?.authorized_payment_viewers || [];
        canViewPayments = authorizedEmails.includes(currentUser.email);
      }

      // HIERARQUIA 2: SELLERS (consultores)
      if (currentUser.role === 'admin') {
        const sellers = await base44.entities.Seller.filter({ email: currentUser.email, active: true });
        if (sellers.length > 0) {
          setUserType('seller');
          setMetadata({ seller: sellers[0], student: null, instructor: null });
          setPermissions({
            canViewPayments: canViewPayments,
            canEditSettings: false,
            canManageInstructors: false,
            canManageSellers: true,
            canViewAllStudents: true,
            canViewAllLessons: true,
          });
          setLoading(false);
          return;
        }
      }

      // HIERARQUIA 3: INSTRUCTORS
      if (currentUser.role === 'admin') {
        const instructors = await base44.entities.Instructor.filter({ user_email: currentUser.email, active: true });
        if (instructors.length > 0) {
          setUserType('instructor');
          setMetadata({ instructor: instructors[0], student: null, seller: null });
          setPermissions({
            canViewPayments: false, // NUNCA
            canEditSettings: instructors[0].can_view_settings || false,
            canManageInstructors: false,
            canManageSellers: false,
            canViewAllStudents: true,
            canViewAllLessons: true,
          });
          setLoading(false);
          return;
        }
      }

      // HIERARQUIA 4: STUDENTS
      if (currentUser.role === 'user') {
        const students = await base44.entities.Student.filter({ user_email: currentUser.email });
        if (students.length > 0) {
          setUserType('student');
          setMetadata({ student: students[0], instructor: null, seller: null });
          setPermissions({
            canViewPayments: false,
            canEditSettings: false,
            canManageInstructors: false,
            canManageSellers: false,
            canViewAllStudents: false,
            canViewAllLessons: false,
          });
          setLoading(false);
          return;
        }

        // User sem cadastro de student
        setUserType('new_user');
        setPermissions({
          canViewPayments: false,
          canEditSettings: false,
          canManageInstructors: false,
          canManageSellers: false,
          canViewAllStudents: false,
          canViewAllLessons: false,
        });
        setLoading(false);
        return;
      }

      // Admin genérico sem papel específico
      if (currentUser.role === 'admin') {
        setUserType('admin');
        setPermissions({
          canViewPayments: canViewPayments,
          canEditSettings: false,
          canManageInstructors: false,
          canManageSellers: false,
          canViewAllStudents: true,
          canViewAllLessons: true,
        });
      }

      setLoading(false);
    } catch (e) {
      console.error('Error loading user permissions:', e);
      setLoading(false);
    }
  };

  const isSuperAdmin = () => userType === 'superadmin';
  const isInstructor = () => userType === 'instructor';
  const isSeller = () => userType === 'seller';
  const isStudent = () => userType === 'student';
  const isAdmin = () => ['superadmin', 'admin', 'seller', 'instructor'].includes(userType);

  return {
    user,
    userType,
    permissions,
    metadata,
    loading,
    isSuperAdmin,
    isInstructor,
    isSeller,
    isStudent,
    isAdmin,
    refresh: loadUserPermissions,
  };
}