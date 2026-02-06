import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useUserPermissions } from '@/lib/useUserPermissions';
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
  ArrowLeft,
  Trash,
  FileText
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
  const [instructorId, setInstructorId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  
  const { user, permissions, metadata } = useUserPermissions();

  const urlParams = new URLSearchParams(window.location.search);
  const studentIdFromUrl = urlParams.get('id');

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    (async () => {
      try { const u = await base44.auth.me(); setUser(u); } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (metadata.instructor) {
      setInstructorId(metadata.instructor.id);
    }
  }, [metadata]);

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

  const filteredStudents = students
    .filter(s => !instructorId || lessons.some(l => l.instructor_id === instructorId && l.student_id === s.id))
    .filter(s => 
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.renach?.includes(searchTerm) ||
      s.cpf?.includes(searchTerm)
    );

  const getStudentLessons = (studentId) => {
    return lessons.filter(l => l.student_id === studentId && (!instructorId || l.instructor_id === instructorId));
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

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    setDeleting(true);
    try {
      await base44.functions.invoke('deleteStudentCascade', { studentId: selectedStudent.id });
      setConfirmDeleteOpen(false);
      setSelectedStudent(null);
      await loadData();
    } finally {
      setDeleting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedStudent) return;
    setExportingPDF(true);
    try {
      const response = await base44.functions.invoke('generateStudentPDF', { 
        studentId: selectedStudent.id 
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aluno_${selectedStudent.full_name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (e) {
      console.log(e);
      alert('Erro ao gerar PDF');
    } finally {
      setExportingPDF(false);
    }
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
                      <p className="font-bold text-[#fbbf24]">{student.full_name}</p>
                      <p className="text-sm text-white">
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
                <DialogTitle className="text-xl text-[#fbbf24]">{selectedStudent.full_name}</DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-2 flex-wrap mb-4">
                <Button 
                  size="sm" 
                  className="bg-[#fbbf24] hover:bg-[#fbbf24]/80 text-black"
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                >
                  <FileText size={16} className="mr-1" />
                  {exportingPDF ? 'Gerando...' : 'Exportar PDF'}
                </Button>
                {user?.email === 'tcnhpara@gmail.com' && (
                  <Button variant="destructive" size="sm" className="text-white" onClick={() => setConfirmDeleteOpen(true)}>
                    <Trash size={16} className="mr-1" /> Apagar
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-[#374151] text-white"
                  onClick={editing ? handleSaveEdit : openEdit}
                >
                  {editing ? <><Save size={16} className="mr-1" /> Salvar</> : <><Edit size={16} className="mr-1" /> Editar</>}
                </Button>
              </div>

              <Tabs defaultValue="dados" className="mt-4">
                <TabsList className="bg-[#111827] border border-[#374151]">
                  <TabsTrigger value="dados" className="data-[state=active]:bg-[#1e40af]">Dados</TabsTrigger>
                  <TabsTrigger value="aulas" className="data-[state=active]:bg-[#1e40af]">Aulas</TabsTrigger>
                  <TabsTrigger value="status" className="data-[state=active]:bg-[#1e40af]">Status</TabsTrigger>
                  {selectedStudent.cnh_front_photo && (
                    <TabsTrigger value="documentos" className="data-[state=active]:bg-[#1e40af]">Docs</TabsTrigger>
                  )}
                  {/* BLOQUEIO: Aba de pagamentos APENAS para autorizados */}
                  {permissions.canViewPayments && (
                    <TabsTrigger value="pagamentos" className="data-[state=active]:bg-[#1e40af]">Pagamentos</TabsTrigger>
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

                    {/* BLOQUEIO: Informações financeiras APENAS para autorizados */}
                    {permissions.canViewPayments && (
                      <>
                        <div>
                          <Label className="text-[#9ca3af]">Total Pago</Label>
                          <p className="font-medium text-green-400">R$ {(selectedStudent.total_paid || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-[#9ca3af]">Status Pagamento</Label>
                          <Badge className={
                            selectedStudent.payment_status === 'pago' ? 'bg-green-500/20 text-green-400' :
                            selectedStudent.payment_status === 'parcial' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }>
                            {selectedStudent.payment_status || 'pendente'}
                          </Badge>
                        </div>
                      </>
                    )}
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
                        className="bg-green-600 hover:bg-green-700 text-white"
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
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
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

                  {/* BLOQUEIO: Aba de pagamentos disponível APENAS para autorizados */}
                  {permissions.canViewPayments && (
                    <TabsContent value="pagamentos" className="mt-4 space-y-4">
                      <div className="space-y-3">
                        <div className="p-3 bg-[#111827] rounded-lg">
                          <Label className="text-[#9ca3af] text-xs">Total Pago</Label>
                          <p className="text-2xl font-bold text-green-400">R$ {(selectedStudent.total_paid || 0).toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-[#111827] rounded-lg">
                          <Label className="text-[#9ca3af] text-xs">Status de Pagamento</Label>
                          <Badge className={
                            selectedStudent.payment_status === 'pago' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                            selectedStudent.payment_status === 'parcial' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                            'bg-red-500/20 text-red-400 border-red-500/50'
                          }>
                            {selectedStudent.payment_status || 'pendente'}
                          </Badge>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                  </Tabs>
                  </>
                  )}
                  </DialogContent>
                  </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>Apagar aluno e todos os dados</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#e5e7eb]">Esta ação é permanente e irá apagar o aluno, todas as aulas agendadas/realizadas, pagamentos, conversas e mensagens.</p>
          <DialogFooter>
            <Button variant="outline" className="border-[#374151] text-white" onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="text-white" onClick={handleDeleteStudent} disabled={deleting}>{deleting ? 'Apagando...' : 'Apagar tudo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}