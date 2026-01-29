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
  // Super Admin é identificado por email específico
  const isSuperAdmin = user?.role === 'admin' && user?.email === 'tcnhpara@gmail.com';

  const studentMenuItems = [
    { name: 'Dashboard', icon: Home, page: 'Home' },
    { name: 'Minhas Aulas', icon: Calendar, page: 'MyLessons' },
    { name: 'Instrutores', icon: Users, page: 'Instructors' },
    { name: 'Simulados', icon: BookOpen, page: 'Simulados' },
    { name: 'Chat', icon: MessageSquare, page: 'Chat' },
    { name: 'Meu Perfil', icon: GraduationCap, page: 'StudentProfile' },
  ];

  const adminMenuItems = [
    { name: 'Dashboard', icon: Home, page: 'AdminDashboard' },
    { name: 'Alunos', icon: Users, page: 'AdminStudents' },
    { name: 'Aulas', icon: Calendar, page: 'AdminLessons' },
    { name: 'Conversas', icon: MessageSquare, page: 'AdminChats' },
    { name: 'Pagamentos', icon: DollarSign, page: 'AdminPayments' },
  ];

  const superAdminMenuItems = [
    { name: 'Dashboard', icon: Home, page: 'AdminDashboard' },
    { name: 'Alunos', icon: Users, page: 'AdminStudents' },
    { name: 'Instrutores', icon: Car, page: 'AdminInstructors' },
    { name: 'Aulas', icon: Calendar, page: 'AdminLessons' },
    { name: 'Conversas', icon: MessageSquare, page: 'AdminChats' },
    { name: 'Pagamentos', icon: DollarSign, page: 'AdminPayments' },
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
          --text-secondary: #7d8590;
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
        
        .terminal-glow {
          box-shadow: 0 0 30px var(--shadow-blue), 0 4px 12px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(9, 105, 218, 0.3);
        }
        
        .yellow-glow {
          box-shadow: 0 0 20px var(--shadow-yellow), 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .terminal-border {
          border: 1px solid var(--accent-blue);
          box-shadow: 0 0 15px var(--shadow-blue);
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
        h1, h2, h3, h4, h5, h6 {
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        
        /* Button hover effects */
        button {
          transition: all 0.15s ease;
        }
        
        button:active {
          transform: scale(0.98);
        }
      `}</style>

      {/* Scan Line Effect */}
      <div className="scan-line fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0969da] to-transparent opacity-20 pointer-events-none z-50" />
      
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
              <button className="text-[10px] sm:text-xs text-[#30363d] hover:text-[#e6edf3] px-2.5 py-1.5 rounded transition-colors font-semibold">
                INÍCIO
              </button>
            </Link>
            <span className="text-[#30363d] text-xs">|</span>
            <Link to={createPageUrl('AdminLogin')}>
              <button className="text-[10px] sm:text-xs text-[#30363d] hover:text-[#0969da] px-2.5 py-1.5 rounded transition-colors font-semibold">
                ADMIN
              </button>
            </Link>
            <span className="text-[#30363d] text-xs">|</span>
            <Link to={createPageUrl('SuperAdminLogin')}>
              <button className="text-[10px] sm:text-xs text-[#30363d] hover:text-[#f0c41b] px-2.5 py-1.5 rounded transition-colors font-semibold">
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
                    : 'hover:bg-[#161b22] text-[#7d8590] hover:text-white'
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
            <div className="text-xs text-[#7d8590] mb-1 font-semibold">Status do Processo</div>
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