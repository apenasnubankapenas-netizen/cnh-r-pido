import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserCog, AlertCircle, Check, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerLogin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp_link: '',
    photo: '',
    password: '',
  });

  const [loginPassword, setLoginPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

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
    navigate(createPageUrl('AdminSellerDashboard'));
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await base44.integrations.Core.UploadFile({ file });
      setFormData({...formData, photo: url.file_url});
    } catch (error) {
      setError('Erro ao fazer upload da foto: ' + error.message);
    }
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleRegister = async () => {
    if (!formData.full_name || !formData.phone || !formData.whatsapp_link || !formData.email || !formData.password || !formData.photo) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setRegistering(true);
    setError('');
    setSuccess('');

    try {
      const newSeller = await base44.entities.Seller.create({
        ...formData,
        active: true,
        session_version: 1,
        cashback_balance: 0,
        total_referrals: 0
      });

      // Cria usuário Base44 como admin
      await base44.users.inviteUser(formData.email, 'admin');

      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: 'Bem-vindo! Seu cadastro como Colaborador foi realizado',
        body: `Olá ${formData.full_name},\n\nSeu cadastro como colaborador foi realizado com sucesso!\n\nPara acessar a plataforma como colaborador, use:\n\nEmail: ${formData.email}\nSenha: A senha que você cadastrou\n\nAcesse em: ${window.location.origin}${createPageUrl('SellerLogin')}\n\nGuarde sua senha com segurança.\n\nAtenciosamente,\nCNH Para Todos`
      });

      setSuccess('✅ Cadastro realizado com sucesso! Você será redirecionado para login.');
      
      setTimeout(() => {
        setFormData({full_name: '', email: '', phone: '', whatsapp_link: '', photo: '', password: ''});
        setShowRegister(false);
        setShowLogin(true);
      }, 2000);
    } catch (error) {
      console.error(error);
      setError('Erro ao completar o cadastro: ' + error.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleDirectLogin = async () => {
    setError('');
    setLoggingIn(true);

    if (!loginEmail || !loginPassword) {
      setError('Preencha email e senha.');
      setLoggingIn(false);
      return;
    }

    try {
      const sellers = await base44.entities.Seller.filter({ email: loginEmail });
      
      if (sellers.length === 0) {
        setError('Email ou senha inválidos.');
        setLoggingIn(false);
        return;
      }

      const sellerData = sellers[0];
      
      if (!sellerData.active) {
        setError('Sua conta está inativa. Contate o Super Admin.');
        setLoggingIn(false);
        return;
      }

      if (loginPassword !== (sellerData.password || '')) {
        setError('Email ou senha inválidos.');
        setLoggingIn(false);
        return;
      }

      // Salva sessão e redireciona
      const key = `seller_session_version:${loginEmail}`;
      localStorage.setItem(key, String(sellerData.session_version || 1));
      navigate(createPageUrl('AdminSellerDashboard'));
    } catch (err) {
      setError('Erro ao fazer login: ' + err.message);
      setLoggingIn(false);
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
          <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
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

            {/* Foto de Perfil */}
            <div>
              <Label>Foto de Perfil *</Label>
              <div className="mt-2 flex flex-col gap-2">
                {formData.photo && (
                  <img src={formData.photo} alt="Perfil" className="w-20 h-20 rounded-lg object-cover" />
                )}
                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-[#111827] border border-[#374151] rounded cursor-pointer hover:bg-[#161b22] transition-colors">
                  <Upload size={18} className="text-[#cbd5e1]" />
                  <span className="text-xs text-[#cbd5e1] font-medium">Selecionar foto</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <Label>Nome Completo *</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value.toUpperCase()})}
                placeholder="SEU NOME COMPLETO"
              />
            </div>

            <div>
              <Label>Telefone *</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
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

            <div>
              <Label>Criar Senha *</Label>
              <Input 
                type="password"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Mínimo 6 caracteres"
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
                disabled={registering || !formData.full_name || !formData.phone || !formData.whatsapp_link || !formData.password || !formData.photo}
              >
                {registering ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de login direto para colaborador existente
  if (showLogin) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCog className="text-[#3b82f6]" size={32} />
            </div>
            <CardTitle className="text-xl text-white">Login de Colaborador</CardTitle>
            <p className="text-[#9ca3af] text-sm mt-2">Digite seu email e senha para acessar.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div>
              <Label>Email *</Label>
              <Input 
                type="email"
                className="bg-[#111827] border-[#374151] mt-1"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <Label>Senha *</Label>
              <Input 
                type="password" 
                className="bg-[#111827] border-[#374151] mt-1" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                placeholder="Digite sua senha"
              />
            </div>

            <Button 
              className="w-full bg-[#34d399] text-black hover:bg-[#10b981] py-6 text-base font-bold"
              onClick={handleDirectLogin}
              disabled={loggingIn || !loginEmail || !loginPassword}
            >
              {loggingIn ? 'Entrando...' : 'Entrar'}
            </Button>

            <Button 
              variant="outline" 
              className="w-full border-[#374151]"
              onClick={() => { setShowLogin(false); setLoginEmail(''); setLoginPassword(''); setError(''); }}
            >
              <ArrowLeft className="mr-2" size={18} /> Voltar
            </Button>
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#374151]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1a2332] text-[#9ca3af]">OU</span>
              </div>
            </div>

            <Button 
              className="w-full bg-[#34d399] text-black hover:bg-[#10b981] py-6 text-base font-bold"
              onClick={() => setShowLogin(true)}
            >
              JÁ É COLABORADOR? Entre aqui
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

}