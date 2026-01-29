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
  Shield,
  Clock,
  Award,
  Zap
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
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#1e40af] opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f0c41b] opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#3b82f6] opacity-15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 py-20">
        {/* Main Hero */}
        <div className="text-center mb-24">
          <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-[#1e40af]/20 to-[#f0c41b]/20 rounded-full border border-[#f0c41b]/30">
            <span className="text-[#f0c41b] font-bold text-sm">✨ Sua habilitação começa aqui</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Bem-vindo à
            <br />
            <span className="bg-gradient-to-r from-[#f0c41b] via-[#ffd700] to-[#f0c41b] bg-clip-text text-transparent animate-pulse">
              CNH PARA TODOS
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#9ca3af] mb-12 max-w-3xl mx-auto font-medium">
            Sistema completo e profissional para conquistar sua habilitação com segurança e confiança
          </p>
          
          {user ? (
            <Link to={createPageUrl('Home')}>
              <Button className="bg-gradient-to-r from-[#f0c41b] to-[#ffd700] text-black hover:shadow-2xl hover:shadow-[#f0c41b]/50 px-12 py-8 text-xl font-black rounded-2xl transition-all transform hover:scale-105">
                <Zap className="mr-3" size={24} />
                Acessar Minha Área
                <ArrowRight className="ml-3" size={24} />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] hover:shadow-2xl hover:shadow-[#1e40af]/50 px-10 py-7 text-lg font-bold rounded-2xl transition-all transform hover:scale-105 w-full sm:w-auto"
                onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
              >
                <Shield className="mr-2" size={20} />
                Fazer Login
              </Button>
              <Button 
                className="bg-gradient-to-r from-[#f0c41b] to-[#ffd700] text-black hover:shadow-2xl hover:shadow-[#f0c41b]/50 px-10 py-7 text-lg font-black rounded-2xl transition-all transform hover:scale-105 w-full sm:w-auto"
                onClick={() => base44.auth.redirectToLogin(createPageUrl('StudentRegister'))}
              >
                <Award className="mr-2" size={20} />
                Cadastrar Agora
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
          )}
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-16">
            <div className="flex items-center gap-2 text-[#9ca3af]">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-sm font-semibold">Instrutores Certificados</span>
            </div>
            <div className="flex items-center gap-2 text-[#9ca3af]">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-sm font-semibold">+500 Alunos Aprovados</span>
            </div>
            <div className="flex items-center gap-2 text-[#9ca3af]">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-sm font-semibold">Suporte 24/7</span>
            </div>
          </div>
        </div>

        {/* Categorias */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Escolha sua <span className="bg-gradient-to-r from-[#f0c41b] to-[#ffd700] bg-clip-text text-transparent">Categoria</span>
            </h2>
            <p className="text-[#9ca3af] text-lg">Oferecemos todas as categorias de habilitação</p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0d1117] border-2 border-[#374151] hover:border-[#f0c41b] hover:shadow-2xl hover:shadow-[#f0c41b]/30 transition-all transform hover:scale-105 group">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#f0c41b] to-[#ffd700] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform shadow-lg">
                  <Bike className="text-black" size={36} />
                </div>
                <h3 className="font-black text-lg mb-2">Categoria A</h3>
                <p className="text-[#9ca3af] text-sm mb-3 font-semibold">Motocicleta</p>
                <p className="text-[#f0c41b] font-black text-xl">
                  R$ {settings?.category_a_price || 548}
                </p>
                <p className="text-[#9ca3af] text-xs mt-1">em até 10x</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0d1117] border-2 border-[#374151] hover:border-[#3b82f6] hover:shadow-2xl hover:shadow-[#3b82f6]/30 transition-all transform hover:scale-105 group">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform shadow-lg">
                  <Car className="text-white" size={36} />
                </div>
                <h3 className="font-black text-lg mb-2">Categoria B</h3>
                <p className="text-[#9ca3af] text-sm mb-3 font-semibold">Automóvel</p>
                <p className="text-[#3b82f6] font-black text-xl">
                  R$ {settings?.category_b_price || 548}
                </p>
                <p className="text-[#9ca3af] text-xs mt-1">em até 10x</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0d1117] border-2 border-[#f0c41b] shadow-2xl shadow-[#f0c41b]/20 transform scale-105 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#f0c41b] to-[#ffd700] text-black px-4 py-1 rounded-full text-xs font-black">
                MAIS POPULAR
              </div>
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#f0c41b] via-[#ffd700] to-[#1e40af] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <div className="flex gap-1">
                    <Car className="text-white" size={28} />
                    <Bike className="text-white" size={28} />
                  </div>
                </div>
                <h3 className="font-black text-lg mb-2">Categoria AB</h3>
                <p className="text-[#9ca3af] text-sm mb-3 font-semibold">Carro + Moto</p>
                <p className="bg-gradient-to-r from-[#f0c41b] to-[#ffd700] bg-clip-text text-transparent font-black text-2xl">
                  R$ {settings?.category_ab_price || 992}
                </p>
                <p className="text-[#9ca3af] text-xs mt-1">em até 10x</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0d1117] border-2 border-[#374151] hover:border-[#3b82f6] hover:shadow-2xl hover:shadow-[#3b82f6]/30 transition-all transform hover:scale-105 group">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform shadow-lg">
                  <Bus className="text-white" size={36} />
                </div>
                <h3 className="font-black text-lg mb-2">Ônibus</h3>
                <p className="text-[#9ca3af] text-sm mb-3 font-semibold">Categoria D</p>
                <p className="text-[#3b82f6] font-black text-xl">Consulte</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0d1117] border-2 border-[#374151] hover:border-[#3b82f6] hover:shadow-2xl hover:shadow-[#3b82f6]/30 transition-all transform hover:scale-105 group">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform shadow-lg">
                  <Truck className="text-white" size={36} />
                </div>
                <h3 className="font-black text-lg mb-2">Carreta</h3>
                <p className="text-[#9ca3af] text-sm mb-3 font-semibold">Categoria E</p>
                <p className="text-[#3b82f6] font-black text-xl">Consulte</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Vantagens */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Por que escolher a <span className="bg-gradient-to-r from-[#f0c41b] to-[#ffd700] bg-clip-text text-transparent">CNH PARA TODOS?</span>
            </h2>
            <p className="text-[#9ca3af] text-lg">Vantagens que fazem a diferença na sua jornada</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0d1117] border-2 border-[#374151] hover:border-[#f0c41b] hover:shadow-2xl hover:shadow-[#f0c41b]/20 transition-all group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#f0c41b] to-[#ffd700] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Award className="text-black" size={32} />
                </div>
                <h3 className="font-black mb-3 text-xl">Instrutores Qualificados</h3>
                <p className="text-[#9ca3af] leading-relaxed">
                  Equipe experiente e certificada para te ensinar com segurança e profissionalismo
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0d1117] border-2 border-[#374151] hover:border-[#3b82f6] hover:shadow-2xl hover:shadow-[#3b82f6]/20 transition-all group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <CreditCard className="text-white" size={32} />
                </div>
                <h3 className="font-black mb-3 text-xl">Pagamento Facilitado</h3>
                <p className="text-[#9ca3af] leading-relaxed">
                  Parcelamento em até 10x sem juros no cartão de crédito ou desconto no PIX
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0d1117] border-2 border-[#374151] hover:border-[#f0c41b] hover:shadow-2xl hover:shadow-[#f0c41b]/20 transition-all group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#f0c41b] to-[#ffd700] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Clock className="text-black" size={32} />
                </div>
                <h3 className="font-black mb-3 text-xl">Agendamento Online</h3>
                <p className="text-[#9ca3af] leading-relaxed">
                  Marque suas aulas direto pelo sistema quando e onde quiser, 24 horas por dia
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* O que está incluso */}
        <Card className="bg-[#1a2332] border-[#374151] mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              O que está <span className="text-[#f0c41b]">incluso</span>?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-bold">Mínimo 2 Aulas Práticas</p>
                  <p className="text-sm text-[#9ca3af]">Incluídas em todos os planos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-bold">Aulas Extras</p>
                  <p className="text-sm text-[#9ca3af]">Adicione quantas quiser por R$ 98,00</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-bold">Curso Teórico EAD</p>
                  <p className="text-sm text-[#9ca3af]">Opcional - Material completo online</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-bold">Simulados Online</p>
                  <p className="text-sm text-[#9ca3af]">Prepare-se para a prova teórica</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Final */}
        <div className="text-center">
          <Card className="bg-gradient-to-br from-[#1e40af] via-[#3b82f6] to-[#1e40af] border-2 border-[#3b82f6] shadow-2xl shadow-[#3b82f6]/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#f0c41b]/10 to-transparent opacity-50"></div>
            <CardContent className="p-12 relative">
              <div className="inline-block mb-4 px-4 py-2 bg-[#f0c41b]/20 rounded-full border border-[#f0c41b]">
                <span className="text-[#f0c41b] font-bold text-sm">🚀 Comece agora mesmo</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Pronto para começar sua jornada?
              </h2>
              <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto font-medium">
                Cadastre-se agora e dê o primeiro passo rumo à sua habilitação com a melhor autoescola da região
              </p>
              {user ? (
                <Link to={createPageUrl('StudentRegister')}>
                  <Button className="bg-gradient-to-r from-[#f0c41b] to-[#ffd700] text-black hover:shadow-2xl hover:shadow-[#f0c41b]/50 px-12 py-8 text-xl font-black rounded-2xl transition-all transform hover:scale-105">
                    <Zap className="mr-2" size={24} />
                    Fazer Meu Cadastro
                    <ArrowRight className="ml-2" size={24} />
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="bg-gradient-to-r from-[#f0c41b] to-[#ffd700] text-black hover:shadow-2xl hover:shadow-[#f0c41b]/50 px-12 py-8 text-xl font-black rounded-2xl transition-all transform hover:scale-105"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('StudentRegister'))}
                >
                  <Zap className="mr-2" size={24} />
                  Cadastrar Agora
                  <ArrowRight className="ml-2" size={24} />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}