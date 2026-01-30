import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Car, 
  Bike, 
  Bus,
  Truck,
  Phone,
  DollarSign,
  Save,
  X,
  Upload,
  Link as LinkIcon,
  Copy,
  ArrowLeft
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInstructor, setPasswordInstructor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    whatsapp_link: '',
    photo: '',
    bio: '',
    teaches_car: false,
    teaches_moto: false,
    teaches_bus: false,
    teaches_truck: false,
    teaches_trailer: false,
    active: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [instructorsData, lessonsData, settingsData] = await Promise.all([
        base44.entities.Instructor.list(),
        base44.entities.Lesson.list(),
        base44.entities.AppSettings.list()
      ]);
      setInstructors(instructorsData);
      setLessons(lessonsData);
      if (settingsData.length > 0) setSettings(settingsData[0]);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const getInstructorEarnings = (instructorId) => {
    const instructorLessons = lessons.filter(l => l.instructor_id === instructorId && l.status === 'realizada');
    const carLessons = instructorLessons.filter(l => l.type === 'carro').length;
    const motoLessons = instructorLessons.filter(l => l.type === 'moto').length;
    
    const carRate = settings?.instructor_car_commission || 12;
    const motoRate = settings?.instructor_moto_commission || 7;
    
    return {
      carLessons,
      motoLessons,
      carEarnings: carLessons * carRate,
      motoEarnings: motoLessons * motoRate,
      total: (carLessons * carRate) + (motoLessons * motoRate)
    };
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

  const handleSave = async () => {
    try {
      if (editingInstructor) {
        await base44.entities.Instructor.update(editingInstructor.id, formData);
      } else {
        await base44.entities.Instructor.create(formData);
      }
      setShowDialog(false);
      resetForm();
      loadData();
    } catch (e) {
      console.log(e);
    }
  };

  const handleEdit = (instructor) => {
    setEditingInstructor(instructor);
    setFormData(instructor);
    setShowDialog(true);
  };

  const openPasswordDialog = (instructor) => {
    setPasswordInstructor(instructor);
    setNewPassword('');
    setShowPasswordDialog(true);
  };

  const savePassword = async () => {
    if (!passwordInstructor || !newPassword) return;
    try {
      await base44.entities.Instructor.update(passwordInstructor.id, {
        password: newPassword,
        session_version: (passwordInstructor.session_version || 1) + 1
      });
      alert('Senha atualizada. O instrutor será desconectado.');
      setShowPasswordDialog(false);
      setPasswordInstructor(null);
      setNewPassword('');
      loadData();
    } catch (e) {
      console.log(e);
    }
  };

  const handleDelete = async (instructorId) => {
    if (confirm('Tem certeza que deseja excluir este instrutor?')) {
      try {
        await base44.entities.Instructor.delete(instructorId);
        loadData();
      } catch (e) {
        console.log(e);
      }
    }
  };

  const generateInviteLink = async () => {
    try {
      const token = Math.random().toString(36).substring(2, 15);
      await base44.entities.Instructor.create({
        full_name: 'Pendente',
        cpf: 'pendente',
        registration_token: token,
        active: false
      });
      
      const link = `${window.location.origin}${createPageUrl('InstructorRegister')}?token=${token}`;
      setInviteLink(link);
      setShowInviteDialog(true);
    } catch (e) {
      alert('Erro ao gerar link de convite');
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Link copiado para a área de transferência!');
  };

  const resetForm = () => {
    setEditingInstructor(null);
    setFormData({
      full_name: '',
      phone: '',
      whatsapp_link: '',
      photo: '',
      bio: '',
      teaches_car: false,
      teaches_moto: false,
      teaches_bus: false,
      teaches_truck: false,
      teaches_trailer: false,
      active: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-[#fbbf24]" />
            Gerenciar Instrutores
          </h1>
        </div>
        <div className="flex gap-2">
          {user?.email === 'tcnhpara@gmail.com' && (
            <Button 
              className="bg-[#f0c41b] text-white hover:bg-[#d4aa00]"
              onClick={generateInviteLink}
            >
              <LinkIcon className="mr-2" size={18} />
              Gerar Link de Convite
            </Button>
          )}
          <Button 
            className="bg-[#1e40af] hover:bg-[#3b82f6]"
            onClick={() => { resetForm(); setShowDialog(true); }}
          >
            <Plus className="mr-2" size={18} />
            Novo Instrutor
          </Button>
        </div>
      </div>

      {/* Lista de Instrutores */}
      <div className="grid md:grid-cols-2 gap-4">
        {instructors.map((instructor) => {
          const earnings = getInstructorEarnings(instructor.id);
          
          return (
            <Card key={instructor.id} className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#1e40af]/20 flex items-center justify-center overflow-hidden">
                    {instructor.photo ? (
                      <img src={instructor.photo} alt={instructor.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-[#fbbf24]">
                        {instructor.full_name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">{instructor.full_name}</h3>
                      <Badge className={instructor.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {instructor.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#9ca3af]">{instructor.phone}</p>
                    
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {instructor.teaches_car && (
                        <Badge variant="outline" className="border-[#374151] text-xs">
                          <Car size={12} className="text-[#3b82f6] mr-1" /> Carro
                        </Badge>
                      )}
                      {instructor.teaches_moto && (
                        <Badge variant="outline" className="border-[#374151] text-xs">
                          <Bike size={12} className="text-[#fbbf24] mr-1" /> Moto
                        </Badge>
                      )}
                      {instructor.teaches_bus && (
                        <Badge variant="outline" className="border-[#374151] text-xs">
                          <Bus size={12} className="text-green-400 mr-1" /> Ônibus
                        </Badge>
                      )}
                      {instructor.teaches_truck && (
                        <Badge variant="outline" className="border-[#374151] text-xs">
                          <Truck size={12} className="text-orange-400 mr-1" /> Caminhão
                        </Badge>
                      )}
                      {instructor.teaches_trailer && (
                        <Badge variant="outline" className="border-[#374151] text-xs">
                          <Truck size={12} className="text-purple-400 mr-1" /> Carreta
                        </Badge>
                      )}
                    </div>

                    {/* Ganhos - visível apenas para admin */}
                    <div className="mt-3 p-2 bg-[#111827] rounded border border-[#374151]">
                      <div className="flex items-center gap-1 text-xs text-[#9ca3af] mb-1">
                        <DollarSign size={12} />
                        <span>Ganhos do Instrutor</span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span>🚗 {earnings.carLessons} aulas = R$ {earnings.carEarnings.toFixed(2)}</span>
                        <span>🏍️ {earnings.motoLessons} aulas = R$ {earnings.motoEarnings.toFixed(2)}</span>
                      </div>
                      <p className="font-bold text-[#fbbf24] mt-1">Total: R$ {earnings.total.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-[#374151]"
                        onClick={() => handleEdit(instructor)}
                      >
                        <Edit size={14} className="mr-1" /> Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-[#374151]"
                        onClick={() => openPasswordDialog(instructor)}
                      >
                        <Lock size={14} className="mr-1" /> Senha
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-500/50 text-red-400"
                        onClick={() => handleDelete(instructor.id)}
                      >
                        <Trash2 size={14} className="mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {instructors.length === 0 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-8 text-center">
            <Users className="mx-auto text-[#9ca3af] mb-4" size={48} />
            <p className="text-[#9ca3af]">Nenhum instrutor cadastrado</p>
            <Button 
              className="bg-[#1e40af] hover:bg-[#3b82f6] mt-4"
              onClick={() => { resetForm(); setShowDialog(true); }}
            >
              <Plus className="mr-2" size={18} />
              Adicionar Instrutor
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={showDialog} onOpenChange={() => { setShowDialog(false); resetForm(); }}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingInstructor ? 'Editar Instrutor' : 'Novo Instrutor'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              <label className="w-24 h-24 rounded-full bg-[#111827] border-2 border-dashed border-[#374151] flex items-center justify-center cursor-pointer overflow-hidden">
                {formData.photo ? (
                  <img src={formData.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="text-[#9ca3af]" />
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>

            <div>
              <Label>Nome Completo *</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone *</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
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

            <div>
              <Label>Biografia</Label>
              <Textarea 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>

            <div>
              <Label className="mb-2 block">Tipos de Aula</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-[#111827] rounded border border-[#374151]">
                  <span className="flex items-center gap-2"><Car size={16} className="text-[#3b82f6]" /> Carro</span>
                  <Switch 
                    checked={formData.teaches_car}
                    onCheckedChange={(checked) => setFormData({...formData, teaches_car: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#111827] rounded border border-[#374151]">
                  <span className="flex items-center gap-2"><Bike size={16} className="text-[#fbbf24]" /> Moto</span>
                  <Switch 
                    checked={formData.teaches_moto}
                    onCheckedChange={(checked) => setFormData({...formData, teaches_moto: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#111827] rounded border border-[#374151]">
                  <span className="flex items-center gap-2"><Bus size={16} className="text-green-400" /> Ônibus</span>
                  <Switch 
                    checked={formData.teaches_bus}
                    onCheckedChange={(checked) => setFormData({...formData, teaches_bus: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#111827] rounded border border-[#374151]">
                  <span className="flex items-center gap-2"><Truck size={16} className="text-orange-400" /> Caminhão</span>
                  <Switch 
                    checked={formData.teaches_truck}
                    onCheckedChange={(checked) => setFormData({...formData, teaches_truck: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#111827] rounded border border-[#374151] col-span-2">
                  <span className="flex items-center gap-2"><Truck size={16} className="text-purple-400" /> Carreta</span>
                  <Switch 
                    checked={formData.teaches_trailer}
                    onCheckedChange={(checked) => setFormData({...formData, teaches_trailer: checked})}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#111827] rounded border border-[#374151]">
              <span>Instrutor Ativo</span>
              <Switch 
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({...formData, active: checked})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-[#374151]" onClick={() => { setShowDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              className="bg-[#1e40af] hover:bg-[#3b82f6]"
              onClick={handleSave}
              disabled={!formData.full_name || !formData.phone}
            >
              <Save className="mr-2" size={18} />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Senha do Instrutor */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>Definir/Alterar Senha do Instrutor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-[#9ca3af]">
              Ao alterar a senha, o instrutor será desconectado na próxima tentativa de acesso.
            </div>
            <div>
              <Label>Nova Senha</Label>
              <Input 
                type="password"
                className="bg-[#111827] border-[#374151] mt-1"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#374151]" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#1e40af] hover:bg-[#3b82f6]" onClick={savePassword} disabled={!newPassword}>
              <Save className="mr-2" size={18} /> Salvar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Dialog de Link de Convite */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>Link de Convite Gerado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[#9ca3af]">
              Compartilhe este link com o instrutor para que ele complete o cadastro:
            </p>
            <div className="p-3 bg-[#111827] rounded border border-[#374151] break-all text-sm">
              {inviteLink}
            </div>
            <Button 
              className="w-full bg-[#f0c41b] text-white hover:bg-[#d4aa00]"
              onClick={copyInviteLink}
            >
              <Copy className="mr-2" size={18} />
              Copiar Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}