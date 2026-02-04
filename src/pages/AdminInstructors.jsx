import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  ArrowLeft,
  Lock
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
      await base44.entities.InstructorInvite.create({
        token,
        used: false
      });
      
      const base = new URL(window.location.origin + createPageUrl('InstructorRegister'));
      base.searchParams.set('token', token);
      const link = base.toString();
      setInviteLink(link);
      // também copia automaticamente para facilitar
      navigator.clipboard.writeText(link).catch(()=>{});
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
        {user?.email === 'tcnhpara@gmail.com' && (
          <Button 
            className="bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
            onClick={generateInviteLink}
          >
            <LinkIcon className="mr-2" size={18} />
            Gerar Link de Convite
          </Button>
        )}
      </div>

      {/* Lista de Instrutores */}
      <div className="grid md:grid-cols-2 gap-4">
        {instructors.filter((i) => !i.registration_token && i.cpf !== 'pendente' && i.full_name !== 'Pendente').map((instructor) => {
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
                      <h3 className="font-bold text-white">{instructor.full_name}</h3>
                      <Badge className={instructor.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {instructor.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-white">{instructor.phone}</p>

                    <div className="flex gap-2 mt-2 flex-wrap">
                      {instructor.teaches_car && (
                        <Badge variant="outline" className="border-[#374151] text-xs text-white">
                          <Car size={12} className="text-[#3b82f6] mr-1" /> Carro
                        </Badge>
                      )}
                      {instructor.teaches_moto && (
                        <Badge variant="outline" className="border-[#374151] text-xs text-white">
                          <Bike size={12} className="text-[#fbbf24] mr-1" /> Moto
                        </Badge>
                      )}
                      {instructor.teaches_bus && (
                        <Badge variant="outline" className="border-[#374151] text-xs text-white">
                          <Bus size={12} className="text-green-400 mr-1" /> Ônibus
                        </Badge>
                      )}
                      {instructor.teaches_truck && (
                        <Badge variant="outline" className="border-[#374151] text-xs text-white">
                          <Truck size={12} className="text-orange-400 mr-1" /> Caminhão
                        </Badge>
                      )}
                      {instructor.teaches_trailer && (
                        <Badge variant="outline" className="border-[#374151] text-xs text-white">
                          <Truck size={12} className="text-purple-400 mr-1" /> Carreta
                        </Badge>
                      )}
                    </div>

                    {/* Ganhos - visível apenas para admin */}
                    <div className="mt-3 p-2 bg-[#111827] rounded border border-[#374151]">
                      <div className="flex items-center gap-1 text-xs text-[#fbbf24] mb-1">
                        <DollarSign size={12} />
                        <span>Ganhos do Instrutor</span>
                      </div>
                      <div className="flex gap-4 text-sm text-white">
                        <span>🚗 {earnings.carLessons} aulas = R$ {earnings.carEarnings.toFixed(2)}</span>
                        <span>🏍️ {earnings.motoLessons} aulas = R$ {earnings.motoEarnings.toFixed(2)}</span>
                      </div>
                      <p className="font-bold text-[#fbbf24] mt-1">Total: R$ {earnings.total.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Link to={`${createPageUrl('InstructorProfile')}?id=${instructor.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-[#fbbf24] text-[#fbbf24]"
                        >
                          Perfil
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-[#374151] text-white"
                        onClick={() => handleEdit(instructor)}
                      >
                        <Edit size={14} className="mr-1" /> Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-[#374151] text-white"
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

          </CardContent>
        </Card>
      )}



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
            <Button className="bg-[#f0c41b] text-black hover:bg-[#d4aa00]" onClick={savePassword} disabled={!newPassword}>
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