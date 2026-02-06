import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [userType, setUserType] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const [showGenerateCodeModal, setShowGenerateCodeModal] = useState(false);
  const [showGenerateSellerCodeModal, setShowGenerateSellerCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedSellerCode, setGeneratedSellerCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [sellerCodeLoading, setSellerCodeLoading] = useState(false);
  const [showStudentSelectorModal, setShowStudentSelectorModal] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentForView, setSelectedStudentForView] = useState(null);
  const [pendingStudentPage, setPendingStudentPage] = useState(null);
  const [allInstructors, setAllInstructors] = useState([]);
  const [selectedInstructorForView, setSelectedInstructorForView] = useState(null);
  const [showInstructorSelectorModal, setShowInstructorSelectorModal] = useState(false);
  const [pendingInstructorPage, setPendingInstructorPage] = useState(null);
  const [allSellers, setAllSellers] = useState([]);
  const [selectedSellerForView, setSelectedSellerForView] = useState(null);
  const [showSellerSelectorModal, setShowSellerSelectorModal] = useState(false);
  const [pendingSellerPage, setPendingSellerPage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUser();
    loadStudentsForSelector();
    loadInstructorsForSelector();
    loadSellersForSelector();
    // Carregar aluno selecionado do localStorage
    const savedStudent = localStorage.getItem('admin_view_student');
    if (savedStudent) {
      setSelectedStudentForView(JSON.parse(savedStudent));
    }
    // Carregar instrutor selecionado do localStorage
    const savedInstructor = localStorage.getItem('admin_view_instructor');
    if (savedInstructor) {
      setSelectedInstructorForView(JSON.parse(savedInstructor));
    }
    // Carregar colaborador selecionado do localStorage
    const savedSeller = localStorage.getItem('admin_view_seller');
    if (savedSeller) {
      setSelectedSellerForView(JSON.parse(savedSeller));
    }
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

  const loadStudentsForSelector = async () => {
    try {
      const students = await base44.entities.Student.list();
      setAllStudents(students);
    } catch (e) {
      console.error('Erro ao carregar alunos:', e);
    }
  };

  const loadInstructorsForSelector = async () => {
    try {
      const instructors = await base44.entities.Instructor.list();
      setAllInstructors(instructors);
    } catch (e) {
      console.error('Erro ao carregar instrutores:', e);
    }
  };

  const loadSellersForSelector = async () => {
    try {
      const sellers = await base44.entities.Seller.list();
      setAllSellers(sellers);
    } catch (e) {
      console.error('Erro ao carregar colaboradores:', e);
    }
  };

  const handleStudentPageClick = (pageName) => {
    if (userType === 'superadmin') {
      setPendingStudentPage(pageName);
      setShowStudentSelectorModal(true);
    }
  };

  const selectStudentAndNavigate = (student) => {
    setSelectedStudentForView(student);
    localStorage.setItem('admin_view_student', JSON.stringify(student));
    setShowStudentSelectorModal(false);
    if (pendingStudentPage) {
      navigate(createPageUrl(pendingStudentPage));
      setPendingStudentPage(null);
    }
  };

  const clearStudentView = () => {
    setSelectedStudentForView(null);
    localStorage.removeItem('admin_view_student');
  };

  const selectInstructorAndNavigate = (instructor) => {
    setSelectedInstructorForView(instructor);
    localStorage.setItem('admin_view_instructor', JSON.stringify(instructor));
    setShowInstructorSelectorModal(false);
    if (pendingInstructorPage) {
      navigate(createPageUrl(pendingInstructorPage));
      setPendingInstructorPage(null);
    }
  };

  const clearInstructorView = () => {
    setSelectedInstructorForView(null);
    localStorage.removeItem('admin_view_instructor');
  };

  const selectSellerAndNavigate = (seller) => {
    setSelectedSellerForView(seller);
    localStorage.setItem('admin_view_seller', JSON.stringify(seller));
    setShowSellerSelectorModal(false);
    if (pendingSellerPage) {
      navigate(createPageUrl(pendingSellerPage));
      setPendingSellerPage(null);
    }
  };

  const clearSellerView = () => {
    setSelectedSellerForView(null);
    localStorage.removeItem('admin_view_seller');
  };

  const loadUserType = async () => {
    try {
      if (!user) {
        setUserType(null);
        return;
      }
      
      // HIERARQUIA 1: SUPERADMINISTRADOR (acesso total)
      if (user.role === 'admin' && user.email === 'tcnhpara@gmail.com') {
        setUserType('superadmin');
        return;
      }
      
      // HIERARQUIA 2: CONSULTORES (admin sem ser super)
      if (user.role === 'admin') {
        const sellers = await base44.entities.Seller.filter({ email: user.email });
        if (sellers.length > 0 && sellers[0].active) {
          setUserType('seller');
          return;
        }
      }
      
      // HIERARQUIA 3: INSTRUTORES (admin sem ser super nem consultor)
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
      
      // Se é user mas não tem cadastro de student, definir como 'new_user' para redirecionar ao registro
      if (user.role === 'user' && !student) {
        setUserType('new_user');
        return;
      }
      
      // Se admin mas não é consultor nem instrutor, pode ser um admin genérico
      if (user.role === 'admin') {
        setUserType('admin');
        return;
      }
      
      setUserType(null);
    } catch (e) {
      console.error('Erro em loadUserType:', e);
      setUserType(null);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const generateInstructorCode = async () => {
    setCodeLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 11).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Válido por 30 dias
      
      await base44.entities.InstructorAccessCode.create({
        code,
        used: false,
        expires_at: expiresAt.toISOString(),
        notes: `Gerado para ${user?.full_name}`
      });
      
      setGeneratedCode(code);
      navigator.clipboard.writeText(code).catch(() => {});
    } catch (e) {
      alert('Erro ao gerar código: ' + e.message);
    } finally {
      setCodeLoading(false);
    }
  };

  const generateSellerCode = async () => {
    setSellerCodeLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 11).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Válido por 30 dias
      
      await base44.entities.SellerAccessCode.create({
        code,
        used: false,
        expires_at: expiresAt.toISOString(),
        notes: `Gerado para ${user?.full_name}`
      });
      
      setGeneratedSellerCode(code);
      navigator.clipboard.writeText(code).catch(() => {});
    } catch (e) {
      alert('Erro ao gerar código: ' + e.message);
    } finally {
      setSellerCodeLoading(false);
    }
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
        { name: 'Pagamentos Instrutores', icon: DollarSign, page: 'AdminPayouts' },
        { name: 'Consultores', icon: UserCog, page: 'AdminSellers' },
        { name: 'Configurações', icon: Settings, page: 'AdminSettings' },
        { name: '---', icon: null, page: null }, // Separador visual
        { name: 'Simular Visão Instrutor', icon: Car, page: null, action: 'selectInstructor' },
        { name: 'Simular Visão Colaborador', icon: UserCog, page: null, action: 'selectSeller' },
        { name: 'Simular Visão Aluno', icon: Users, page: null, action: 'selectStudent' },
        { name: '---', icon: null, page: null }, // Separador visual
        { name: 'Ver Instrutores (Aluno)', icon: Users, page: 'Instructors', viewAs: 'student' },
        { name: 'Minhas Aulas (Aluno)', icon: Calendar, page: 'MyLessons', viewAs: 'student' },
        { name: 'Chat (Aluno)', icon: MessageSquare, page: 'Chat', viewAs: 'student' },
        { name: 'Pagamentos (Aluno)', icon: DollarSign, page: 'StudentPayments', viewAs: 'student' },
        { name: 'Consultores (Aluno)', icon: UserCog, page: 'StudentSellers', viewAs: 'student' },
        { name: 'Perfil (Aluno)', icon: GraduationCap, page: 'StudentProfile', viewAs: 'student' },
      ];
    }
    
    // HIERARQUIA 2: CONSULTORES - Acesso completo a: alunos, aulas, conversas, horários, perfil colaboradores
    if (userType === 'seller') {
      return [
        { name: 'Dashboard', icon: Home, page: 'AdminDashboard' },
        { name: 'Alunos', icon: Users, page: 'AdminStudents' },
        { name: 'Aulas', icon: Calendar, page: 'AdminLessons' },
        { name: 'Conversas', icon: MessageSquare, page: 'AdminChats' },
        { name: 'Colaboradores', icon: UserCog, page: 'AdminSellers' },
        { name: 'Configurações', icon: Settings, page: 'AdminSettings' },
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
      
      // Pagamentos não disponíveis para instrutores
      
      if (instructor?.can_view_sellers) {
        items.push({ name: 'Consultores', icon: UserCog, page: 'AdminSellers' });
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
    
    // HIERARQUIA 4: ALUNOS - Acesso completo ao sistema
    if (userType === 'student') {
      return [
        { name: 'Instrutores', icon: Users, page: 'Instructors' },
        { name: 'Minhas Aulas', icon: Calendar, page: 'MyLessons' },
        { name: 'Conversas', icon: MessageSquare, page: 'Chat' },
        { name: 'Meus Pagamentos', icon: DollarSign, page: 'StudentPayments' },
        { name: 'Consultores', icon: UserCog, page: 'StudentSellers' },
        { name: 'Meu Perfil', icon: GraduationCap, page: 'StudentProfile' },
      ];
    }

    // Novos usuários sem cadastro - menu básico
    if (userType === 'new_user') {
      return [
        { name: 'Página Inicial', icon: Home, page: 'Landing' },
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
        const key = `seller_session_version:${user.email}`;
        const stored = localStorage.getItem(key);
        
        // Se não tem versão de sessão salva, salva a atual e não faz nada
        if (!stored) {
          const sellers = await base44.entities.Seller.filter({ email: user.email });
          if (sellers.length > 0) {
            localStorage.setItem(key, String(sellers[0].session_version || 1));
          }
          return;
        }
        
        const sellers = await base44.entities.Seller.filter({ email: user.email });
        if (sellers.length === 0) return;
        const s = sellers[0];
        const current = String(s.session_version || 1);
        
        // Só força logout se a versão mudou (senha alterada)
        if (stored !== current) {
          localStorage.removeItem(key);
          base44.auth.logout(createPageUrl('SellerLogin'));
        }
      } catch (e) {
        console.error('Erro enforceSellerSession:', e);
      }
    };
    
    // Evitar loop - só executar se já temos userType definido
    if (userType) {
      enforceSellerSession();
    }
  }, [userType, user]);

  // Enforce instructor password session; logout if version mismatch
  useEffect(() => {
    const enforceInstructorSession = async () => {
      try {
        if (userType !== 'instructor' || !user) return;
        const instructors = await base44.entities.Instructor.filter({ user_email: user.email });
        if (instructors.length === 0) return;
        const instr = instructors[0];
        const key = `instructor_session_version:${user.email}`;
        const stored = localStorage.getItem(key);
        const current = String(instr.session_version || 1);
        if (stored !== current) {
          base44.auth.logout();
          setTimeout(() => {
            navigate(createPageUrl('InstructorLogin'));
          }, 200);
        }
      } catch (e) {
        console.log(e);
      }
    };
    enforceInstructorSession();
  }, [userType, user]);

  // Redirect students away from admin pages
  useEffect(() => {
    const adminPages = ['AdminDashboard','AdminStudents','AdminInstructors','AdminLessons','AdminChats','AdminPayments','AdminSellers','AdminSettings'];
    if (user && userType === 'student' && adminPages.includes(currentPageName)) {
      navigate(createPageUrl('Home'));
    }
  }, [userType, user, currentPageName]);

  // Block instructors from payments page
  useEffect(() => {
    if (userType === 'instructor' && currentPageName === 'AdminPayments') {
      navigate(createPageUrl('AdminDashboard'));
    }
  }, [userType, currentPageName]);

  // Redirect new users without Student record to registration
  useEffect(() => {
    const publicPages = ['AdminLogin', 'SuperAdminLogin', 'SellerLogin', 'InstructorLogin', 'StudentRegister', 'InstructorRegister', 'InstructorRegisterNew'];
    if (userType === 'new_user' && !publicPages.includes(currentPageName)) {
      navigate(createPageUrl('StudentRegister'));
    }
  }, [userType, currentPageName, navigate]);

   // Páginas públicas sem menu lateral (Landing, Login pages, Chat público)
   const publicPages = ['Landing', 'AdminLogin', 'SuperAdminLogin', 'SellerLogin', 'InstructorLogin', 'StudentRegister', 'InstructorRegister', 'InstructorRegisterNew'];
  const isPublicPage = publicPages.includes(currentPageName);
  
  // Se não está logado
  if (!user) {
    return (
      <div className="min-h-screen bg-black/60 text-white font-mono backdrop-blur-sm">
        {children}
      </div>
    );
  }

  // Se está em página pública, mostrar top bar mas sem sidebar
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-black/60 text-white font-mono backdrop-blur-sm">
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

        /* Force light text adjustments: keep placeholders/caret, allow component colors */
        ::placeholder, input::placeholder, textarea::placeholder {
          color: #dbeafe !important; opacity: 1 !important;
        }
        input, textarea, select, [contenteditable="true"] {
          color: var(--text-primary, #e6edf3) !important; caret-color: #f0c41b !important;
        }
        .disabled, [disabled] { color: var(--text-primary, #e6edf3) !important; opacity: 0.7; }

        /* Translucent surfaces */
        .bg-\[\#1a2332\], .bg-\[\#111827\], .bg-\[\#161b22\], .bg-\[\#0d1117\] {
          background-color: rgba(0, 0, 0, 0.38) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        `}</style>

        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-black/40 border-b border-[#30363d] z-40 flex items-center justify-between px-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
          </div>

          <div className="flex items-center gap-2">
            {userType !== 'student' && (
              <div className="flex items-center gap-1.5">
                <Link to={createPageUrl('Landing')}>
                  <button className="text-[10px] sm:text-xs text-black bg-[#fbbf24] hover:bg-[#fcd34d] border-2 border-[#fbbf24] px-3 py-2 rounded-lg transition-all font-bold min-h-[44px] min-w-[60px] active:scale-95">
                    INÍCIO
                  </button>
                </Link>
                <Link to={createPageUrl('AdminLogin')}>
                  <button className="text-[10px] sm:text-xs text-black bg-[#fbbf24] hover:bg-[#fcd34d] border-2 border-[#fbbf24] px-3 py-2 rounded-lg transition-all font-bold min-h-[44px] min-w-[60px] active:scale-95">
                    ADMIN
                  </button>
                </Link>
                <Link to={createPageUrl('SellerLogin')}>
                  <button className="text-[10px] sm:text-xs text-black bg-[#fbbf24] hover:bg-[#fcd34d] border-2 border-[#fbbf24] px-3 py-2 rounded-lg transition-all font-bold min-h-[44px] min-w-[80px] active:scale-95">
                    CONSULTORES
                  </button>
                </Link>
                <Link to={createPageUrl('InstructorRegisterNew')}>
                  <button className="text-[10px] sm:text-xs text-black bg-[#fbbf24] hover:bg-[#fcd34d] border-2 border-[#fbbf24] px-3 py-2 rounded-lg transition-all font-bold min-h-[44px] min-w-[80px] active:scale-95">
                    INSTRUTORES
                  </button>
                </Link>
                <Link to={createPageUrl('SuperAdminLogin')}>
                  <button className="text-[10px] sm:text-xs text-black bg-[#fbbf24] hover:bg-[#fcd34d] border-2 border-[#fbbf24] px-3 py-2 rounded-lg transition-all font-bold min-h-[44px] min-w-[60px] active:scale-95">
                    SUPER
                  </button>
                </Link>
              </div>
            )}

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

  // Se está logado mas ainda carregando o tipo de usuário, mostrar interface básica
  if (!userType && user.role === 'user') {
    return (
      <div className="min-h-screen bg-black/60 text-white font-mono backdrop-blur-sm">
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        `}</style>
        <div className="fixed top-0 left-0 right-0 h-14 bg-black/40 border-b border-[#30363d] z-40 flex items-center justify-between px-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Car className="text-[#f0c41b]" size={24} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#e6edf3] hidden md:block font-medium truncate max-w-[120px]">{user?.full_name || user?.email}</span>
            <button onClick={handleLogout} className="p-2 hover:bg-[#1a2332] rounded text-[#ef4444] hover:text-[#ff5555] transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <main className="pt-14 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse text-[#fbbf24] text-xl mb-4">Carregando seu perfil...</div>
            <p className="text-[#9ca3af] text-sm">Aguarde enquanto carregamos suas informações</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/60 text-white font-mono backdrop-blur-sm">
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

        /* Force light text adjustments: keep placeholders/caret, allow component colors */
        ::placeholder, input::placeholder, textarea::placeholder {
          color: #dbeafe !important; opacity: 1 !important;
        }
        input, textarea, select, [contenteditable="true"] {
          color: var(--text-primary, #e6edf3) !important; caret-color: #f0c41b !important;
        }
        .disabled, [disabled] { color: var(--text-primary, #e6edf3) !important; opacity: 0.7; }

        /* Translucent surfaces */
        .bg-\[\#1a2332\], .bg-\[\#111827\], .bg-\[\#161b22\], .bg-\[\#0d1117\] {
          background-color: rgba(0, 0, 0, 0.38) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        `}</style>

        {/* Scan Line Effect */}
      <div className="scan-line fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0969da] to-transparent opacity-10 pointer-events-none z-50" />
      
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-black/40 border-b border-[#30363d] z-40 flex items-center justify-between px-3 backdrop-blur-md">
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
          {userType !== 'student' && (
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
              <Link to={createPageUrl('SellerLogin')}>
                <button className="text-[10px] sm:text-xs text-[#cbd5e1] hover:text-[#34d399] px-2.5 py-1.5 rounded transition-colors font-semibold">
                  CONSULTORES
                </button>
              </Link>
              <span className="text-[#cbd5e1] text-xs">|</span>
              <Link to={createPageUrl('InstructorRegisterNew')}>
                <button className="text-[10px] sm:text-xs text-[#cbd5e1] hover:text-[#a78bfa] px-2.5 py-1.5 rounded transition-colors font-semibold">
                  INSTRUTORES
                </button>
              </Link>
              <span className="text-[#cbd5e1] text-xs">|</span>
              <Link to={createPageUrl('SuperAdminLogin')}>
                <button className="text-[10px] sm:text-xs text-[#cbd5e1] hover:text-[#f0c41b] px-2.5 py-1.5 rounded transition-colors font-semibold">
                  SUPER
                </button>
              </Link>
            </div>
          )}

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
      <aside className={`fixed top-14 left-0 h-[calc(100vh-56px)] bg-black/30 backdrop-blur-md border-r border-[#30363d] z-30 transform transition-all duration-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 backdrop-blur-sm bg-opacity-95 overflow-y-auto ${isSidebarMinimized ? 'w-20' : 'w-64'}`}>
        <div className="flex justify-end p-2 lg:hidden">
          <button
            onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
            className="p-1 hover:bg-[#1a2332] rounded text-[#fbbf24]"
            title={isSidebarMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isSidebarMinimized ? '→' : '←'}
          </button>
        </div>
        <nav className="p-3 space-y-1 pb-32">
          {menuItems.map((item, idx) => {
            // Separador visual
            if (item.name === '---') {
              return (
                <div key={`separator-${idx}`} className="my-2 border-t border-[#374151]" />
              );
            }
            
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            
            // Se for ação especial (selectInstructor, selectSeller ou selectStudent)
            if (item.action && userType === 'superadmin') {
              return (
                <button
                  key={`action-${idx}`}
                  onClick={() => {
                    setIsSidebarOpen(false);
                    if (item.action === 'selectInstructor') {
                      setPendingInstructorPage('AdminDashboard');
                      setShowInstructorSelectorModal(true);
                    } else if (item.action === 'selectSeller') {
                      setPendingSellerPage('AdminDashboard');
                      setShowSellerSelectorModal(true);
                    } else if (item.action === 'selectStudent') {
                      setPendingStudentPage('Home');
                      setShowStudentSelectorModal(true);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer hover:bg-[#374151] text-[#fbbf24] hover:text-white ${isSidebarMinimized ? 'justify-center' : ''}`}
                  title={isSidebarMinimized ? item.name : ''}
                >
                  <Icon size={20} />
                  {!isSidebarMinimized && <span className="text-sm font-medium">{item.name}</span>}
                </button>
              );
            }
            
            // Se for página com viewAs e usuário é superadmin, interceptar clique
            if (item.viewAs && userType === 'superadmin') {
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    setIsSidebarOpen(false);
                    if (item.viewAs === 'student') {
                      handleStudentPageClick(item.page);
                    } else if (item.viewAs === 'instructor') {
                      setPendingInstructorPage(item.page);
                      setShowInstructorSelectorModal(true);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#0969da] to-[#0550ae] text-white shadow-md' 
                      : 'hover:bg-[#161b22] text-[#cbd5e1] hover:text-white'
                  } ${isSidebarMinimized ? 'justify-center' : ''}`}
                  title={isSidebarMinimized ? item.name : ''}
                >
                  <Icon size={20} className={isActive ? 'text-[#f0c41b]' : ''} />
                  {!isSidebarMinimized && <span className="text-sm font-medium">{item.name}</span>}
                </button>
              );
            }
            
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#0969da] to-[#0550ae] text-white shadow-md' 
                    : 'hover:bg-[#161b22] text-[#cbd5e1] hover:text-white'
                } ${isSidebarMinimized ? 'justify-center' : ''}`}
                title={isSidebarMinimized ? item.name : ''}
              >
                <Icon size={20} className={isActive ? 'text-[#f0c41b]' : ''} />
                {!isSidebarMinimized && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
          
          {/* Generate Codes Buttons (SuperAdmin) */}
          {userType === 'superadmin' && (
            <>
              <div className="my-3 border-t border-[#374151]" />
              <div className="p-3 bg-[#161b22] rounded-lg border border-[#30363d] terminal-glow space-y-2">
                <button
                  onClick={() => setShowGenerateCodeModal(true)}
                  className="w-full px-3 py-2 bg-[#0969da] hover:bg-[#0550ae] rounded text-xs font-semibold text-white transition-colors"
                >
                  Gerar Código Instrutor
                </button>
                <button
                  onClick={() => setShowGenerateSellerCodeModal(true)}
                  className="w-full px-3 py-2 bg-[#34d399] hover:bg-[#10b981] rounded text-xs font-semibold text-black transition-colors"
                >
                  Gerar Código Consultor
                </button>
              </div>
            </>
          )}
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
      <main className={`pt-14 min-h-screen transition-all duration-200 ${isSidebarMinimized ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="p-4 md:p-6">
          {location.pathname !== createPageUrl('Home') && location.pathname !== '/' && (
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center gap-2 px-4 py-2 bg-[#1a2332] border border-[#374151] rounded-lg hover:bg-[#161b22] transition-colors text-white"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          )}
          
          {/* Indicador de visualização como instrutor */}
          {userType === 'superadmin' && selectedInstructorForView && (
            <div className="mb-4 p-3 bg-[#a78bfa]/10 border border-[#a78bfa] rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-[#a78bfa] font-semibold">Visualizando como Instrutor:</p>
                <p className="text-white font-bold">{selectedInstructorForView.full_name}</p>
                <p className="text-xs text-[#9ca3af]">CPF: {selectedInstructorForView.cpf}</p>
              </div>
              <button
                onClick={clearInstructorView}
                className="px-3 py-1 bg-[#ef4444] hover:bg-[#dc2626] rounded text-white text-xs font-semibold"
              >
                Limpar
              </button>
            </div>
          )}
          
          {/* Indicador de visualização como colaborador */}
          {userType === 'superadmin' && selectedSellerForView && (
            <div className="mb-4 p-3 bg-[#34d399]/10 border border-[#34d399] rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-[#34d399] font-semibold">Visualizando como Colaborador:</p>
                <p className="text-white font-bold">{selectedSellerForView.full_name}</p>
                <p className="text-xs text-[#9ca3af]">Email: {selectedSellerForView.email}</p>
              </div>
              <button
                onClick={clearSellerView}
                className="px-3 py-1 bg-[#ef4444] hover:bg-[#dc2626] rounded text-white text-xs font-semibold"
              >
                Limpar
              </button>
            </div>
          )}
          
          {/* Indicador de visualização como aluno */}
          {userType === 'superadmin' && selectedStudentForView && (
            <div className="mb-4 p-3 bg-[#10b981]/10 border border-[#10b981] rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-[#10b981] font-semibold">Visualizando como Aluno:</p>
                <p className="text-white font-bold">{selectedStudentForView.full_name}</p>
                <p className="text-xs text-[#9ca3af]">RENACH: {selectedStudentForView.renach}</p>
              </div>
              <button
                onClick={clearStudentView}
                className="px-3 py-1 bg-[#ef4444] hover:bg-[#dc2626] rounded text-white text-xs font-semibold"
              >
                Limpar
              </button>
            </div>
          )}
          
          {children}
        </div>
      </main>

      {/* Seller Selector Modal */}
      {showSellerSelectorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2332] border-2 border-[#34d399] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="border-b border-[#374151] p-4 bg-gradient-to-r from-[#34d399] to-[#10b981]">
              <h2 className="text-lg font-bold text-white">Selecione um Colaborador para Visualizar</h2>
              <p className="text-sm text-white/80 mt-1">Escolha qual colaborador você deseja visualizar na página de {pendingSellerPage}</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedSellerForView && (
                <div className="mb-4 p-3 bg-[#34d399]/10 border border-[#34d399] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#34d399] font-semibold">Visualizando atualmente como:</p>
                      <p className="text-white font-bold">{selectedSellerForView.full_name}</p>
                      <p className="text-xs text-[#9ca3af]">Email: {selectedSellerForView.email}</p>
                    </div>
                    <button
                      onClick={clearSellerView}
                      className="px-3 py-1 bg-[#ef4444] hover:bg-[#dc2626] rounded text-white text-xs font-semibold"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {allSellers.length === 0 ? (
                  <p className="text-[#9ca3af] text-center py-8">Nenhum colaborador cadastrado ainda.</p>
                ) : (
                  allSellers.map((seller) => (
                    <button
                      key={seller.id}
                      onClick={() => selectSellerAndNavigate(seller)}
                      className="w-full p-4 bg-[#111827] border border-[#374151] rounded-lg hover:border-[#34d399] hover:bg-[#1a2332] transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-white">{seller.full_name}</p>
                          <p className="text-sm text-[#9ca3af]">{seller.email}</p>
                          <p className="text-xs text-[#9ca3af] mt-1">Telefone: {seller.phone || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-semibold ${seller.active ? 'text-green-400' : 'text-red-400'}`}>
                            {seller.active ? 'Ativo' : 'Inativo'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="border-t border-[#374151] p-4 bg-[#111827]">
              <button
                onClick={() => {
                  setShowSellerSelectorModal(false);
                  setPendingSellerPage(null);
                }}
                className="w-full px-4 py-2 border border-[#374151] rounded text-white font-semibold text-sm hover:bg-[#161b22] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructor Selector Modal */}
      {showInstructorSelectorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2332] border-2 border-[#a78bfa] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="border-b border-[#374151] p-4 bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6]">
              <h2 className="text-lg font-bold text-white">Selecione um Instrutor para Visualizar</h2>
              <p className="text-sm text-white/80 mt-1">Escolha qual instrutor você deseja visualizar na página de {pendingInstructorPage}</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedInstructorForView && (
                <div className="mb-4 p-3 bg-[#a78bfa]/10 border border-[#a78bfa] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#a78bfa] font-semibold">Visualizando atualmente como:</p>
                      <p className="text-white font-bold">{selectedInstructorForView.full_name}</p>
                      <p className="text-xs text-[#9ca3af]">CPF: {selectedInstructorForView.cpf}</p>
                    </div>
                    <button
                      onClick={clearInstructorView}
                      className="px-3 py-1 bg-[#ef4444] hover:bg-[#dc2626] rounded text-white text-xs font-semibold"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {allInstructors.length === 0 ? (
                  <p className="text-[#9ca3af] text-center py-8">Nenhum instrutor cadastrado ainda.</p>
                ) : (
                  allInstructors.map((instructor) => (
                    <button
                      key={instructor.id}
                      onClick={() => selectInstructorAndNavigate(instructor)}
                      className="w-full p-4 bg-[#111827] border border-[#374151] rounded-lg hover:border-[#a78bfa] hover:bg-[#1a2332] transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-white">{instructor.full_name}</p>
                          <p className="text-sm text-[#9ca3af]">CPF: {instructor.cpf}</p>
                          <div className="flex gap-2 mt-1">
                            {instructor.teaches_car && <span className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-0.5 rounded">Carro</span>}
                            {instructor.teaches_moto && <span className="text-xs bg-[#fbbf24]/20 text-[#fbbf24] px-2 py-0.5 rounded">Moto</span>}
                            {instructor.teaches_bus && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Ônibus</span>}
                            {instructor.teaches_truck && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Caminhão</span>}
                            {instructor.teaches_trailer && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Carreta</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-semibold ${instructor.active ? 'text-green-400' : 'text-red-400'}`}>
                            {instructor.active ? 'Ativo' : 'Inativo'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="border-t border-[#374151] p-4 bg-[#111827]">
              <button
                onClick={() => {
                  setShowInstructorSelectorModal(false);
                  setPendingInstructorPage(null);
                }}
                className="w-full px-4 py-2 border border-[#374151] rounded text-white font-semibold text-sm hover:bg-[#161b22] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Selector Modal */}
      {showStudentSelectorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2332] border-2 border-[#fbbf24] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="border-b border-[#374151] p-4 bg-gradient-to-r from-[#0969da] to-[#0550ae]">
              <h2 className="text-lg font-bold text-white">Selecione um Aluno para Visualizar</h2>
              <p className="text-sm text-[#cbd5e1] mt-1">Escolha qual aluno você deseja visualizar na página de {pendingStudentPage}</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedStudentForView && (
                <div className="mb-4 p-3 bg-[#10b981]/10 border border-[#10b981] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#10b981] font-semibold">Visualizando atualmente como:</p>
                      <p className="text-white font-bold">{selectedStudentForView.full_name}</p>
                      <p className="text-xs text-[#9ca3af]">RENACH: {selectedStudentForView.renach}</p>
                    </div>
                    <button
                      onClick={clearStudentView}
                      className="px-3 py-1 bg-[#ef4444] hover:bg-[#dc2626] rounded text-white text-xs font-semibold"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {allStudents.length === 0 ? (
                  <p className="text-[#9ca3af] text-center py-8">Nenhum aluno cadastrado ainda.</p>
                ) : (
                  allStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => selectStudentAndNavigate(student)}
                      className="w-full p-4 bg-[#111827] border border-[#374151] rounded-lg hover:border-[#3b82f6] hover:bg-[#1a2332] transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-white">{student.full_name}</p>
                          <p className="text-sm text-[#9ca3af]">RENACH: {student.renach}</p>
                          <p className="text-xs text-[#9ca3af]">Categoria: {student.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#9ca3af]">CPF</div>
                          <div className="text-sm text-white font-mono">{student.cpf}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="border-t border-[#374151] p-4 bg-[#111827]">
              <button
                onClick={() => {
                  setShowStudentSelectorModal(false);
                  setPendingStudentPage(null);
                }}
                className="w-full px-4 py-2 border border-[#374151] rounded text-white font-semibold text-sm hover:bg-[#161b22] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Instructor Code Modal */}
      {showGenerateCodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2332] border-2 border-[#fbbf24] rounded-xl w-full max-w-md">
            <div className="border-b border-[#374151] p-4 bg-gradient-to-r from-[#0969da] to-[#0550ae]">
              <h2 className="text-lg font-bold text-white">Gerar Código de Instrutor</h2>
            </div>
            <div className="p-6 space-y-4">
              {generatedCode ? (
                <>
                  <div className="text-center">
                    <p className="text-[#9ca3af] text-sm mb-3">Código gerado com sucesso!</p>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                      <p className="text-3xl font-bold text-[#fbbf24] tracking-widest">{generatedCode}</p>
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-3">Válido por 30 dias. Já foi copiado!</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedCode)}
                    className="w-full px-4 py-2 bg-[#0969da] hover:bg-[#0550ae] rounded text-white font-semibold text-sm transition-colors"
                  >
                    Copiar Novamente
                  </button>
                  <button
                    onClick={() => { setGeneratedCode(''); setShowGenerateCodeModal(false); }}
                    className="w-full px-4 py-2 border border-[#374151] rounded text-white font-semibold text-sm hover:bg-[#161b22] transition-colors"
                  >
                    Fechar
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[#9ca3af] text-sm">Gere um código único para que um novo instrutor se registre no sistema.</p>
                  <button
                    onClick={generateInstructorCode}
                    disabled={codeLoading}
                    className="w-full px-4 py-3 bg-[#f0c41b] hover:bg-[#d4aa00] rounded text-black font-bold transition-colors disabled:opacity-50"
                  >
                    {codeLoading ? 'Gerando...' : 'Gerar Código'}
                  </button>
                  <button
                    onClick={() => setShowGenerateCodeModal(false)}
                    className="w-full px-4 py-2 border border-[#374151] rounded text-white font-semibold text-sm hover:bg-[#161b22] transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Seller Code Modal */}
      {showGenerateSellerCodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2332] border-2 border-[#34d399] rounded-xl w-full max-w-md">
            <div className="border-b border-[#374151] p-4 bg-gradient-to-r from-[#34d399] to-[#10b981]">
              <h2 className="text-lg font-bold text-white">Gerar Código de Colaborador</h2>
            </div>
            <div className="p-6 space-y-4">
              {generatedSellerCode ? (
                <>
                  <div className="text-center">
                    <p className="text-[#9ca3af] text-sm mb-3">Código gerado com sucesso!</p>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                      <p className="text-3xl font-bold text-[#34d399] tracking-widest">{generatedSellerCode}</p>
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-3">Válido por 30 dias. Já foi copiado!</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedSellerCode)}
                    className="w-full px-4 py-2 bg-[#34d399] hover:bg-[#10b981] rounded text-black font-semibold text-sm transition-colors"
                  >
                    Copiar Novamente
                  </button>
                  <button
                    onClick={() => { setGeneratedSellerCode(''); setShowGenerateSellerCodeModal(false); }}
                    className="w-full px-4 py-2 border border-[#374151] rounded text-white font-semibold text-sm hover:bg-[#161b22] transition-colors"
                  >
                    Fechar
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[#9ca3af] text-sm">Gere um código único para que um novo colaborador se registre no sistema.</p>
                  <button
                    onClick={generateSellerCode}
                    disabled={sellerCodeLoading}
                    className="w-full px-4 py-3 bg-[#34d399] hover:bg-[#10b981] rounded text-black font-bold transition-colors disabled:opacity-50"
                  >
                    {sellerCodeLoading ? 'Gerando...' : 'Gerar Código'}
                  </button>
                  <button
                    onClick={() => setShowGenerateSellerCodeModal(false)}
                    className="w-full px-4 py-2 border border-[#374151] rounded text-white font-semibold text-sm hover:bg-[#161b22] transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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