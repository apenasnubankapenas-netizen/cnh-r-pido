import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Upload, User, Calendar, Phone, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function InstructorRegister() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    birth_date: '',
    phone: '',
    whatsapp_link: '',
    bio: '',
    photo: '',
    cover_photo: '',
    teaches_car: false,
    teaches_moto: false,
    teaches_bus: false,
    teaches_truck: false,
    teaches_trailer: false
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    }
  }, []);

  // Garante login antes de concluir cadastro via link de convite
  useEffect(() => {
    (async () => {
      if (!token) return;
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        // redireciona para login e retorna para este link com token
        base44.auth.redirectToLogin(window.location.href);
      }
    })();
  }, [token]);

  const verifyToken = async (tokenValue) => {
    try {
      const invites = await base44.entities.InstructorInvite.filter({ token: tokenValue, used: false });
      if (invites.length === 0) {
        alert('Link inválido ou expirado');
        navigate(createPageUrl('Landing'));
      }
    } catch (e) {
      console.log(e);
    }
  };

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (field === 'photo') setUploadingPhoto(true);
    if (field === 'cover_photo') setUploadingCover(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
    } catch (error) {
      alert('Erro ao fazer upload da imagem');
    } finally {
      if (field === 'photo') setUploadingPhoto(false);
      if (field === 'cover_photo') setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await base44.auth.me();
      const invites = await base44.entities.InstructorInvite.filter({ token, used: false });
      if (invites.length === 0) {
        alert('Link inválido ou expirado');
        return;
      }

      await base44.entities.Instructor.create({
        ...formData,
        user_email: user.email,
        active: true
      });
      await base44.entities.InstructorInvite.update(invites[0].id, { used: true });

      alert('Cadastro concluído com sucesso!');
      navigate(createPageUrl('InstructorProfile'));
    } catch (error) {
      alert('Erro ao finalizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-white">Link de cadastro inválido ou expirado</p>
            <Button 
              className="mt-4"
              onClick={() => navigate(createPageUrl('Landing'))}
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-4">
      <div className="max-w-3xl mx-auto py-8">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Cadastro de Instrutor</CardTitle>
            <p className="text-[#9ca3af]">Complete seu cadastro para começar</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Foto de Perfil */}
              <div>
                <label className="text-white font-medium mb-2 block">Foto de Perfil *</label>
                <div className="flex items-center gap-4">
                  {formData.photo && (
                    <img src={formData.photo} alt="Perfil" className="w-24 h-24 rounded-full object-cover" />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'photo')}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload">
                      <Button type="button" variant="outline" className="cursor-pointer" asChild>
                        <span>
                          <Upload className="mr-2" size={18} />
                          {uploadingPhoto ? 'Enviando...' : 'Escolher Foto'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Foto de Capa */}
              <div>
                <label className="text-white font-medium mb-2 block">Foto de Capa *</label>
                <div className="space-y-2">
                  {formData.cover_photo && (
                    <img src={formData.cover_photo} alt="Capa" className="w-full h-48 rounded-lg object-cover" />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'cover_photo')}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label htmlFor="cover-upload">
                      <Button type="button" variant="outline" className="cursor-pointer" asChild>
                        <span>
                          <Upload className="mr-2" size={18} />
                          {uploadingCover ? 'Enviando...' : 'Escolher Capa'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="text-white font-medium mb-2 block">Nome Completo *</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  required
                />
              </div>

              {/* CPF */}
              <div>
                <label className="text-white font-medium mb-2 block">CPF *</label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="text-white font-medium mb-2 block">Data de Nascimento *</label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  required
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="text-white font-medium mb-2 block">Telefone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-white font-medium mb-2 block">Link do WhatsApp</label>
                <Input
                  value={formData.whatsapp_link}
                  onChange={(e) => setFormData({...formData, whatsapp_link: e.target.value})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  placeholder="https://wa.me/..."
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-white font-medium mb-2 block">Biografia</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  rows={4}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>

              {/* Especialidades */}
              <div>
                <label className="text-white font-medium mb-2 block">Especialidades</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.teaches_car}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_car: checked})}
                    />
                    <span className="text-white">Carro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.teaches_moto}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_moto: checked})}
                    />
                    <span className="text-white">Moto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.teaches_bus}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_bus: checked})}
                    />
                    <span className="text-white">Ônibus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.teaches_truck}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_truck: checked})}
                    />
                    <span className="text-white">Caminhão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.teaches_trailer}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_trailer: checked})}
                    />
                    <span className="text-white">Carreta</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#f0c41b] text-black hover:bg-[#d4aa00] font-bold"
                disabled={loading || !formData.photo || !formData.cover_photo}
              >
                {loading ? 'Cadastrando...' : 'Concluir Cadastro'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}