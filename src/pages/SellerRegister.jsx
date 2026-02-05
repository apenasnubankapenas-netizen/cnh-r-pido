import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowRight, AlertCircle, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SellerRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [accessCode, setAccessCode] = useState('');
  const [user, setUser] = useState(null);
  const [authenticating, setAuthenticating] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp_link: '',
  });

  const checkUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
    } catch (e) {
      setUser(null);
    }
  };

  const verifyCode = async () => {
    if (!accessCode.trim()) {
      setError('Informe o código de acesso.');
      return;
    }

    try {
      setError('');
      const me = await base44.auth.me();
      setUser(me);
      
      if (me) {
        setFormData({...formData, email: me.email});
        setStep(2);
      } else {
        setStep(2);
      }
    } catch (e) {
      setError('Erro ao validar código: ' + e.message);
    }
  };

  const handleGoogleLogin = () => {
    setAuthenticating(true);
    base44.auth.redirectToLogin(createPageUrl('SellerRegister'));
  };

  const handleRegister = async () => {
    if (!formData.full_name || !formData.phone || !formData.whatsapp_link || !formData.email) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setRegistering(true);
    setError('');
    setSuccess('');

    try {
      // Gerar senha aleatória
      const generatedPassword = Math.random().toString(36).substring(2, 12);

      // Criar colaborador/vendedor
      const newSeller = await base44.entities.Seller.create({
        ...formData,
        active: true,
        password: generatedPassword,
        session_version: 1,
        cashback_balance: 0,
        total_referrals: 0
      });

      // Enviar email com senha
      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: 'Bem-vindo! Sua senha de acesso como Colaborador',
        body: `Olá ${formData.full_name},\n\nSeu cadastro como colaborador foi realizado com sucesso!\n\nPara acessar a plataforma como colaborador, use:\n\nEmail: ${formData.email}\nSenha: ${generatedPassword}\n\nAcesse em: ${window.location.origin}${createPageUrl('SellerLogin')}\n\nNota: Sua senha foi enviada para este email. Guarde com segurança.\n\nAtenciosamente,\nCNH Para Todos`
      });

      setSuccess('✅ Cadastro realizado! Verifique seu email para a senha.');
      
      setTimeout(() => {
        navigate(createPageUrl('SellerLogin'));
      }, 2000);
    } catch (error) {
      console.error(error);
      setError('Erro ao completar o cadastro: ' + error.message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Link para login de colaboradores existentes */}
        <div className="text-center mb-6">
          <p className="text-[#9ca3af] text-sm">
            Já é colaborador?{' '}
            <button 
              onClick={() => navigate(createPageUrl('SellerLogin'))}
              className="text-[#0969da] hover:text-[#3b82f6] font-semibold transition-colors"
            >
              Entrar aqui
            </button>
          </p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto">
        {/* Step 1: Código de Acesso */}
        {step === 1 && (
          <Card className="bg-[#1a2332] border-[#374151]">
            <CardHeader>
              <CardTitle className="text-[#fbbf24] text-2xl text-center">Cadastro de Colaborador</CardTitle>
              <p className="text-[#9ca3af] text-center mt-2">Informe o código de acesso para continuar</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500 rounded flex items-center gap-2 text-red-400">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div>
                <Label>Código de Acesso *</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-2 text-lg tracking-widest uppercase"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123XYZ"
                  maxLength={20}
                />
              </div>

              <p className="text-sm text-[#9ca3af]">
                Você deve ter recebido este código do Super Admin para se registrar como colaborador.
              </p>

              <Button 
                className="w-full bg-[#f0c41b] text-black hover:bg-[#d4aa00] py-6 text-base font-bold"
                onClick={verifyCode}
                disabled={!accessCode.trim()}
              >
                Verificar Código <ArrowRight className="ml-2" size={18} />
              </Button>

              <Button 
                variant="outline" 
                className="w-full border-[#374151]"
                onClick={() => navigate(createPageUrl('Landing'))}
              >
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Autenticação Google */}
        {step === 2 && (
          <Card className="bg-[#1a2332] border-[#374151]">
            <CardHeader>
              <CardTitle className="text-[#fbbf24] text-2xl text-center">Conectar Conta Google</CardTitle>
              <p className="text-[#9ca3af] text-center mt-2">Você receberá a senha de acesso neste email</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500 rounded flex items-center gap-2 text-red-400">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="p-6 text-center">
                <p className="text-[#9ca3af] mb-6">Entre com sua conta Google para prosseguir.</p>
                <Button 
                  className="w-full bg-white text-black hover:bg-gray-200 py-6 text-base font-bold flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  disabled={authenticating}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {authenticating ? 'Conectando...' : 'Entrar com Google'}
                </Button>
              </div>

              <Button 
                variant="outline" 
                className="w-full border-[#374151]"
                onClick={() => setStep(1)}
              >
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Formulário de Registro */}
        {step === 3 && (
          <Card className="bg-[#1a2332] border-[#374151]">
            <CardHeader>
              <CardTitle className="text-[#fbbf24]">Complete seu Cadastro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500 rounded flex items-center gap-2 text-red-400">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500 rounded flex items-center gap-2 text-green-400">
                  <Check size={18} />
                  {success}
                </div>
              )}

              {/* Nome Completo */}
              <div>
                <Label>Nome Completo *</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Telefone e Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone *</Label>
                  <Input 
                    className="bg-[#111827] border-[#374151] mt-1"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    className="bg-[#111827] border-[#374151] mt-1"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="seu.email@gmail.com"
                    disabled
                  />
                </div>
              </div>

              {/* Link WhatsApp */}
              <div>
                <Label>Link do WhatsApp *</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.whatsapp_link}
                  onChange={(e) => setFormData({...formData, whatsapp_link: e.target.value})}
                  placeholder="https://wa.me/5511999999999"
                />
                <p className="text-xs text-[#9ca3af] mt-1">Alunos poderão entrar em contato com você via WhatsApp usando este link.</p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1 border-[#374151]"
                  onClick={() => setStep(2)}
                  disabled={registering}
                >
                  Voltar
                </Button>
                <Button 
                  className="flex-1 bg-[#f0c41b] text-black hover:bg-[#d4aa00] py-6"
                  onClick={handleRegister}
                  disabled={registering || !formData.full_name || !formData.phone || !formData.whatsapp_link || !formData.email}
                >
                  {registering ? 'Cadastrando...' : (
                    <>
                      Finalizar Cadastro <Check className="ml-2" size={18} />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}