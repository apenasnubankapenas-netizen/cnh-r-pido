import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Car, 
  Bike, 
  Upload,
  ArrowRight,
  Check,
  AlertCircle,
  Bus,
  Truck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function InstructorRegisterInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [invite, setInvite] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    birth_date: '',
    phone: '',
    whatsapp_link: '',
    photo: '',
    bio: '',
    pix_key: '',
    teaches_car: false,
    teaches_moto: false,
    teaches_bus: false,
    teaches_truck: false,
    teaches_trailer: false,
    active: true,
    email: ''
  });

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      if (!token) {
        setErrorMessage('Token de convite não encontrado.');
        setTokenValid(false);
        setLoading(false);
        return;
      }

      const invites = await base44.entities.InstructorInvite.filter({ token, used: false });
      
      if (invites.length === 0) {
        setErrorMessage('Link de convite inválido ou já foi utilizado.');
        setTokenValid(false);
      } else {
        setInvite(invites[0]);
        setTokenValid(true);
      }
    } catch (e) {
      console.log(e);
      setErrorMessage('Erro ao validar token.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, photo: file_url });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const handleRegister = async () => {
    if (!formData.full_name || !formData.cpf || !formData.phone) {
      setErrorMessage('Por favor, preencha os campos obrigatórios.');
      return;
    }

    setRegistering(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Criar o usuário via Base44 Auth
      const email = `instructor_${Date.now()}@autoescola.local`;
      const password = Math.random().toString(36).substring(2, 15);

      // Criar instructor
      const newInstructor = await base44.entities.Instructor.create({
        ...formData,
        user_email: email,
        password,
        session_version: 1,
        active: true,
        contract_accepted: false
      });

      // Marcar invite como usado
      await base44.entities.InstructorInvite.update(invite.id, {
        used: true,
        invited_email: email
      });

      setSuccessMessage(`✅ Cadastro realizado com sucesso! Instrutor criado com email: ${email}`);
      
      setTimeout(() => {
        navigate(createPageUrl('InstructorLogin'));
      }, 2000);
    } catch (error) {
      console.error(error);
      setErrorMessage('Erro ao completar o cadastro: ' + error.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <div className="animate-pulse text-[#fbbf24] text-lg">Validando convite...</div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle size={48} className="mx-auto text-red-500" />
            <h2 className="text-xl font-bold text-white">Link Inválido</h2>
            <p className="text-[#9ca3af]">{errorMessage}</p>
            <Button 
              className="w-full bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
              onClick={() => navigate(createPageUrl('Landing'))}
            >
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Cadastro de Instrutor</h1>
          <p className="text-[#9ca3af]">Complete seu cadastro para se tornar um instrutor</p>
        </div>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#fbbf24]">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500 rounded flex items-center gap-2 text-green-400">
                <Check size={18} />
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded flex items-center gap-2 text-red-400">
                <AlertCircle size={18} />
                {errorMessage}
              </div>
            )}

            {/* Foto de Perfil */}
            <div className="flex justify-center">
              <label className="w-24 h-24 rounded-full bg-[#111827] border-2 border-dashed border-[#374151] flex items-center justify-center cursor-pointer overflow-hidden hover:border-[#3b82f6] transition-colors">
                {formData.photo ? (
                  <img src={formData.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="text-[#9ca3af]" />
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
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

            {/* CPF e Data de Nascimento */}
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
                <Label>Data de Nascimento *</Label>
                <Input 
                  type="date"
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                />
              </div>
            </div>

            {/* Telefone e WhatsApp */}
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
                <Label>Link WhatsApp</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.whatsapp_link}
                  onChange={(e) => setFormData({...formData, whatsapp_link: e.target.value})}
                  placeholder="https://wa.me/..."
                />
              </div>
            </div>

            {/* Chave PIX */}
            <div>
              <Label>Chave PIX</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.pix_key}
                onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
                placeholder="CPF, Email, Telefone ou Chave aleatória"
              />
            </div>

            {/* Biografia */}
            <div>
              <Label>Biografia</Label>
              <textarea 
                className="w-full bg-[#111827] border border-[#374151] rounded-md p-3 mt-1 text-white text-sm"
                rows="3"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Fale um pouco sobre você e sua experiência"
              />
            </div>

            {/* Tipos de Aula */}
            <div>
              <Label className="mb-3 block">Tipos de Aula que você ensina</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151]">
                  <span className="flex items-center gap-2">
                    <Car size={16} className="text-[#3b82f6]" /> 
                    <span>Carro</span>
                  </span>
                  <Switch 
                    checked={formData.teaches_car}
                    onCheckedChange={(checked) => setFormData({...formData, teaches_car: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151]">
                  <span className="flex items-center gap-2">
                    <Bike size={16} className="text-[#fbbf24]" /> 
                    <span>Moto</span>
                  </span>
                  <Switch 
                    checked={formData.teaches_moto}
                    onCheckedChange={(checked) => setFormData({...formData, teaches_moto: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151]">
                  <span className="flex items-center gap-2">
                    <Bus size={16} className="text-green-400" /> 
                    <span>Ônibus</span>
                  </span>
                  <Switch 
                    checked={formData.teaches_bus}
                    onCheckedChange={(checked) => setFormData({...formData, teaches_bus: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151]">
                  <span className="flex items-center gap-2">
                    <Truck size={16} className="text-orange-400" /> 
                    <span>Caminhão</span>
                  </span>
                  <Switch 
                    checked={formData.teaches_truck}
                    onCheckedChange={(checked) => setFormData({...formData, teaches_truck: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151] col-span-2">
                  <span className="flex items-center gap-2">
                    <Truck size={16} className="text-purple-400" /> 
                    <span>Carreta</span>
                  </span>
                  <Switch 
                    checked={formData.teaches_trailer}
                    onCheckedChange={(checked) => setFormData({...formData, teaches_trailer: checked})}
                  />
                </div>
              </div>
            </div>

            {/* Aviso */}
            <div className="p-3 bg-blue-500/10 border border-blue-500 rounded text-sm text-blue-400">
              Após o registro, você receberá um email com suas credenciais de acesso.
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="flex-1 border-[#374151]"
                onClick={() => navigate(createPageUrl('Landing'))}
                disabled={registering}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
                onClick={handleRegister}
                disabled={
                  registering || 
                  !formData.full_name || 
                  !formData.cpf || 
                  !formData.phone
                }
              >
                {registering ? 'Cadastrando...' : (
                  <>
                    Completar Cadastro <ArrowRight className="ml-2" size={18} />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}