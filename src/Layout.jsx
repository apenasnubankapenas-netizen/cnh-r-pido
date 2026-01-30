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
  const [userType, setUserType] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserType();
    }
  }, [user, student]);

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

  const loadUserType = async () => {
    try {
      if (!user) return;
      
      // HIERARQUIA 1: SUPERADMINISTRADOR (acesso total)
      if (user.role === 'admin' && user.email === 'tcnhpara@gmail.com') {
        setUserType('superadmin');
        return;
      }
      
      // HIERARQUIA 2: VENDEDORES (admin sem ser super)
      if (user.role === 'admin') {
        const sellers = await base44.entities.Seller.filter({ email: user.email });
        if (sellers.length > 0 && sellers[0].active) {
          setUserType('seller');
          return;
        }
      }
      
      // HIERARQUIA 3: INSTRUTORES (admin sem ser super nem vendedor)
      if (user.role === 'admin') {
        const instructors = await base44.entities.Instructor.filter({ user_email: user.email });
        if (instructors.length > 0 && instructors[0].active) {
          setUserType('instructor');
          setInstructor(instructors[0]);
          return;
        }
      }
      
      // HIERARQUIA 4: ALUNOS (user com cadastro de student)
      if (user.role === 'user' && student) {
        setUserType('student');
        return;
      }
      
      // Se admin mas não é vendedor nem instrutor, pode ser um admin genérico
      if (user.role === 'admin') {
        setUserType('admin');
        return;
      }
      
      setUserType(null);
    } catch (e) {
      console.log(e);
      setUserType(null);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getMenuItems = () => {
    if (!userType) return [];
    
    // HIERARQUIA 1: SUPERADMINISTRADOR - Acesso TOTAL a tudo
    if (userType === 'superadmin') {
      return [
        { name: 'Dashboard', icon: Home, page: 'AdminDashboard' },
        { name: 'Alunos', icon: Users, page: 'AdminStudents' },
        { name: 'Instrutores', icon: Car, page: 'AdminInstructors' },
        { name: 'Aulas', icon: Calendar, page: 'AdminLessons' },
        { name: 'Conversas', icon: MessageSquare, page: 'AdminChats' },
        { name: 'Pagamentos', icon: DollarSign, page: 'AdminPayments' },
        { name: 'Vendedores', icon: UserCog, page: 'AdminSellers' },
        { name: 'Configurações', icon: Settings, page: 'AdminSettings' },
      ];
    }
    
    // HIERARQUIA 2: VENDEDORES - Dashboard, Alunos, Aulas, Conversas, Pagamentos (SEM Configurações)
    if (userType === 'seller') {
      return [
        { name: 'Dashboard', icon: Home, page: 'AdminDashboard' },
        { name: 'Alunos', icon: Users, page: 'AdminStudents' },
        { name: 'Aulas', icon: Calendar, page: 'AdminLessons' },
        { name: 'Conversas', icon: MessageSquare, page: 'AdminChats' },
        { name: 'Pagamentos', icon: DollarSign, page: 'AdminPayments' },
      ];
    }
    
    // HIERARQUIA 3: INSTRUTORES - Dashboard, Alunos, Aulas, Conversas + permissões personalizadas
    if (userType === 'instructor') {
      const items = [
        { name: 'Dashboard', icon: Home, page: 'AdminDashboard' },
        { name: 'Alunos', icon: Users, page: 'AdminStudents' },
        { name: 'Aulas', icon: Calendar, page: 'AdminLessons' },
        { name: 'Conversas', icon: MessageSquare, page: 'AdminChats' },
      ];
      
      if (instructor?.can_view_payments) {
        items.push({ name: 'Pagamentos', icon: DollarSign, page: 'AdminPayments' });
      }
      
      if (instructor?.can_view_sellers) {
        items.push({ name: 'Vendedores', icon: UserCog, page: 'AdminSellers' });
      }
      
      if (instructor?.can_view_settings) {
        items.push({ name: 'Configurações', icon: Settings, page: 'AdminSettings' });
      }
      
      return items;
    }
    
    // ADMIN GENÉRICO (caso exista admin que não seja nenhum dos acima)
    if (userType === 'admin') {
      return [
        { name: 'Dashboard', icon: Home, page: 'AdminDashboard' },
        { name: 'Alunos', icon: Users, page: 'AdminStudents' },
        { name: 'Instrutores', icon: Car, page: 'AdminInstructors' },
        { name: 'Aulas', icon: Calendar, page: 'AdminLessons' },
        { name: 'Conversas', icon: MessageSquare, page: 'AdminChats' },
      ];
    }
    
    // HIERARQUIA 4: ALUNOS - Apenas Instrutores, Minhas Aulas, Conversas, Meu Perfil
    if (userType === 'student') {
      return [
        { name: 'Instrutores', icon: Users, page: 'Instructors' },
        { name: 'Minhas Aulas', icon: Calendar, page: 'MyLessons' },
        { name: 'Conversas', icon: MessageSquare, page: 'Chat' },
        { name: 'Meu Perfil', icon: GraduationCap, page: 'StudentProfile' },
      ];
    }
    
    return [];
  };

  const menuItems = getMenuItems();

  // Enforce seller password session; logout if version mismatch
  useEffect(() => {
    const enforceSellerSession = async () => {
      try {
        if (userType !== 'seller' || !user) return;
        const sellers = await base44.entities.Seller.filter({ email: user.email });
        if (sellers.length === 0) return;
        const s = sellers[0];
        const key = `seller_session_version:${user.email}`;
        const stored = localStorage.getItem(key);
        const current = String(s.session_version || 1);
        if (stored !== current) {
          // Força logout e redireciona para ADMIN
          base44.auth.logout();
          setTimeout(() => {
            navigate(createPageUrl('AdminLogin'));
          }, 200);
        }
      } catch (e) {
        console.log(e);
      }
    };
    enforceSellerSession();
  }, [userType, user]);

  // Páginas públicas sem menu lateral (Landing, Login pages, Chat público)
  const publicPages = ['Landing', 'AdminLogin', 'SuperAdminLogin', 'StudentRegister', 'InstructorRegister'];
  const isPublicPage = publicPages.includes(currentPageName);
  
  // Se não está logado
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white font-mono">
        {children}
      </div>
    );
  }

  // Se está em página pública ou não tem cadastro, mostrar top bar mas sem sidebar
  if (isPublicPage || (userType === null && user.role === 'user')) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white font-mono">
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        :root {
          --bg-primary: #0a0e1a;
          --bg-secondary: #0d1117;
          --bg-card: #161b22;
          --accent-blue: #0969da;
          --accent-blue-dark: #0550ae;
          --accent-blue-light: #2f81f7;
          --accent-yellow: #f0c41b;
          --accent-yellow-dark: #d4aa00;
          --text-primary: #e6edf3;
          --text-secondary: #e6edf3;
          --border-color: #30363d;
          --shadow-blue: rgba(9, 105, 218, 0.4);
          --shadow-yellow: rgba(240, 196, 27, 0.4);
        }
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        
        body {
          background: linear-gradient(135deg, #0a0e1a 0%, #0d1117 100%);
          background-attachment: fixed;
        }

        /* Focus visível acessível */
        a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid var(--accent-blue-light);
          outline-offset: 2px;
        }

        /* Raio padronizado */
        .rounded, .rounded-md, .rounded-lg, .rounded-xl { border-radius: var(--radius); }

        /* Hierarquia tipográfica */
        h1 { font-weight: 800; letter-spacing: -0.02em; }
        h2 { font-weight: 700; letter-spacing: -0.015em; }
        h3 { font-weight: 600; letter-spacing: -0.01em; }

        /* Force light text everywhere */
        body, p, span, a, label, input, textarea, select, button, small, li, dt, dd, div, h1, h2, h3, h4, h5, h6 {
          color: var(--text-primary, #e6edf3) !important;
        }
        .text-muted, .text-muted-foreground, .muted, .text-secondary {
          color: #eef2f7 !important;
        }
        ::placeholder, input::placeholder, textarea::placeholder {
          color: #dbeafe !important; opacity: 1 !important;
        }
        input, textarea, select, [contenteditable="true"] {
          color: #e6edf3 !important; caret-color: #f0c41b !important;
        }
        .disabled, [disabled] { color: #e6edf3 !important; opacity: 0.7; }
        `}</style>

        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-[#0d1117] border-b border-[#30363d] z-40 flex items-center justify-between px-3 backdrop-blur-sm bg-opacity-95">
          <div className="flex items-center gap-2">
            <Link 
              to={createPageUrl('Landing')} 
              className="flex items-center hover:opacity-80 transition-opacity p-1.5"
            >
              <Car className="text-[#f0c41b]" size={24} />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0">
              <Link to={createPageUrl('Landing')}>
                <button className="text-[10px] sm:text-xs text-[#cbd5e1] hover:text-[#e6edf3] px-2.5 py-1.5 rounded transition-colors font-semibold">
                  INÍCIO
                </button>
              </Link>
              <span className="text-[#cbd5e1] text-xs">|</span>
              <Link to={createPageUrl('AdminLogin')}>
                <button className="text-[10px] sm:text-xs text-[#cbd5e1] hover:text-[#0969da] px-2.5 py-1.5 rounded transition-colors font-semibold">
                  ADMIN
                </button>
              </Link>
              <span className="text-[#cbd5e1] text-xs">|</span>
              <Link to={createPageUrl('SuperAdminLogin')}>
                <button className="text-[10px] sm:text-xs text-[#cbd5e1] hover:text-[#f0c41b] px-2.5 py-1.5 rounded transition-colors font-semibold">
                  SUPER
                </button>
              </Link>
            </div>

            <span className="text-xs text-[#e6edf3] hidden md:block font-medium truncate max-w-[120px]">{user?.full_name || user?.email}</span>
            <button 
              onClick={handleLogout} 
              className="p-2 hover:bg-[#1a2332] rounded text-[#ef4444] hover:text-[#ff5555] transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <main className="pt-14 min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  // Se está logado mas ainda carregando o tipo de usuário
  if (!userType) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white font-mono flex items-center justify-center">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white font-mono">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        :root {
          --bg-primary: #0a0e1a;
          --bg-secondary: #0d1117;
          --bg-card: #161b22;
          --accent-blue: #0969da;
          --accent-blue-dark: #0550ae;
          --accent-blue-light: #2f81f7;
          --accent-yellow: #f0c41b;
          --accent-yellow-dark: #d4aa00;
          --text-primary: #e6edf3;
          --text-secondary: #e6edf3;
          --border-color: #30363d;
          --shadow-blue: rgba(9, 105, 218, 0.4);
          --shadow-yellow: rgba(240, 196, 27, 0.4);
        }
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        
        body {
          background: linear-gradient(135deg, #0a0e1a 0%, #0d1117 100%);
          background-attachment: fixed;
        }

        /* Focus visível acessível */
        a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid var(--accent-blue-light);
          outline-offset: 2px;
        }

        /* Raio padronizado */
        .rounded, .rounded-md, .rounded-lg, .rounded-xl { border-radius: var(--radius); }

        /* Hierarquia tipográfica */
        h1 { font-weight: 800; letter-spacing: -0.02em; }
        h2 { font-weight: 700; letter-spacing: -0.015em; }
        h3 { font-weight: 600; letter-spacing: -0.01em; }
        
        .terminal-glow {
                        box-shadow: 0 0 10px var(--shadow-blue), 0 2px 6px rgba(0, 0, 0, 0.2);
                        border: 1px solid rgba(9, 105, 218, 0.2);
                      }
        
        .yellow-glow {
                        box-shadow: 0 0 8px var(--shadow-yellow), 0 2px 4px rgba(0, 0, 0, 0.2);
                      }
        
        .terminal-border {
                        border: 1px solid var(--accent-blue);
                        box-shadow: 0 0 6px var(--shadow-blue);
                      }
        
        .scan-line {
          animation: scan 8s linear infinite;
        }
        
        @keyframes scan {
          0%, 100% { opacity: 0.05; transform: translateY(0); }
          50% { opacity: 0.1; transform: translateY(100vh); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px var(--shadow-blue); }
          50% { box-shadow: 0 0 40px var(--shadow-blue); }
        }
        
        .pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: var(--bg-secondary);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: var(--accent-blue);
          border-radius: 4px;
          border: 2px solid var(--bg-secondary);
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: var(--accent-blue-light);
        }
        
        /* Typography */
        h1 { font-weight: 800; letter-spacing: -0.02em; }
        h2 { font-weight: 700; letter-spacing: -0.015em; }
        h3 { font-weight: 600; letter-spacing: -0.01em; }
        h4, h5, h6 { font-weight: 600; letter-spacing: -0.01em; }
        
        /* Button hover effects */
        button {
          transition: all 0.15s ease;
          min-height: 40px;
        }
        
        button:active {
          transform: scale(0.98);
        }
        
        /* Ajustes adicionais de acessibilidade */
        .text-muted { color: var(--text-secondary); }
        .badge-outline { border-color: #4b5563; }

        /* Force light text everywhere */
        body, p, span, a, label, input, textarea, select, button, small, li, dt, dd, div, h1, h2, h3, h4, h5, h6 {
          color: var(--text-primary, #e6edf3) !important;
        }
        .text-muted, .text-muted-foreground, .muted, .text-secondary {
          color: #eef2f7 !important;
        }
        ::placeholder, input::placeholder, textarea::placeholder {
          color: #dbeafe !important; opacity: 1 !important;
        }
        input, textarea, select, [contenteditable="true"] {
          color: #e6edf3 !important; caret-color: #f0c41b !important;
        }
        .disabled, [disabled] { color: #e6edf3 !important; opacity: 0.7; }
        
      `}</style>

      {/* Scan Line Effect */}
      <div className="scan-line fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0969da] to-transparent opacity-10 pointer-events-none z-50" />
      
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#0d1117] border-b border-[#30363d] z-40 flex items-center justify-between px-3 backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-[#1a2332] rounded transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link 
            to={createPageUrl('Landing')} 
            className="flex items-center hover:opacity-80 transition-opacity p-1.5"
          >
            <Car className="text-[#f0c41b]" size={24} />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0">
            <Link to={createPageUrl('Landing')}>
              <button className="text-[10px] sm:text-xs text-[#cbd5e1] hover:text-[#e6edf3] px-2.5 py-1.5 rounded transition-colors font-semibold">
                INÍCIO
              </button>
            </Link>
            <span className="text-[#cbd5e1] text-xs">|</span>
            <Link to={createPageUrl('AdminLogin')}>
              <button className="text-[10px] sm:text-xs text-[#cbd5e1] hover:text-[#0969da] px-2.5 py-1.5 rounded transition-colors font-semibold">
                ADMIN
              </button>
            </Link>
            <span className="text-[#cbd5e1] text-xs">|</span>
            <Link to={createPageUrl('SuperAdminLogin')}>
              <button className="text-[10px] sm:text-xs text-[#cbd5e1] hover:text-[#f0c41b] px-2.5 py-1.5 rounded transition-colors font-semibold">
                SUPER
              </button>
            </Link>
          </div>

          <span className="text-xs text-[#e6edf3] hidden md:block font-medium truncate max-w-[120px]">{user?.full_name || user?.email}</span>
          <button 
            onClick={handleLogout} 
            className="p-2 hover:bg-[#1a2332] rounded text-[#ef4444] hover:text-[#ff5555] transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-14 left-0 h-[calc(100vh-56px)] w-64 bg-[#0d1117] border-r border-[#30363d] z-30 transform transition-transform duration-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 backdrop-blur-sm bg-opacity-95 overflow-y-auto`}>
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#0969da] to-[#0550ae] text-white shadow-md' 
                    : 'hover:bg-[#161b22] text-[#cbd5e1] hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#f0c41b]' : ''} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Status */}
        {student && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-[#161b22] rounded-lg border border-[#30363d] terminal-glow">
            <div className="text-xs text-[#cbd5e1] mb-1 font-semibold">Status do Processo</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${student.exam_done ? 'bg-green-500' : 'bg-[#374151]'}`} />
                <span className="text-[#e6edf3] font-medium">Exames</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${student.theoretical_test_done ? 'bg-green-500' : 'bg-[#374151]'}`} />
                <span className="text-[#e6edf3] font-medium">Prova Teórica</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${student.practical_test_done ? 'bg-green-500' : 'bg-[#374151]'}`} />
                <span className="text-[#e6edf3] font-medium">Prova Prática</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 min-h-screen">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}