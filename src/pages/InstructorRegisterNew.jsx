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

      setStep(2);
    } catch (e) {
      setError('Erro ao validar código: ' + e.message);
    }
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

      // Criar instrutor
      const newInstructor = await base44.entities.Instructor.create({
        ...formData,
        user_email: formData.email,
        active: true,
        password: Math.random().toString(36).substring(2, 12),
        session_version: 1,
        contract_accepted: false
      });

      // Marcar código como usado
      await base44.entities.InstructorAccessCode.update(code.id, {
        used: true,
        used_by_email: formData.email,
        used_at: new Date().toISOString()
      });

      setSuccess('✅ Cadastro realizado com sucesso!');
      
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

        {/* Step 2: Formulário de Registro */}
        {step === 2 && (
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
                  onClick={() => setStep(1)}
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