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
    // Redirecionar automaticamente usuários logados com registro
    if (user && hasRegistration && userType) {
      navigate(getRedirectUrl());
    }
  }, [user, hasRegistration, userType]);

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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#0f1419] to-[#1a1f2e] relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e2a3a] via-[#1e40af]/20 to-[#1a2332]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#fbbf24]/20 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#1e40af]/20 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            {/* Logo Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#fbbf24] to-[#1e40af] rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-br from-[#0d1117] to-[#1a2332] p-6 rounded-2xl border border-[#374151]">
                  <Car className="h-16 w-16 text-[#fbbf24]" />
                </div>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white via-[#fbbf24] to-white bg-clip-text text-transparent animate-color-shift">
                CNH PARA TODOS
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-[#cbd5e1] mb-4 max-w-2xl mx-auto font-medium">
              O futuro da sua habilitação está aqui
            </p>
            <p className="text-base text-[#94a3b8] mb-12 max-w-xl mx-auto">
              Plataforma completa para gestão, acompanhamento e conquista da sua CNH com tecnologia de ponta
            </p>
          </div>

          {/* Botão de Acesso */}
          <div className="max-w-lg mx-auto mb-16">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-[#fbbf24] text-xl">Carregando...</div>
              </div>
            ) : (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  base44.auth.redirectToLogin(createPageUrl('Landing'));
                }}
                className="group relative w-full bg-gradient-to-r from-[#fbbf24] to-[#fcd34d] hover:from-[#fcd34d] hover:to-[#fbbf24] text-black p-8 rounded-2xl shadow-2xl hover:shadow-[#fbbf24]/50 transition-all duration-300 active:scale-95 border-2 border-[#fbbf24]/50 min-h-[160px] touch-manipulation"
              >
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="bg-black/10 p-4 rounded-xl">
                    <ArrowRight className="h-10 w-10" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black mb-2">COMEÇAR AGORA</div>
                    <div className="text-base font-semibold opacity-90">
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
      <div className="relative max-w-6xl mx-auto px-4 pb-16">
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8 text-white">
            Escolha sua <span className="text-[#fbbf24]">Categoria</span>
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            <Card className="bg-[#1a2332] border-[#374151] hover:border-[#f0c41b] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#f0c41b]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bike className="text-[#f0c41b]" size={32} />
                </div>
                <h3 className="font-bold mb-2 text-white text-lg">Categoria A</h3>
                <p className="text-[#9ca3af] text-sm mb-2">Moto</p>

                </CardContent>
                </Card>

                <Card className="bg-[#1a2332] border-[#374151] hover:border-[#f0c41b] transition-all">
                <CardContent className="p-6 text-center">
                 <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Car className="text-[#3b82f6]" size={32} />
                 </div>
                 <h3 className="font-bold mb-2 text-white text-lg">Categoria B</h3>
                 <p className="text-[#9ca3af] text-sm mb-2">Carro</p>

                </CardContent>
                </Card>

                <Card className="bg-[#1a2332] border-[#374151] hover:border-[#f0c41b] transition-all">
                <CardContent className="p-6 text-center">
                 <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <div className="flex gap-1">
                     <Car className="text-[#3b82f6]" size={24} />
                     <Bike className="text-[#f0c41b]" size={24} />
                   </div>
                 </div>
                 <h3 className="font-bold mb-2 text-white text-lg">Categoria AB</h3>
                 <p className="text-[#9ca3af] text-sm mb-2">Carro + Moto</p>

                </CardContent>
                </Card>

                <Card className="bg-[#1a2332] border-[#374151] hover:border-[#f0c41b] transition-all">
                <CardContent className="p-6 text-center">
                 <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Bus className="text-[#3b82f6]" size={32} />
                 </div>
                 <h3 className="font-bold mb-2 text-white text-lg">Ônibus</h3>
                 <p className="text-[#9ca3af] text-sm mb-2">Categoria D</p>

                </CardContent>
                </Card>

                <Card className="bg-[#1a2332] border-[#374151] hover:border-[#f0c41b] transition-all">
                <CardContent className="p-6 text-center">
                 <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Truck className="text-[#3b82f6]" size={32} />
                 </div>
                 <h3 className="font-bold mb-2 text-white text-lg">Carreta</h3>
                 <p className="text-[#9ca3af] text-sm mb-2">Categoria E</p>

              </CardContent>
            </Card>
          </div>
        </div>

        {/* Vantagens */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8 text-white">
            Por que escolher a <span className="text-[#fbbf24]">CNH PARA TODOS?</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-[#1e2a3a]/80 border-[#3b82f6]/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Conforto e Comodidade</h3>
                <p className="text-[#cbd5e1]">
                  Agendamento 100% online: Marque suas aulas quando e onde quiser, sem burocracia e sem filas.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1e2a3a]/80 border-[#3b82f6]/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Flexibilidade Financeira</h3>
                <p className="text-[#cbd5e1]">
                  Pagamento facilitado: Parcelamos em até 10 vezes sem juros, tornando o investimento na sua habilitação muito mais acessível.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1e2a3a]/80 border-[#3b82f6]/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Segurança e Suporte</h3>
                <p className="text-[#cbd5e1]">
                  Notificações e lembretes automáticos: Nunca mais perca uma aula! Receba alertas por e-mail e WhatsApp com antecedência.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1e2a3a]/80 border-[#3b82f6]/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Instrutores Qualificados</h3>
                <p className="text-[#cbd5e1]">
                  Equipe experiente e preparada: Nossos instrutores são altamente qualificados, garantindo uma aprendizagem segura e eficiente.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1e2a3a]/80 border-[#3b82f6]/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Transparência e Controle</h3>
                <p className="text-[#cbd5e1]">
                  Acesso total ao progresso: Veja seu histórico de aulas, localizações e horários, tudo de forma clara e organizada.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1e2a3a]/80 border-[#3b82f6]/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Reagendamento Simplificado</h3>
                <p className="text-[#cbd5e1]">
                  Flexibilidade em caso de imprevistos: Se houver algum conflito, você pode reagendar suas aulas sem complicação, com total comodidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* CTA Final */}
        <div className="text-center max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] border-none">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">
                Pronto para começar sua jornada?
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Cadastre-se agora e dê o primeiro passo rumo à sua habilitação
              </p>
              {user ? (
                <Link to={createPageUrl('StudentRegister')}>
                  <Button className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] px-8 py-6 text-lg font-bold">
                    Fazer Meu Cadastro
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] px-8 py-6 text-lg font-bold"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('StudentRegister'))}
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