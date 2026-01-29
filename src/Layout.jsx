import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  GraduationCap,
  Car,
  ClipboardList,
  DollarSign,
  UserCog,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser?.role === 'user') {
        const students = await base44.entities.Student.filter({ user_email: currentUser.email });
        if (students.length > 0) {
          setStudent(students[0]);
        }
      }
    } catch (e) {
      console.log('Not logged in');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'admin' && user?.email?.includes('super');

  const studentMenuItems = [
    { name: 'Início', icon: Home, page: 'Home' },
    { name: 'Minhas Aulas', icon: Calendar, page: 'MyLessons' },
    { name: 'Instrutores', icon: Users, page: 'Instructors' },
    { name: 'Simulados', icon: BookOpen, page: 'Simulados' },
    { name: 'Chat', icon: MessageSquare, page: 'Chat' },
    { name: 'Meu Perfil', icon: GraduationCap, page: 'StudentProfile' },
  ];

  const adminMenuItems = [
    { name: 'Dashboard', icon: Home, page: 'AdminDashboard' },
    { name: 'Alunos', icon: Users, page: 'AdminStudents' },
    { name: 'Instrutores', icon: Car, page: 'AdminInstructors' },
    { name: 'Aulas', icon: Calendar, page: 'AdminLessons' },
    { name: 'Conversas', icon: MessageSquare, page: 'AdminChats' },
    { name: 'Pagamentos', icon: DollarSign, page: 'AdminPayments' },
  ];

  const superAdminMenuItems = [
    ...adminMenuItems,
    { name: 'Vendedores', icon: UserCog, page: 'AdminSellers' },
    { name: 'Configurações', icon: Settings, page: 'AdminSettings' },
  ];

  const menuItems = isSuperAdmin ? superAdminMenuItems : (isAdmin ? adminMenuItems : studentMenuItems);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white font-mono">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white font-mono">
      <style>{`
        :root {
          --bg-primary: #0a0e1a;
          --bg-secondary: #111827;
          --bg-card: #1a2332;
          --accent-blue: #1e40af;
          --accent-blue-light: #3b82f6;
          --accent-yellow: #fbbf24;
          --text-primary: #ffffff;
          --text-secondary: #9ca3af;
          --border-color: #374151;
        }
        
        * {
          font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
          font-weight: 500;
        }
        
        .terminal-glow {
          box-shadow: 0 0 20px rgba(30, 64, 175, 0.3);
        }
        
        .yellow-glow {
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: var(--bg-secondary);
        }
        
        ::-webkit-scrollbar-thumb {
          background: var(--accent-blue);
          border-radius: 3px;
        }
      `}</style>

      {/* Top Bar com login admin discreto */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-[#111827] border-b border-[#374151] z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-[#1a2332] rounded"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <Car className="text-[#fbbf24]" size={24} />
            <span className="text-lg font-bold text-[#fbbf24]">CNH PARA TODOS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botões discretos de admin */}
          {!isAdmin && (
            <div className="relative">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="text-[8px] text-[#374151] hover:text-[#6b7280] px-1"
              >
                •••
              </button>
              {showAdminMenu && (
                <div className="absolute right-0 top-6 bg-[#1a2332] border border-[#374151] rounded p-2 text-xs space-y-1 min-w-[120px]">
                  <Link to={createPageUrl('AdminLogin')} className="block hover:text-[#fbbf24] text-[10px]">
                    Admin
                  </Link>
                  <Link to={createPageUrl('SuperAdminLogin')} className="block hover:text-[#fbbf24] text-[10px]">
                    Super Admin
                  </Link>
                </div>
              )}
            </div>
          )}
          
          <span className="text-sm text-[#9ca3af] hidden sm:block">{user?.full_name || user?.email}</span>
          <button onClick={handleLogout} className="p-2 hover:bg-[#1a2332] rounded text-[#ef4444]">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-12 left-0 h-[calc(100vh-48px)] w-64 bg-[#111827] border-r border-[#374151] z-40 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-[#1e40af] text-white terminal-glow' 
                    : 'hover:bg-[#1a2332] text-[#9ca3af] hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#fbbf24]' : ''} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Status */}
        {student && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-[#1a2332] rounded-lg border border-[#374151]">
            <div className="text-xs text-[#9ca3af] mb-1">Status do Processo</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${student.exam_done ? 'bg-green-500' : 'bg-[#374151]'}`} />
                <span>Exames</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${student.theoretical_test_done ? 'bg-green-500' : 'bg-[#374151]'}`} />
                <span>Prova Teórica</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${student.practical_test_done ? 'bg-green-500' : 'bg-[#374151]'}`} />
                <span>Prova Prática</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-12 min-h-screen">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}