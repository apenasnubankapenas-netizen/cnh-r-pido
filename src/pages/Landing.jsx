import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const settingsData = await base44.entities.AppSettings.list();
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }

      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Usuário não logado
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#1e40af]/10 to-[#0a0e1a]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#fbbf24]/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#1e40af]/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
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
            <p className="text-lg md:text-xl text-[#9ca3af] mb-4 max-w-2xl mx-auto font-medium">
              O futuro da sua habilitação está aqui
            </p>
            <p className="text-base text-[#6b7280] mb-12 max-w-xl mx-auto">
              Plataforma completa para gestão, acompanhamento e conquista da sua CNH com tecnologia de ponta
            </p>
          </div>

          {/* Login/Register Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            {user ? (
              <div className="md:col-span-2">
                <Link to={createPageUrl('Home')}>
                  <button className="group relative w-full bg-gradient-to-r from-[#1e40af] to-[#3b82f6] hover:from-[#1e3a8a] hover:to-[#2563eb] text-white p-8 rounded-2xl shadow-2xl hover:shadow-[#3b82f6]/50 transition-all duration-300 transform hover:scale-105 border-2 border-[#3b82f6]/30">
                    <div className="flex items-center justify-center gap-3">
                      <div className="bg-white/10 p-3 rounded-xl">
                        <ArrowRight className="h-8 w-8" />
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-bold">Acessar Minha Área</div>
                        <div className="text-sm text-white/80">Continue sua jornada</div>
                      </div>
                    </div>
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {/* Login Card */}
                <button 
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('Home'))}
                  className="group relative bg-gradient-to-br from-[#1a2332] to-[#0d1117] p-8 rounded-2xl border-2 border-[#1e40af]/30 hover:border-[#3b82f6] transition-all duration-300 hover:shadow-2xl hover:shadow-[#1e40af]/30 transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-br from-[#1e40af] to-[#3b82f6] p-4 rounded-xl">
                        <LogIn className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Já tenho conta</h3>
                    <p className="text-[#9ca3af] text-sm">Acesse sua área de aluno e continue seu progresso</p>
                  </div>
                </button>

                {/* Register Card */}
                <button 
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('StudentRegister'))}
                  className="group relative bg-gradient-to-br from-[#1a2332] to-[#0d1117] p-8 rounded-2xl border-2 border-[#fbbf24]/30 hover:border-[#fcd34d] transition-all duration-300 hover:shadow-2xl hover:shadow-[#fbbf24]/30 transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf24]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-br from-[#fbbf24] to-[#fcd34d] p-4 rounded-xl">
                        <UserPlus className="h-8 w-8 text-black" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Sou novo aqui</h3>
                    <p className="text-[#9ca3af] text-sm">Comece sua jornada rumo à habilitação agora mesmo</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="relative max-w-6xl mx-auto px-4 pb-16">
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Escolha sua <span className="text-[#f0c41b]">Categoria</span>
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
          <h2 className="text-2xl font-bold text-center mb-8">
            Por que escolher a <span className="text-[#f0c41b]">CNH PARA TODOS?</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Conforto e Comodidade</h3>
                <p className="text-[#9ca3af]">
                  Agendamento 100% online: Marque suas aulas quando e onde quiser, sem burocracia e sem filas.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Flexibilidade Financeira</h3>
                <p className="text-[#9ca3af]">
                  Pagamento facilitado: Parcelamos em até 10 vezes sem juros, tornando o investimento na sua habilitação muito mais acessível.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Segurança e Suporte</h3>
                <p className="text-[#9ca3af]">
                  Notificações e lembretes automáticos: Nunca mais perca uma aula! Receba alertas por e-mail e WhatsApp com antecedência.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Instrutores Qualificados</h3>
                <p className="text-[#9ca3af]">
                  Equipe experiente e preparada: Nossos instrutores são altamente qualificados, garantindo uma aprendizagem segura e eficiente.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Transparência e Controle</h3>
                <p className="text-[#9ca3af]">
                  Acesso total ao progresso: Veja seu histórico de aulas, localizações e horários, tudo de forma clara e organizada.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-6">
                <CheckCircle className="text-[#3b82f6] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg text-white">Reagendamento Simplificado</h3>
                <p className="text-[#9ca3af]">
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