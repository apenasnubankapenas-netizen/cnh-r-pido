import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { 
  User, 
  Car, 
  Bike, 
  Phone, 
  MapPin, 
  CreditCard,
  CheckCircle,
  Circle,
  Calendar,
  Clock,
  AlertCircle,
  Edit,
  Save,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const students = await base44.entities.Student.filter({ user_email: user.email });
      
      if (students.length > 0) {
        setStudent(students[0]);
        setEditData(students[0]);
        
        const studentLessons = await base44.entities.Lesson.filter({ student_id: students[0].id });
        setLessons(studentLessons);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await base44.entities.Student.update(student.id, editData);
      setStudent(editData);
      setEditing(false);
    } catch (e) {
      console.log(e);
    }
  };

  const handleStatusUpdate = async (field, value) => {
    try {
      const updateData = { [field]: value };
      await base44.entities.Student.update(student.id, updateData);
      setStudent({ ...student, ...updateData });
      setEditData({ ...editData, ...updateData });
    } catch (e) {
      console.log(e);
    }
  };

  const progressPercentage = () => {
    if (!student) return 0;
    let total = 0;
    let completed = 0;
    
    if (student.total_car_lessons > 0) {
      total += student.total_car_lessons;
      completed += student.completed_car_lessons || 0;
    }
    if (student.total_moto_lessons > 0) {
      total += student.total_moto_lessons;
      completed += student.completed_moto_lessons || 0;
    }
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto text-[#9ca3af] mb-4" size={48} />
        <p className="text-[#9ca3af]">Complete seu cadastro primeiro</p>
      </div>
    );
  }

  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
        </div>
        <Button 
          variant={editing ? "default" : "outline"}
          className={editing ? "bg-green-600 hover:bg-green-700" : "border-[#374151]"}
          onClick={editing ? handleSave : () => setEditing(true)}
        >
          {editing ? (
            <>
              <Save size={18} className="mr-2" />
              Salvar
            </>
          ) : (
            <>
              <Edit size={18} className="mr-2" />
              Editar
            </>
          )}
        </Button>
      </div>

      {/* Dados Pessoais */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="text-[#fbbf24]" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#9ca3af]">Nome Completo</Label>
              {editing ? (
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={editData.full_name}
                  onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                />
              ) : (
                <p className="font-medium mt-1">{student.full_name}</p>
              )}
            </div>
            <div>
              <Label className="text-[#9ca3af]">CPF</Label>
              <p className="font-medium mt-1">{student.cpf}</p>
            </div>
            <div>
              <Label className="text-[#9ca3af]">RENACH</Label>
              <p className="font-medium mt-1 text-[#fbbf24]">{student.renach}</p>
            </div>
            <div>
              <Label className="text-[#9ca3af]">Categoria</Label>
              <p className="font-medium mt-1">{student.category}</p>
            </div>
            <div>
              <Label className="text-[#9ca3af]">WhatsApp</Label>
              {editing ? (
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={editData.whatsapp}
                  onChange={(e) => setEditData({...editData, whatsapp: e.target.value})}
                />
              ) : (
                <p className="font-medium mt-1">{student.whatsapp}</p>
              )}
            </div>
            <div>
              <Label className="text-[#9ca3af]">Telefone</Label>
              {editing ? (
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                />
              ) : (
                <p className="font-medium mt-1">{student.phone || '-'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="text-[#fbbf24]" />
            Progresso das Aulas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Progresso Total</span>
              <span className="text-[#fbbf24]">{progressPercentage()}%</span>
            </div>
            <Progress value={progressPercentage()} className="h-3 bg-[#111827]" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {student.total_car_lessons > 0 && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="flex items-center gap-3 mb-2">
                  <Car className="text-[#3b82f6]" />
                  <span className="font-bold">Aulas de Carro</span>
                </div>
                <p className="text-2xl font-bold">
                  {student.completed_car_lessons || 0}
                  <span className="text-[#9ca3af] text-lg">/{student.total_car_lessons}</span>
                </p>
              </div>
            )}
            
            {student.total_moto_lessons > 0 && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="flex items-center gap-3 mb-2">
                  <Bike className="text-[#fbbf24]" />
                  <span className="font-bold">Aulas de Moto</span>
                </div>
                <p className="text-2xl font-bold">
                  {student.completed_moto_lessons || 0}
                  <span className="text-[#9ca3af] text-lg">/{student.total_moto_lessons}</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status do Processo */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="text-[#fbbf24]" />
            Status do Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#374151]">
              <div className="flex items-center gap-3">
                {student.exam_done ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <Circle className="text-[#374151]" />
                )}
                <span>Exames Médicos</span>
              </div>
              <Checkbox 
                checked={student.exam_done}
                onCheckedChange={(checked) => handleStatusUpdate('exam_done', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#374151]">
              <div className="flex items-center gap-3">
                {student.theoretical_test_done ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <Circle className="text-[#374151]" />
                )}
                <span>Prova Teórica</span>
              </div>
              <Checkbox 
                checked={student.theoretical_test_done}
                onCheckedChange={(checked) => handleStatusUpdate('theoretical_test_done', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#374151]">
              <div className="flex items-center gap-3">
                {student.practical_test_done ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <Circle className="text-[#374151]" />
                )}
                <span>Prova Prática</span>
              </div>
              <Checkbox 
                checked={student.practical_test_done}
                onCheckedChange={(checked) => handleStatusUpdate('practical_test_done', checked)}
              />
            </div>

            {student.all_lessons_completed && !student.admin_confirmed && (
              <div className="p-4 bg-[#fbbf24]/10 border border-[#fbbf24]/50 rounded-lg flex items-center gap-3">
                <AlertCircle className="text-[#fbbf24]" />
                <span className="text-sm">Aguardando confirmação do administrador</span>
              </div>
            )}

            {student.all_lessons_completed && student.admin_confirmed && (
              <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center gap-3">
                <CheckCircle className="text-green-500" />
                <span className="text-sm">Aulas finalizadas com sucesso!</span>
              </div>
            )}

            {!student.all_lessons_completed && (
              <Button 
                className="w-full bg-[#1e40af] hover:bg-[#3b82f6]"
                onClick={() => handleStatusUpdate('all_lessons_completed', true)}
                disabled={progressPercentage() < 100}
              >
                Marcar como Finalizado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Aulas */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="text-[#fbbf24]" />
            Histórico Completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lessons.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lessons.sort((a, b) => new Date(b.date) - new Date(a.date)).map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#374151]">
                  <div className="flex items-center gap-3">
                    {lesson.type === 'carro' ? (
                      <Car className="text-[#3b82f6]" size={20} />
                    ) : (
                      <Bike className="text-[#fbbf24]" size={20} />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(lesson.date).toLocaleDateString('pt-BR')} - {lesson.time}
                      </p>
                      <p className="text-xs text-[#9ca3af]">Instrutor: {lesson.instructor_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${
                      lesson.status === 'realizada' ? 'bg-green-500/20 text-green-400' :
                      lesson.status === 'falta' ? 'bg-red-500/20 text-red-400' :
                      lesson.status === 'agendada' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {lesson.status}
                    </span>
                    {lesson.instructor_comment && (
                      <p className="text-xs text-[#9ca3af] mt-1 max-w-32 truncate">{lesson.instructor_comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#9ca3af]">
              <p>Nenhuma aula registrada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}