import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserCog, AlertCircle, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerLogin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp_link: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me) {
          setFormData({...formData, email: me.email});
          const sellers = await base44.entities.Seller.filter({ email: me.email });
          if (sellers.length > 0) setSeller(sellers[0]);
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const handleEnter = () => {
    setError('');
    if (!seller) {
      setError('Sua conta não está como Vendedor.');
      return;
    }
    if (!password || password !== (seller.password || '')) {
      setError('Senha inválida.');
      return;
    }
    const key = `seller_session_version:${user.email}`;
    localStorage.setItem(key, String(seller.session_version || 1));
    navigate(createPageUrl('AdminDashboard'));
  };

  const verifyCode = async () => {
    if (!accessCode.trim()) {
      setError('Informe o código de acesso.');
      return;
    }

    try {
      setError('');
      setShowRegister(true);
    } catch (e) {
      setError('Erro ao validar código: ' + e.message);
    }
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
      const generatedPassword = Math.random().toString(36).substring(2, 12);

      const newSeller = await base44.entities.Seller.create({
        ...formData,
        active: true,
        password: generatedPassword,
        session_version: 1,
        cashback_balance: 0,
        total_referrals: 0
      });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] w-full max-w-md"><CardContent className="p-6">Carregando...</CardContent></Card>
      </div>
    );
  }

  // Tela de registro de novo colaborador
  if (showRegister) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-[#fbbf24]">Complete seu Cadastro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500 rounded flex items-center gap-2 text-green-400 text-sm">
                <Check size={18} />
                {success}
              </div>
            )}

            <div>
              <Label>Nome Completo *</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Seu nome completo"
              />
            </div>

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
              <Label>Link do WhatsApp *</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.whatsapp_link}
                onChange={(e) => setFormData({...formData, whatsapp_link: e.target.value})}
                placeholder="https://wa.me/5511999999999"
              />
              <p className="text-xs text-[#9ca3af] mt-1">Alunos poderão entrar em contato via WhatsApp.</p>
            </div>

            <div>
              <Label>Email *</Label>
              <Input 
                type="email"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.email}
                disabled
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="flex-1 border-[#374151]"
                onClick={() => { setShowRegister(false); setFormData({...formData, full_name: '', phone: '', whatsapp_link: ''}); }}
                disabled={registering}
              >
                Voltar
              </Button>
              <Button 
                className="flex-1 bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
                onClick={handleRegister}
                disabled={registering || !formData.full_name || !formData.phone || !formData.whatsapp_link}
              >
                {registering ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de código de acesso
  if (!seller) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCog className="text-[#3b82f6]" size={32} />
            </div>
            <CardTitle className="text-xl text-white">Cadastro de Colaborador</CardTitle>
            <p className="text-[#9ca3af] text-sm mt-2">Informe o código de acesso para se registrar</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded flex items-center gap-2 text-red-400 text-sm">
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
              Verificar Código
            </Button>

            <Button 
              variant="outline" 
              className="w-full border-[#374151]"
              onClick={() => navigate(createPageUrl('Landing'))}
            >
              <ArrowLeft className="mr-2" size={18} /> Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de login de colaborador existente
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <Card className="bg-[#1a2332] border-[#374151] w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCog className="text-[#3b82f6]" size={32} />
          </div>
          <CardTitle className="text-xl text-white">Login de Colaborador</CardTitle>
          <p className="text-[#9ca3af] text-sm mt-2">Informe a senha definida pelo Super Admin.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Senha do Colaborador</Label>
            <Input type="password" className="bg-[#111827] border-[#374151] mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6]" onClick={handleEnter}>Entrar</Button>
          <Button 
            variant="outline" 
            className="w-full border-[#374151]"
            onClick={() => navigate(createPageUrl('Landing'))}
          >
            <ArrowLeft className="mr-2" size={18} /> Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}