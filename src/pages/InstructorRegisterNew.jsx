import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Car, 
  Bike, 
  Upload,
  ArrowRight,
  AlertCircle,
  Bus,
  Truck,
  Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function InstructorRegisterNew() {
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
    cpf: '',
    phone: '',
    email: '',
    photo: '',
    cover_photo: '',
    teaches_car: false,
    teaches_moto: false,
    teaches_bus: false,
    teaches_truck: false,
    teaches_trailer: false,
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      // Se usuário está autenticado e estamos no step 1, pular para step 2
      if (me && step === 1 && accessCode) {
        setStep(2);
      }
    } catch (e) {
      setUser(null);
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, [field]: file_url });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const verifyCode = async () => {
    if (!accessCode.trim()) {
      setError('Informe o código de acesso.');
      return;
    }

    try {
      setError('');
      // Buscar código válido
      const codes = await base44.entities.InstructorAccessCode.filter({ 
        code: accessCode.toUpperCase(),
        used: false 
      });

      if (codes.length === 0) {
        setError('Código de acesso inválido ou já utilizado.');
        return;
      }

      // Se já está autenticado, pular para formulário
      if (user) {
        setFormData({...formData, email: user.email});
        setStep(3);
      } else {
        setStep(2);
      }
    } catch (e) {
      setError('Erro ao validar código: ' + e.message);
    }
  };

  const handleGoogleLogin = () => {
    setAuthenticating(true);
    base44.auth.redirectToLogin(createPageUrl('InstructorRegisterNew'));
  };

  const handleRegister = async () => {
    if (!formData.full_name || !formData.cpf || !formData.phone || !formData.email) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!formData.teaches_car && !formData.teaches_moto && !formData.teaches_bus && !formData.teaches_truck && !formData.teaches_trailer) {
      setError('Selecione pelo menos um tipo de aula.');
      return;
    }

    setRegistering(true);
    setError('');
    setSuccess('');

    try {
      // Buscar código novamente para marcar como usado
      const codes = await base44.entities.InstructorAccessCode.filter({ 
        code: accessCode.toUpperCase(),
        used: false 
      });

      if (codes.length === 0) {
        setError('Código expirou. Solicite um novo.');
        setRegistering(false);
        return;
      }

      const code = codes[0];

      // Gerar senha aleatória
      const generatedPassword = Math.random().toString(36).substring(2, 12);

      // Criar instrutor
      const newInstructor = await base44.entities.Instructor.create({
        ...formData,
        user_email: formData.email,
        active: true,
        password: generatedPassword,
        session_version: 1,
        contract_accepted: false
      });

      // Enviar email com senha
      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: 'Bem-vindo! Sua senha de acesso como Instrutor',
        body: `Olá ${formData.full_name},\n\nSeu cadastro como instrutor foi realizado com sucesso!\n\nPara acessar a plataforma como instrutor, use:\n\nEmail: ${formData.email}\nSenha: ${generatedPassword}\n\nAcesse em: https://seu-dominio.com.br/InstructorLogin\n\nNota: Sua senha foi enviada para este email. Guarde com segurança.\n\nAtenciosamente,\nCNH Para Todos`
      });

      // Marcar código como usado
      await base44.entities.InstructorAccessCode.update(code.id, {
        used: true,
        used_by_email: formData.email,
        used_at: new Date().toISOString()
      });

      setSuccess('✅ Cadastro realizado! Verifique seu email para a senha.');
      
      setTimeout(() => {
        navigate(createPageUrl('InstructorLogin'));
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
        {/* Step 1: Código de Acesso */}
        {step === 1 && (
          <Card className="bg-[#1a2332] border-[#374151]">
            <CardHeader>
              <CardTitle className="text-[#fbbf24] text-2xl text-center">Cadastro de Instrutor</CardTitle>
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
                Você deve ter recebido este código do Super Admin para se registrar como instrutor.
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
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
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

              {/* Foto de Perfil */}
              <div>
                <Label>Foto de Perfil</Label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#374151] rounded-lg cursor-pointer hover:border-[#3b82f6] transition-colors mt-2">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Perfil" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="text-[#9ca3af]" size={24} />
                      <span className="text-xs text-[#9ca3af] mt-1">Clique para enviar foto</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
                </label>
              </div>

              {/* Capa de Perfil */}
              <div>
                <Label>Capa de Perfil</Label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#374151] rounded-lg cursor-pointer hover:border-[#3b82f6] transition-colors mt-2">
                  {formData.cover_photo ? (
                    <img src={formData.cover_photo} alt="Capa" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="text-[#9ca3af]" size={20} />
                      <span className="text-xs text-[#9ca3af] mt-1">Capa do perfil</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover_photo')} />
                </label>
              </div>

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

              {/* CPF e Telefone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CPF *</Label>
                  <Input 
                    className="bg-[#111827] border-[#374151] mt-1"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    placeholder="000.000.000-00"
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
              </div>

              {/* Email do Google */}
              <div>
                <Label>Email do Google *</Label>
                <Input 
                  type="email"
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="seu.email@gmail.com"
                />
                <p className="text-xs text-[#9ca3af] mt-1">Você receberá notificações neste email.</p>
              </div>

              {/* Tipos de Aula */}
              <div>
                <Label className="mb-3 block">Tipos de Aula que você ensina *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151]">
                    <span className="flex items-center gap-2">
                      <Car size={16} className="text-[#3b82f6]" /> 
                      <span className="text-sm">Carro</span>
                    </span>
                    <Switch 
                      checked={formData.teaches_car}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_car: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151]">
                    <span className="flex items-center gap-2">
                      <Bike size={16} className="text-[#fbbf24]" /> 
                      <span className="text-sm">Moto</span>
                    </span>
                    <Switch 
                      checked={formData.teaches_moto}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_moto: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151]">
                    <span className="flex items-center gap-2">
                      <Bus size={16} className="text-green-400" /> 
                      <span className="text-sm">Ônibus</span>
                    </span>
                    <Switch 
                      checked={formData.teaches_bus}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_bus: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151]">
                    <span className="flex items-center gap-2">
                      <Truck size={16} className="text-orange-400" /> 
                      <span className="text-sm">Caminhão</span>
                    </span>
                    <Switch 
                      checked={formData.teaches_truck}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_truck: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151] col-span-2">
                    <span className="flex items-center gap-2">
                      <Truck size={16} className="text-purple-400" /> 
                      <span className="text-sm">Carreta</span>
                    </span>
                    <Switch 
                      checked={formData.teaches_trailer}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_trailer: checked})}
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 mt-6 sticky bottom-0 bg-[#1a2332] p-4 -mx-4">
                <Button 
                  variant="outline" 
                  className="flex-1 border-[#374151]"
                  onClick={() => { setStep(2); setFormData({...formData, email: ''}); setUser(null); }}
                  disabled={registering}
                >
                  Voltar
                </Button>
                <Button 
                  className="flex-1 bg-[#f0c41b] text-black hover:bg-[#d4aa00] py-6"
                  onClick={handleRegister}
                  disabled={registering || !formData.full_name || !formData.cpf || !formData.phone || !formData.email}
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