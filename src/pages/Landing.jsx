import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Car, 
  Bike, 
  Users, 
  BookOpen, 
  CreditCard,
  ArrowRight,
  CheckCircle,
  Bus,
  Truck,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [hasRegistration, setHasRegistration] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Sem redirecionamento automático — o botão faz o redirecionamento

  const loadData = async () => {
    setLoading(false); // Mostra botões imediatamente
    
    try {
      const settingsData = await base44.entities.AppSettings.list();
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
    } catch (e) {
      console.log(e);
    }

    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (!currentUser) return;
      
      // SuperAdmin
      if (currentUser.role === 'admin' && currentUser.email === 'tcnhpara@gmail.com') {
        setHasRegistration(true);
        setUserType('superadmin');
        return;
      }
      
      const [students, instructors, sellers] = await Promise.all([
        base44.entities.Student.filter({ user_email: currentUser.email }),
        base44.entities.Instructor.filter({ user_email: currentUser.email }),
        base44.entities.Seller.filter({ email: currentUser.email })
      ]);
      
      // Instrutor
      if (instructors.length > 0 && instructors[0].active) {
        setHasRegistration(true);
        setUserType('instructor');
        return;
      }
      
      // Consultor
      if (sellers.length > 0 && sellers[0].active) {
        setHasRegistration(true);
        setUserType('seller');
        return;
      }
      
      // Aluno
      if (students.length > 0) {
        setHasRegistration(true);
        setUserType('student');
        return;
      }
      
      // Admin genérico
      if (currentUser.role === 'admin') {
        setHasRegistration(true);
        setUserType('admin');
        return;
      }
      
      // Se é user mas não tem cadastro, definir como 'new_user' para redirecionar ao registro
      if (currentUser.role === 'user') {
        setHasRegistration(false);
        setUserType('new_user');
        return;
      }
    } catch (e) {
      // Usuário não logado - ok, botões já aparecem
    }
  };

  const getRedirectUrl = () => {
    if (userType === 'student') return createPageUrl('Home');
    if (userType === 'instructor') return createPageUrl('AdminDashboard');
    if (userType === 'seller') return createPageUrl('AdminDashboard');
    if (userType === 'admin' || userType === 'superadmin') return createPageUrl('AdminDashboard');
    // Novos usuários vão direto para o registro
    return createPageUrl('StudentRegister');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{background:'#050508'}}>
      {/* Car background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80"
          alt=""
          className="w-full h-full object-cover"
          style={{opacity:0.22}}
        />
        <div className="absolute inset-0" style={{background:'linear-gradient(180deg, rgba(5,5,10,0.55) 0%, rgba(5,5,10,0.80) 60%, rgba(5,5,10,0.98) 100%)'}} />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-4 lg:px-8">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-8 sm:mb-12">
            {/* Logo Icon - Brutalismo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div style={{border:'4px solid #f0c41b', boxShadow:'8px 8px 0px #f0c41b', background:'rgba(5,5,10,0.75)', backdropFilter:'blur(20px)', padding:'20px 24px'}}>
                  <Car className="h-14 w-14 text-[#f0c41b]" />
                </div>
              </div>
            </div>
            
            {/* Title - Bebas Neue Brutalista */}
            <h1 style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:'0.08em'}} className="text-6xl sm:text-7xl md:text-9xl lg:text-[10rem] mb-4 sm:mb-6 px-2 text-white leading-none">
              CNH{' '}
              <span style={{color:'#f0c41b', textShadow:'4px 4px 0px rgba(240,196,27,0.3)'}}>
                PARA
              </span>
              {' '}TODOS
            </h1>
            
            {/* Subtitle - glass pill */}
            <div className="inline-block mb-3 sm:mb-4 px-5 py-2 mx-4" style={{background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', border:'2px solid rgba(255,255,255,0.12)'}}>
              <p className="text-base sm:text-lg md:text-xl text-white font-semibold tracking-wide">
                O futuro da sua habilitação está aqui
              </p>
            </div>
            <p className="text-sm sm:text-base text-[#94a3b8] mb-8 sm:mb-12 max-w-xl mx-auto px-4">
              Plataforma completa para gestão, acompanhamento e conquista da sua CNH com tecnologia de ponta
            </p>
          </div>

          {/* Botão de Acesso - Brutalismo */}
          <div className="max-w-lg mx-auto mb-12 sm:mb-16 px-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-[#fbbf24] text-lg sm:text-xl">Carregando...</div>
              </div>
            ) : (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (user && userType && userType !== 'new_user') {
                    navigate(getRedirectUrl());
                  } else {
                    base44.auth.redirectToLogin(createPageUrl('Landing'));
                  }
                }}
                className="w-full text-black transition-all duration-150 active:scale-95 touch-manipulation"
                style={{background:'#f0c41b', border:'4px solid #000', boxShadow:'8px 8px 0px #000', padding:'28px 32px', minHeight:'140px'}}
                onMouseEnter={e => e.currentTarget.style.boxShadow='12px 12px 0px #000'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='8px 8px 0px #000'}
              >
                <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
                  <ArrowRight className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={3} />
                  <div className="text-center">
                    <div style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:'0.1em'}} className="text-3xl sm:text-4xl mb-1">COMEÇAR AGORA</div>
                    <div className="text-sm sm:text-base font-bold opacity-80">
                      Acesse ou cadastre-se na plataforma
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 pb-12 sm:pb-16">
        <div className="mb-12 sm:mb-16">
          <h2 style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:'0.08em'}} className="text-4xl sm:text-5xl text-center mb-6 sm:mb-8 text-white">
            Escolha sua <span style={{color:'#f0c41b'}}>Categoria</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { icon: <Bike size={26} />, label: 'Categoria A', sub: 'Moto', color: '#f0c41b' },
              { icon: <Car size={26} />, label: 'Categoria B', sub: 'Carro', color: '#3b82f6' },
              { icon: <div className="flex gap-1"><Car size={18} /><Bike size={18} /></div>, label: 'Categoria AB', sub: 'Carro + Moto', color: '#a78bfa', span: true },
              { icon: <Bus size={26} />, label: 'Ônibus', sub: 'Categoria D', color: '#34d399' },
              { icon: <Truck size={26} />, label: 'Carreta', sub: 'Categoria E', color: '#f87171' },
            ].map((cat, i) => (
              <div key={i}
                className={`p-4 sm:p-5 text-center transition-all active:scale-[0.97] cursor-default ${cat.span ? 'col-span-2 sm:col-span-1' : ''}`}
                style={{background:'rgba(255,255,255,0.05)', backdropFilter:'blur(22px) saturate(2)', border:`3px solid ${cat.color}`, boxShadow:`5px 5px 0px ${cat.color}`}}
              >
                <div className="flex items-center justify-center mb-2 sm:mb-3" style={{color: cat.color}}>
                  {cat.icon}
                </div>
                <h3 style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:'0.05em', color:'#fff'}} className="text-lg sm:text-xl">{cat.label}</h3>
                <p className="text-[#9ca3af] text-xs sm:text-sm">{cat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vantagens */}
        <div className="mb-12 sm:mb-16">
          <h2 style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:'0.08em'}} className="text-4xl sm:text-5xl text-center mb-6 sm:mb-8 text-white px-4">
            Por que escolher a <span style={{color:'#f0c41b'}}>CNH PARA TODOS?</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { title: 'Conforto e Comodidade', text: 'Agendamento 100% online: Marque suas aulas quando e onde quiser, sem burocracia e sem filas.', color: '#3b82f6' },
              { title: 'Flexibilidade Financeira', text: 'Parcelamos em até 10 vezes sem juros, tornando o investimento na sua habilitação muito mais acessível.', color: '#f0c41b' },
              { title: 'Segurança e Suporte', text: 'Notificações e lembretes automáticos: Nunca mais perca uma aula! Receba alertas por e-mail e WhatsApp.', color: '#34d399' },
              { title: 'Instrutores Qualificados', text: 'Equipe experiente: Nossos instrutores são altamente qualificados, garantindo aprendizagem segura e eficiente.', color: '#a78bfa' },
              { title: 'Transparência e Controle', text: 'Acesso total ao progresso: Veja histórico de aulas, localizações e horários de forma clara.', color: '#f87171' },
              { title: 'Reagendamento Simples', text: 'Se houver imprevistos, você pode reagendar suas aulas sem complicação, com total comodidade.', color: '#fb923c' },
            ].map((v, i) => (
              <div key={i} className="p-4 sm:p-6 transition-all active:scale-[0.98]"
                style={{background:'rgba(255,255,255,0.05)', backdropFilter:'blur(22px) saturate(2)', border:`3px solid ${v.color}`, boxShadow:`5px 5px 0px ${v.color}`}}
              >
                <CheckCircle style={{color: v.color}} className="mb-3" size={28} />
                <h3 style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:'0.05em', color: v.color}} className="text-xl sm:text-2xl mb-2">{v.title}</h3>
                <p className="text-[#cbd5e1] text-sm sm:text-base">{v.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <div className="p-6 sm:p-10"
            style={{background:'rgba(9,105,218,0.18)', backdropFilter:'blur(28px) saturate(2)', border:'4px solid #0969da', boxShadow:'8px 8px 0px #0969da'}}
          >
            <h2 style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:'0.08em'}} className="text-4xl sm:text-5xl mb-3 sm:mb-4 text-white">
              Pronto para começar sua jornada?
            </h2>
            <p className="text-base sm:text-lg mb-5 sm:mb-6 text-[#cbd5e1]">
              Cadastre-se agora e dê o primeiro passo rumo à sua habilitação
            </p>
            {user ? (
              <Link to={createPageUrl('StudentRegister')}>
                <button className="text-black font-black text-lg px-8 py-4 transition-all active:scale-[0.97]"
                  style={{background:'#f0c41b', border:'3px solid #000', boxShadow:'6px 6px 0px #000', fontFamily:"'Bebas Neue', sans-serif", letterSpacing:'0.08em', fontSize:'1.3rem'}}
                  onMouseEnter={e => e.currentTarget.style.boxShadow='10px 10px 0px #000'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow='6px 6px 0px #000'}
                >
                  FAZER MEU CADASTRO →
                </button>
              </Link>
            ) : (
              <button
                className="text-black font-black text-lg px-8 py-4 transition-all active:scale-[0.97]"
                style={{background:'#f0c41b', border:'3px solid #000', boxShadow:'6px 6px 0px #000', fontFamily:"'Bebas Neue', sans-serif", letterSpacing:'0.08em', fontSize:'1.3rem'}}
                onMouseEnter={e => e.currentTarget.style.boxShadow='10px 10px 0px #000'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='6px 6px 0px #000'}
                onClick={() => base44.auth.redirectToLogin(createPageUrl('StudentRegister'))}
              >
                CADASTRAR AGORA →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}