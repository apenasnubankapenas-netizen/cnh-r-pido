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

  useEffect(() => {
    // Redirecionar automaticamente usuários logados
    if (user && userType && userType !== 'new_user') {
      navigate(getRedirectUrl());
    }
    // Novos usuários vão para o cadastro
    if (user && userType === 'new_user') {
      navigate(createPageUrl('StudentRegister'));
    }
  }, [user, userType, navigate]);

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
      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 pb-12 sm:pb-16">
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-white">
            Escolha sua <span className="text-[#fbbf24]">Categoria</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98]">
              <CardContent className="p-4 sm:p-5 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#f0c41b]/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Bike className="text-[#f0c41b]" size={24} />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base">Categoria A</h3>
                <p className="text-[#9ca3af] text-xs sm:text-sm">Moto</p>

                </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98]">
                <CardContent className="p-4 sm:p-5 text-center">
                 <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                   <Car className="text-[#3b82f6]" size={24} />
                 </div>
                 <h3 className="font-bold text-white text-sm sm:text-base">Categoria B</h3>
                 <p className="text-[#9ca3af] text-xs sm:text-sm">Carro</p>

                </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98] col-span-2 sm:col-span-1">
                <CardContent className="p-4 sm:p-5 text-center">
                 <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                   <div className="flex gap-1">
                     <Car className="text-[#3b82f6]" size={20} />
                     <Bike className="text-[#f0c41b]" size={20} />
                   </div>
                 </div>
                 <h3 className="font-bold text-white text-sm sm:text-base">Categoria AB</h3>
                 <p className="text-[#9ca3af] text-xs sm:text-sm">Carro + Moto</p>

                </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98]">
                <CardContent className="p-4 sm:p-5 text-center">
                 <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                   <Bus className="text-[#3b82f6]" size={24} />
                 </div>
                 <h3 className="font-bold text-white text-sm sm:text-base">Ônibus</h3>
                 <p className="text-[#9ca3af] text-xs sm:text-sm">Categoria D</p>

                </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98]">
                <CardContent className="p-4 sm:p-5 text-center">
                 <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                   <Truck className="text-[#3b82f6]" size={24} />
                 </div>
                 <h3 className="font-bold text-white text-sm sm:text-base">Carreta</h3>
                 <p className="text-[#9ca3af] text-xs sm:text-sm">Categoria E</p>

              </CardContent>
            </Card>
          </div>
        </div>

        {/* Vantagens */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-white px-4">
            Por que escolher a <span className="text-[#fbbf24]">CNH PARA TODOS?</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 active:scale-[0.98] transition-transform">
              <CardContent className="p-4 sm:p-6">
                <CheckCircle className="text-[#3b82f6] mb-3 sm:mb-4" size={32} />
                <h3 className="font-bold mb-2 text-base sm:text-lg text-white">Conforto e Comodidade</h3>
                <p className="text-[#cbd5e1] text-sm sm:text-base">
                  Agendamento 100% online: Marque suas aulas quando e onde quiser, sem burocracia e sem filas.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10 active:scale-[0.98] transition-transform">
              <CardContent className="p-4 sm:p-6">
                <CheckCircle className="text-[#3b82f6] mb-3 sm:mb-4" size={32} />
                <h3 className="font-bold mb-2 text-base sm:text-lg text-white">Flexibilidade Financeira</h3>
                <p className="text-[#cbd5e1] text-sm sm:text-base">
                  Pagamento facilitado: Parcelamos em até 10 vezes sem juros, tornando o investimento na sua habilitação muito mais acessível.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10 active:scale-[0.98] transition-transform">
              <CardContent className="p-4 sm:p-6">
                <CheckCircle className="text-[#3b82f6] mb-3 sm:mb-4" size={32} />
                <h3 className="font-bold mb-2 text-base sm:text-lg text-white">Segurança e Suporte</h3>
                <p className="text-[#cbd5e1] text-sm sm:text-base">
                  Notificações e lembretes automáticos: Nunca mais perca uma aula! Receba alertas por e-mail e WhatsApp com antecedência.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10 active:scale-[0.98] transition-transform">
              <CardContent className="p-4 sm:p-6">
                <CheckCircle className="text-[#3b82f6] mb-3 sm:mb-4" size={32} />
                <h3 className="font-bold mb-2 text-base sm:text-lg text-white">Instrutores Qualificados</h3>
                <p className="text-[#cbd5e1] text-sm sm:text-base">
                  Equipe experiente e preparada: Nossos instrutores são altamente qualificados, garantindo uma aprendizagem segura e eficiente.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10 active:scale-[0.98] transition-transform">
              <CardContent className="p-4 sm:p-6">
                <CheckCircle className="text-[#3b82f6] mb-3 sm:mb-4" size={32} />
                <h3 className="font-bold mb-2 text-base sm:text-lg text-white">Transparência e Controle</h3>
                <p className="text-[#cbd5e1] text-sm sm:text-base">
                  Acesso total ao progresso: Veja seu histórico de aulas, localizações e horários, tudo de forma clara e organizada.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10 active:scale-[0.98] transition-transform">
              <CardContent className="p-4 sm:p-6">
                <CheckCircle className="text-[#3b82f6] mb-3 sm:mb-4" size={32} />
                <h3 className="font-bold mb-2 text-base sm:text-lg text-white">Reagendamento Simplificado</h3>
                <p className="text-[#cbd5e1] text-sm sm:text-base">
                  Flexibilidade em caso de imprevistos: Se houver algum conflito, você pode reagendar suas aulas sem complicação, com total comodidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* CTA Final */}
        <div className="text-center max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] border-none">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Pronto para começar sua jornada?
              </h2>
              <p className="text-base sm:text-lg mb-5 sm:mb-6 opacity-90">
                Cadastre-se agora e dê o primeiro passo rumo à sua habilitação
              </p>
              {user ? (
                <Link to={createPageUrl('StudentRegister')}>
                  <Button className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-bold min-h-[56px] active:scale-[0.98]">
                    Fazer Meu Cadastro
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-bold min-h-[56px] active:scale-[0.98]"
                  onClick={() => {
                    base44.auth.redirectToLogin(createPageUrl('StudentRegister'));
                  }}
                >
                  Cadastrar Agora
                  <ArrowRight className="ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}