import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { 
  Users, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle,
  Car,
  Bike,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const urlParams = new URLSearchParams(window.location.search);
  const studentIdFromUrl = urlParams.get('id');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (studentIdFromUrl && students.length > 0) {
      const student = students.find(s => s.id === studentIdFromUrl);
      if (student) setSelectedStudent(student);
    }
  }, [studentIdFromUrl, students]);

  const loadData = async () => {
    try {
      const [studentsData, lessonsData] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.Lesson.list()
      ]);
      setStudents(studentsData);
      setLessons(lessonsData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.renach?.includes(searchTerm) ||
    s.cpf?.includes(searchTerm)
  );

  const getStudentLessons = (studentId) => {
    return lessons.filter(l => l.student_id === studentId);
  };

  const handleConfirmCompletion = async (student) => {
    try {
      await base44.entities.Student.update(student.id, { admin_confirmed: true });
      loadData();
      setSelectedStudent({ ...student, admin_confirmed: true });
    } catch (e) {
      console.log(e);
    }
  };

  const handleApproveCNH = async (student) => {
    try {
      await base44.entities.Student.update(student.id, { cnh_approved: true });
      loadData();
      setSelectedStudent({ ...student, cnh_approved: true });
    } catch (e) {
      console.log(e);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await base44.entities.Student.update(selectedStudent.id, editData);
      setSelectedStudent({ ...selectedStudent, ...editData });
      setEditing(false);
      loadData();
    } catch (e) {
      console.log(e);
    }
  };

  const openEdit = () => {
    setEditData(selectedStudent);
    setEditing(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  const navigate = useNavigate();

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
            Gerenciar Alunos
          </h1>
        </div>
        <Badge className="bg-[#1e40af]">{students.length} alunos</Badge>
      </div>

      {/* Busca */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]" size={18} />
            <Input 
              className="bg-[#111827] border-[#374151] pl-10"
              placeholder="Buscar por nome, RENACH ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alunos */}
      <div className="grid gap-3">
        {filteredStudents.map((student) => {
          const studentLessons = getStudentLessons(student.id);
          
          return (
            <Card 
              key={student.id} 
              className="bg-[#1a2332] border-[#374151] hover:border-[#3b82f6] transition-all cursor-pointer"
              onClick={() => setSelectedStudent(student)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1e40af]/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#fbbf24]">
                        {student.full_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold">{student.full_name}</p>
                      <p className="text-sm text-[#9ca3af]">
                        RENACH: {student.renach} | Categoria: {student.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {student.exam_done && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">Exames</Badge>
                      )}
                      {student.theoretical_test_done && (
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">Teórica</Badge>
                      )}
                      {student.practical_test_done && (
                        <Badge className="bg-[#fbbf24]/20 text-[#fbbf24] text-xs">Prática</Badge>
                      )}
                    </div>
                    {student.all_lessons_completed && !student.admin_confirmed && (
                      <Badge className="bg-orange-500/20 text-orange-400">Aguardando</Badge>
                    )}
                    <Eye className="text-[#9ca3af]" size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal do Aluno */}
      <Dialog open={!!selectedStudent} onOpenChange={() => { setSelectedStudent(null); setEditing(false); }}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{selectedStudent.full_name}</DialogTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-[#374151]"
                    onClick={editing ? handleSaveEdit : openEdit}
                  >
                    {editing ? <><Save size={16} className="mr-1" /> Salvar</> : <><Edit size={16} className="mr-1" /> Editar</>}
                  </Button>
                </div>
              </DialogHeader>

              <Tabs defaultValue="dados" className="mt-4">
                <TabsList className="bg-[#111827] border border-[#374151]">
                  <TabsTrigger value="dados" className="data-[state=active]:bg-[#1e40af]">Dados</TabsTrigger>
                  <TabsTrigger value="aulas" className="data-[state=active]:bg-[#1e40af]">Aulas</TabsTrigger>
                  <TabsTrigger value="status" className="data-[state=active]:bg-[#1e40af]">Status</TabsTrigger>
                  {selectedStudent.cnh_front_photo && (
                    <TabsTrigger value="documentos" className="data-[state=active]:bg-[#1e40af]">Docs</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="dados" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#9ca3af]">RENACH</Label>
                      <p className="font-medium text-[#fbbf24]">{selectedStudent.renach}</p>
                    </div>
                    <div>
                      <Label className="text-[#9ca3af]">CPF</Label>
                      <p className="font-medium">{selectedStudent.cpf}</p>
                    </div>
                    <div>
                      <Label className="text-[#9ca3af]">Categoria</Label>
                      {editing ? (
                        <Input 
                          className="bg-[#111827] border-[#374151] mt-1"
                          value={editData.category}
                          onChange={(e) => setEditData({...editData, category: e.target.value})}
                        />
                      ) : (
                        <p className="font-medium">{selectedStudent.category}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-[#9ca3af]">CEP</Label>
                      <p className="font-medium">{selectedStudent.cep || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-[#9ca3af]">WhatsApp</Label>
                      <p className="font-medium">{selectedStudent.whatsapp}</p>
                    </div>
                    <div>
                      <Label className="text-[#9ca3af]">Telefone</Label>
                      <p className="font-medium">{selectedStudent.phone || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-[#9ca3af]">Aulas Carro</Label>
                      {editing ? (
                        <Input 
                          type="number"
                          className="bg-[#111827] border-[#374151] mt-1"
                          value={editData.total_car_lessons}
                          onChange={(e) => setEditData({...editData, total_car_lessons: parseInt(e.target.value)})}
                        />
                      ) : (
                        <p className="font-medium">{selectedStudent.completed_car_lessons || 0}/{selectedStudent.total_car_lessons || 0}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-[#9ca3af]">Aulas Moto</Label>
                      {editing ? (
                        <Input 
                          type="number"
                          className="bg-[#111827] border-[#374151] mt-1"
                          value={editData.total_moto_lessons}
                          onChange={(e) => setEditData({...editData, total_moto_lessons: parseInt(e.target.value)})}
                        />
                      ) : (
                        <p className="font-medium">{selectedStudent.completed_moto_lessons || 0}/{selectedStudent.total_moto_lessons || 0}</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="aulas" className="mt-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getStudentLessons(selectedStudent.id).sort((a, b) => new Date(b.date) - new Date(a.date)).map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#374151]">
                        <div className="flex items-center gap-3">
                          {lesson.type === 'carro' ? <Car className="text-[#3b82f6]" size={20} /> : <Bike className="text-[#fbbf24]" size={20} />}
                          <div>
                            <p className="font-medium text-sm">{new Date(lesson.date).toLocaleDateString('pt-BR')} - {lesson.time}</p>
                            <p className="text-xs text-[#9ca3af]">{lesson.instructor_name}</p>
                          </div>
                        </div>
                        <Badge className={
                          lesson.status === 'realizada' ? 'bg-green-500/20 text-green-400' :
                          lesson.status === 'falta' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }>
                          {lesson.status}
                        </Badge>
                      </div>
                    ))}
                    {getStudentLessons(selectedStudent.id).length === 0 && (
                      <p className="text-center py-4 text-[#9ca3af]">Nenhuma aula registrada</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="status" className="mt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#111827] rounded-lg">
                      <div className="flex items-center gap-2">
                        {selectedStudent.exam_done ? <CheckCircle className="text-green-500" /> : <XCircle className="text-[#374151]" />}
                        <span>Exames Médicos</span>
                      </div>
                      <Badge className={selectedStudent.exam_done ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {selectedStudent.exam_done ? 'Concluído' : 'Pendente'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-[#111827] rounded-lg">
                      <div className="flex items-center gap-2">
                        {selectedStudent.theoretical_test_done ? <CheckCircle className="text-green-500" /> : <XCircle className="text-[#374151]" />}
                        <span>Prova Teórica</span>
                      </div>
                      <Badge className={selectedStudent.theoretical_test_done ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {selectedStudent.theoretical_test_done ? 'Concluído' : 'Pendente'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-[#111827] rounded-lg">
                      <div className="flex items-center gap-2">
                        {selectedStudent.practical_test_done ? <CheckCircle className="text-green-500" /> : <XCircle className="text-[#374151]" />}
                        <span>Prova Prática</span>
                      </div>
                      <Badge className={selectedStudent.practical_test_done ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {selectedStudent.practical_test_done ? 'Concluído' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>

                  {selectedStudent.all_lessons_completed && !selectedStudent.admin_confirmed && (
                    <div className="p-4 bg-[#fbbf24]/10 border border-[#fbbf24]/50 rounded-lg">
                      <p className="text-[#fbbf24] mb-3">Aluno marcou as aulas como finalizadas. Confirmar?</p>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleConfirmCompletion(selectedStudent)}
                      >
                        <CheckCircle className="mr-2" size={18} />
                        Confirmar Finalização
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {selectedStudent.cnh_front_photo && (
                  <TabsContent value="documentos" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#9ca3af] mb-2 block">Documento (Frente)</Label>
                        <img src={selectedStudent.cnh_front_photo} alt="Frente" className="w-full rounded-lg border border-[#374151]" />
                      </div>
                      <div>
                        <Label className="text-[#9ca3af] mb-2 block">Documento (Verso)</Label>
                        <img src={selectedStudent.cnh_back_photo} alt="Verso" className="w-full rounded-lg border border-[#374151]" />
                      </div>
                    </div>

                    {!selectedStudent.cnh_approved && (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveCNH(selectedStudent)}
                      >
                        <CheckCircle className="mr-2" size={18} />
                        Aprovar Documentos
                      </Button>
                    )}
                    
                    {selectedStudent.cnh_approved && (
                      <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center gap-2">
                        <CheckCircle className="text-green-500" />
                        <span>Documentos aprovados</span>
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}