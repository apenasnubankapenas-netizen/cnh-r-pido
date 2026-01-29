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
  Truck
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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] to-[#0d1117]">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            Bem-vindo à <span className="text-[#f0c41b]">CNH PARA TODOS</span>
          </h1>
          <p className="text-xl text-[#9ca3af] mb-8">
            A sua autoescola completa para conquista da habilitação
          </p>
          
          {user ? (
            <Link to={createPageUrl('Home')}>
              <Button className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] px-8 py-6 text-lg font-bold">
                Acessar Minha Área
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          ) : (
            <div className="flex gap-4 justify-center">
              <Button 
                className="bg-[#1e40af] hover:bg-[#3b82f6] px-8 py-6 text-lg font-bold"
                onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
              >
                Fazer Login
              </Button>
              <Button 
                className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] px-8 py-6 text-lg font-bold"
                onClick={() => base44.auth.redirectToLogin(createPageUrl('StudentRegister'))}
              >
                Cadastrar Agora
                <ArrowRight className="ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Categorias */}
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
                <h3 className="font-bold mb-2">Categoria A</h3>
                <p className="text-[#9ca3af] text-sm mb-2">Moto</p>
                <p className="text-[#f0c41b] font-bold">
                  A partir de R$ {settings?.category_a_price || 548},00
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151] hover:border-[#f0c41b] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="text-[#3b82f6]" size={32} />
                </div>
                <h3 className="font-bold mb-2">Categoria B</h3>
                <p className="text-[#9ca3af] text-sm mb-2">Carro</p>
                <p className="text-[#f0c41b] font-bold">
                  A partir de R$ {settings?.category_b_price || 548},00
                </p>
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
                <h3 className="font-bold mb-2">Categoria AB</h3>
                <p className="text-[#9ca3af] text-sm mb-2">Carro + Moto</p>
                <p className="text-[#f0c41b] font-bold">
                  A partir de R$ {settings?.category_ab_price || 992},00
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151] hover:border-[#f0c41b] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="text-[#3b82f6]" size={32} />
                </div>
                <h3 className="font-bold mb-2">Ônibus</h3>
                <p className="text-[#9ca3af] text-sm mb-2">Categoria D</p>
                <p className="text-[#f0c41b] font-bold">Consulte</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151] hover:border-[#f0c41b] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="text-[#3b82f6]" size={32} />
                </div>
                <h3 className="font-bold mb-2">Carreta</h3>
                <p className="text-[#9ca3af] text-sm mb-2">Categoria E</p>
                <p className="text-[#f0c41b] font-bold">Consulte</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Vantagens */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Por que escolher a <span className="text-[#f0c41b]">CNH PARA TODOS?</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-6">
                <CheckCircle className="text-[#f0c41b] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg">Instrutores Qualificados</h3>
                <p className="text-[#9ca3af]">
                  Equipe experiente e preparada para te ensinar com segurança
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-6">
                <CheckCircle className="text-[#f0c41b] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg">Pagamento Facilitado</h3>
                <p className="text-[#9ca3af]">
                  Parcelamento em até 10x sem juros no cartão de crédito
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-6">
                <CheckCircle className="text-[#f0c41b] mb-4" size={40} />
                <h3 className="font-bold mb-2 text-lg">Agendamento Online</h3>
                <p className="text-[#9ca3af]">
                  Marque suas aulas direto pelo aplicativo quando quiser
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