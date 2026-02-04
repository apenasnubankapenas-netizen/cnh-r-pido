import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { 
  Calendar, 
  Car, 
  Bike, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Filter,
  Edit,
  Save,
  MessageSquare,
  ArrowLeft,
  Trash,
  Camera,
  MapPin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminLessons() {
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterInstructor, setFilterInstructor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [editData, setEditData] = useState({});
  const [editingLesson, setEditingLesson] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', time: '', instructor_id: '' });
  const [editError, setEditError] = useState('');
  const [user, setUser] = useState(null);
  const [instructorId, setInstructorId] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [rescheduleLesson, setRescheduleLesson] = useState(null);
  const [rescheduleAccident, setRescheduleAccident] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  // Provas de presença/falta
  const [proofOpen, setProofOpen] = useState(false);
  const [proofMode, setProofMode] = useState(''); // 'realizada' | 'falta'
  const [proofLesson, setProofLesson] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [startInstructorFile, setStartInstructorFile] = useState(null);
  const [startStudentFile, setStartStudentFile] = useState(null);
  const [endInstructorFile, setEndInstructorFile] = useState(null);
  const [endStudentFile, setEndStudentFile] = useState(null);
  const [absenceInstructorFile, setAbsenceInstructorFile] = useState(null);
  const [absenceLocationFile, setAbsenceLocationFile] = useState(null);
  const [startLoc, setStartLoc] = useState(null);
  const [endLoc, setEndLoc] = useState(null);
  const [absenceLoc, setAbsenceLoc] = useState(null);
  const [openRescheduleAfter, setOpenRescheduleAfter] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        setIsSuperadmin(u?.role === 'admin' && u?.email === 'tcnhpara@gmail.com');
        const ins = u ? await base44.entities.Instructor.filter({ user_email: u.email }) : [];
        if (ins.length > 0) { setIsInstructor(true); setInstructorId(ins[0].id); }
      } catch (e) {}
    })();
  }, []);

  const loadData = async () => {
    try {
      const [lessonsData, studentsData, instructorsData] = await Promise.all([
        base44.entities.Lesson.list(),
        base44.entities.Student.list(),
        base44.entities.Instructor.list()
      ]);
      setLessons((lessonsData || []).filter(l => !l.trial));
      setStudents(studentsData);
      setInstructors(instructorsData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // Edição de aulas (vendedores podem remarcar/alterar instrutor/excluir)
  const validateConflicts = (newDate, newTime, newInstructorId, lessonId) => {
    const conflictInstructor = lessons.some(l =>
      l.id !== lessonId &&
      l.instructor_id === newInstructorId &&
      l.date === newDate &&
      l.time === newTime &&
      l.status !== 'cancelada'
    );
    if (conflictInstructor) return 'Conflito: instrutor já possui aula neste horário.';

    const current = lessons.find(l => l.id === lessonId);
    if (current) {
      const conflictStudent = lessons.some(l =>
        l.id !== lessonId &&
        l.student_id === current.student_id &&
        l.date === newDate &&
        l.time === newTime &&
        l.status !== 'cancelada'
      );
      if (conflictStudent) return 'Conflito: aluno já possui aula neste horário.';
    }
    return null;
  };

  const handleOpenEdit = (lesson) => {
    setEditingLesson(lesson);
    setEditForm({ date: lesson.date, time: lesson.time, instructor_id: lesson.instructor_id });
    setEditError('');
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;
    const err = validateConflicts(editForm.date, editForm.time, editForm.instructor_id, editingLesson.id);
    if (err) { setEditError(err); return; }
    const instr = instructors.find(i => i.id === editForm.instructor_id);
    const payload = {
      date: editForm.date,
      time: editForm.time,
      instructor_id: editForm.instructor_id,
      instructor_name: instr ? instr.full_name : editingLesson.instructor_name
    };
    await base44.entities.Lesson.update(editingLesson.id, payload);
    setEditingLesson(null);
    loadData();
  };

  const handleDeleteLesson = async () => {
    if (!editingLesson) return;
    await base44.entities.Lesson.delete(editingLesson.id);
    setEditingLesson(null);
    loadData();
  };

  const filteredLessons = lessons.filter(l => {
    const dateMatch = viewMode === 'list' || !filterDate || l.date === filterDate;
    const instructorFilterMatch = filterInstructor === 'all' || l.instructor_id === filterInstructor;
    const instructorScopeMatch = !isInstructor || l.instructor_id === instructorId;
    const statusMatch = filterStatus === 'all' || l.status === filterStatus;
    return dateMatch && instructorFilterMatch && statusMatch && instructorScopeMatch;
  }).sort((a, b) => {
    // Ordenar por data e depois por horário
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  const handleStatusChange = async (lesson, newStatus) => {
    try {
      if (['realizada','falta'].includes(newStatus) && isInstructor) {
        setProofLesson(lesson);
        setProofMode(newStatus);
        setProofOpen(true);
        setOpenRescheduleAfter(newStatus === 'falta');
        return;
      }

      await base44.entities.Lesson.update(lesson.id, { status: newStatus });
      if (newStatus === 'realizada') {
        const student = students.find(s => s.id === lesson.student_id);
        if (student) {
          const updateField = lesson.type === 'carro' ? 'completed_car_lessons' : 'completed_moto_lessons';
          const currentValue = student[updateField] || 0;
          await base44.entities.Student.update(student.id, { [updateField]: currentValue + 1 });
        }
      }
      loadData();
    } catch (e) {
      console.log(e);
    }
  };

  const isNextDay = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tStr = tomorrow.toISOString().split('T')[0];
    return dateStr === tStr;
  };

  const handleSaveComment = async () => {
    try {
      await base44.entities.Lesson.update(selectedLesson.id, {
        instructor_comment: editData.instructor_comment,
        instructor_rating: editData.instructor_rating
      });
      setSelectedLesson(null);
      loadData();
    } catch (e) {
      console.log(e);
    }
  };

  // Helpers para localização e upload
  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Sem geolocalização'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const submitProofRealizada = async () => {
    if (!proofLesson) return;
    if (!startInstructorFile || !startStudentFile || !endInstructorFile || !endStudentFile || !startLoc || !endLoc) return;
    setProofLoading(true);
    try {
      const [startInstr, startStud, endInstr, endStud] = await Promise.all([
        base44.integrations.Core.UploadFile({ file: startInstructorFile }),
        base44.integrations.Core.UploadFile({ file: startStudentFile }),
        base44.integrations.Core.UploadFile({ file: endInstructorFile }),
        base44.integrations.Core.UploadFile({ file: endStudentFile })
      ]);
      const payload = {
        start_instructor_photo_url: startInstr.file_url,
        start_student_photo_url: startStud.file_url,
        start_photos_timestamp: new Date().toISOString(),
        start_lat: startLoc.lat,
        start_lng: startLoc.lng,
        end_instructor_photo_url: endInstr.file_url,
        end_student_photo_url: endStud.file_url,
        end_photos_timestamp: new Date().toISOString(),
        end_lat: endLoc.lat,
        end_lng: endLoc.lng,
        status: 'realizada'
      };
      await base44.entities.Lesson.update(proofLesson.id, payload);
      const student = students.find(s => s.id === proofLesson.student_id);
      if (student) {
        const updateField = proofLesson.type === 'carro' ? 'completed_car_lessons' : 'completed_moto_lessons';
        const currentValue = student[updateField] || 0;
        await base44.entities.Student.update(student.id, { [updateField]: currentValue + 1 });
      }
      const subject = `Registro de aula REALIZADA - ${proofLesson.student_name} - ${proofLesson.date} ${proofLesson.time}`;
      const body = `Aula REALIZADA\nAluno: ${proofLesson.student_name} (RENACH ${proofLesson.student_renach})\nInstrutor: ${proofLesson.instructor_name}\nData/Hora: ${proofLesson.date} ${proofLesson.time}\n\nCheck-in (início)\nSelfie instrutor: ${payload.start_instructor_photo_url}\nFoto aluno: ${payload.start_student_photo_url}\nLocal: ${payload.start_lat}, ${payload.start_lng}\nHora registro: ${payload.start_photos_timestamp}\n\nCheck-out (término)\nSelfie instrutor: ${payload.end_instructor_photo_url}\nFoto aluno: ${payload.end_student_photo_url}\nLocal: ${payload.end_lat}, ${payload.end_lng}\nHora registro: ${payload.end_photos_timestamp}`;
      await base44.integrations.Core.SendEmail({ to: 'tcnhpara@gmail.com', subject, body });
      setProofOpen(false);
      setProofLesson(null);
      setStartInstructorFile(null); setStartStudentFile(null); setEndInstructorFile(null); setEndStudentFile(null);
      setStartLoc(null); setEndLoc(null);
      loadData();
    } catch (e) { console.log(e); }
    finally { setProofLoading(false); }
  };

  const submitProofFalta = async () => {
    if (!proofLesson) return;
    if (!absenceInstructorFile || !absenceLocationFile || !absenceLoc) return;
    setProofLoading(true);
    try {
      const [instr, spot] = await Promise.all([
        base44.integrations.Core.UploadFile({ file: absenceInstructorFile }),
        base44.integrations.Core.UploadFile({ file: absenceLocationFile })
      ]);
      const payload = {
        absence_instructor_photo_url: instr.file_url,
        absence_location_photo_url: spot.file_url,
        absence_photos_timestamp: new Date().toISOString(),
        absence_lat: absenceLoc.lat,
        absence_lng: absenceLoc.lng,
        status: 'falta'
      };
      await base44.entities.Lesson.update(proofLesson.id, payload);
      const subject = `Registro de aula FALTA - ${proofLesson.student_name} - ${proofLesson.date} ${proofLesson.time}`;
      const body = `Aula marcada como FALTA\nAluno: ${proofLesson.student_name} (RENACH ${proofLesson.student_renach})\nInstrutor: ${proofLesson.instructor_name}\nData/Hora: ${proofLesson.date} ${proofLesson.time}\n\nEvidências:\nSelfie instrutor: ${payload.absence_instructor_photo_url}\nFoto do local: ${payload.absence_location_photo_url}\nLocal: ${payload.absence_lat}, ${payload.absence_lng}\nHora registro: ${payload.absence_photos_timestamp}`;
      await base44.integrations.Core.SendEmail({ to: 'tcnhpara@gmail.com', subject, body });
      setProofOpen(false);
      setProofLesson(null);
      setAbsenceInstructorFile(null); setAbsenceLocationFile(null); setAbsenceLoc(null);
      loadData();
      if (openRescheduleAfter) {
        setRescheduleLesson(proofLesson);
        setRescheduleAccident(false);
        setRescheduleDate('');
        setRescheduleTime('');
        setRescheduleOpen(true);
      }
    } catch (e) { console.log(e); }
    finally { setProofLoading(false); }
  };

  const getStatusBadge = (status) => {
    const configs = {
      agendada: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', icon: Clock },
      realizada: { color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: CheckCircle },
      falta: { color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: XCircle },
      cancelada: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/50', icon: XCircle },
      remarcada: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: AlertCircle },
    };
    const config = configs[status] || configs.agendada;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon size={12} />
        {status}
      </Badge>
    );
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
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Calendar className="text-[#fbbf24]" />
            Gerenciar Aulas
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              className={viewMode === 'calendar' ? 'bg-[#fbbf24] text-black' : 'border-[#374151] text-white'}
              onClick={() => setViewMode('calendar')}
            >
              Dia
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              className={viewMode === 'list' ? 'bg-[#fbbf24] text-black' : 'border-[#374151] text-white'}
              onClick={() => setViewMode('list')}
            >
              Todas
            </Button>
          </div>
          <Badge className="bg-[#1e40af] text-white">{filteredLessons.length} aulas</Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Filter size={18} className="text-[#fbbf24]" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {viewMode === 'calendar' && (
              <div>
                <Label className="text-white">Data</Label>
                <Input 
                  type="date"
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            )}
            {!isInstructor && (
              <div>
                <Label className="text-white">Instrutor</Label>
                <Select value={filterInstructor} onValueChange={setFilterInstructor}>
                  <SelectTrigger className="bg-[#111827] border-[#374151] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-[#374151]">
                    <SelectItem value="all">Todos</SelectItem>
                    {instructors.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-white">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-[#111827] border-[#374151] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#374151]">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                  <SelectItem value="falta">Falta</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Aulas */}
      <div className="space-y-3">
        {filteredLessons.map((lesson) => (
          <Card key={lesson.id} className="bg-[#1a2332] border-[#374151]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-2xl font-bold text-[#fbbf24]">{lesson.time}</p>
                    <p className="text-xs text-white">{new Date(lesson.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center">
                    {lesson.type === 'carro' ? (
                      <Car className="text-[#3b82f6]" />
                    ) : (
                      <Bike className="text-[#fbbf24]" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white">{lesson.student_name}</p>
                    <p className="text-sm text-white">
                      RENACH: {lesson.student_renach} | Instrutor: {lesson.instructor_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(lesson.status)}
                  
                  {lesson.status === 'agendada' && (new Date(`${lesson.date}T${lesson.time}:00`) <= new Date()) && (
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusChange(lesson, 'realizada')}
                      >
                        <CheckCircle size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleStatusChange(lesson, 'falta')}
                      >
                        <XCircle size={14} />
                      </Button>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-[#374151]"
                    disabled={isNextDay(lesson.date)}
                    onClick={() => { if (isNextDay(lesson.date)) return; handleOpenEdit(lesson); }}
                  >
                    <Edit size={14} className="mr-1" />
                    Editar
                  </Button>

                  {isSuperadmin && isNextDay(lesson.date) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className=""
                      onClick={async () => {
                        if (!confirm('Confirmar exclusão desta aula do dia seguinte?')) return;
                        await base44.entities.Lesson.delete(lesson.id);
                        loadData();
                      }}
                    >
                      <Trash size={14} className="mr-1" />
                      Excluir
                    </Button>
                  )}

                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="border-[#374151]"
                     onClick={() => {
                      setSelectedLesson(lesson);
                      setEditData({
                        instructor_comment: lesson.instructor_comment || '',
                        instructor_rating: lesson.instructor_rating || ''
                      });
                    }}
                  >
                    <MessageSquare size={14} className="mr-1" />
                    Avaliar
                  </Button>
                </div>
              </div>

              {lesson.instructor_comment && (
                <div className="mt-3 p-2 bg-[#111827] rounded border border-[#374151]">
                  <p className="text-xs text-[#fbbf24]">Comentário do instrutor:</p>
                  <p className="text-sm text-white">{lesson.instructor_comment}</p>
                  {lesson.instructor_rating && (
                    <Badge className="mt-1 bg-[#1e40af]/20 text-[#3b82f6]">
                      Avaliação: {lesson.instructor_rating}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-8 text-center">
            <Calendar className="mx-auto text-[#fbbf24] mb-4" size={48} />
            <p className="text-white">Nenhuma aula encontrada com os filtros selecionados</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Edição de Aula */}
      <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Aula</DialogTitle>
          </DialogHeader>

          {editingLesson && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white">Data</Label>
                  <Input
                    type="date"
                    className="bg-[#111827] border-[#374151] mt-1"
                    disabled={isNextDay(editingLesson?.date)}
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-white">Horário</Label>
                  <Input
                    type="time"
                    className="bg-[#111827] border-[#374151] mt-1"
                    disabled={isNextDay(editingLesson?.date)}
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-white">Instrutor</Label>
                  <Select
                    value={editForm.instructor_id}
                    onValueChange={(value) => setEditForm({ ...editForm, instructor_id: value })}
                    disabled={isNextDay(editingLesson?.date)}
                  >
                    <SelectTrigger className="bg-[#111827] border-[#374151] mt-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2332] border-[#374151]">
                      {instructors.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editError && (
                <div className="p-2 text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded">
                  {editError}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex w-full justify-between">
            <Button variant="destructive" onClick={handleDeleteLesson} disabled={!isSuperadmin}>
              <Trash className="mr-2" size={18} />
              Excluir Aula
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="border-[#374151]" onClick={() => setEditingLesson(null)}>
                Cancelar
              </Button>
              <Button className="bg-[#1e40af] hover:bg-[#3b82f6]" onClick={handleUpdateLesson} disabled={isNextDay(editingLesson?.date)}>
                <Save className="mr-2" size={18} />
                Salvar Alterações
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Avaliação */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Avaliar Aula</DialogTitle>
          </DialogHeader>

          {selectedLesson && (
            <div className="space-y-4">
              <div className="p-3 bg-[#111827] rounded border border-[#374151]">
                <p className="font-medium text-white">{selectedLesson.student_name}</p>
                <p className="text-sm text-white">
                  {new Date(selectedLesson.date).toLocaleDateString('pt-BR')} - {selectedLesson.time}
                </p>
              </div>

              <div>
                <Label className="text-white">Avaliação da Aula</Label>
                <Select 
                  value={editData.instructor_rating} 
                  onValueChange={(value) => setEditData({...editData, instructor_rating: value})}
                >
                  <SelectTrigger className="bg-[#111827] border-[#374151] mt-1">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-[#374151]">
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="boa">Boa</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="ruim">Precisa Melhorar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Comentário sobre a Aula</Label>
                <Textarea 
                  className="bg-[#111827] border-[#374151] mt-1"
                  placeholder="Observações sobre o desempenho do aluno..."
                  value={editData.instructor_comment}
                  onChange={(e) => setEditData({...editData, instructor_comment: e.target.value})}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="border-[#374151]" onClick={() => setSelectedLesson(null)}>
              Cancelar
            </Button>
            <Button className="bg-[#1e40af] hover:bg-[#3b82f6]" onClick={handleSaveComment}>
              <Save className="mr-2" size={18} />
              Salvar Avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Comprovação de Aula */}
      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Comprovação de aula ({proofMode})</DialogTitle>
          </DialogHeader>

          {proofMode === 'realizada' && (
            <div className="space-y-6">
              <div className="p-3 bg-[#111827] rounded border border-[#374151]">
                <p className="font-bold mb-2 text-white">Check-in (início)</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white">Selfie do instrutor</label>
                    <input type="file" accept="image/*" capture="user" className="mt-1" onChange={async (e)=>{const f=e.target.files?.[0]; if(f){ setStartInstructorFile(f); try{ const loc=await getLocation(); setStartLoc(loc);}catch{}}}} />
                  </div>
                  <div>
                    <label className="text-sm text-[#9ca3af]">Foto do aluno</label>
                    <input type="file" accept="image/*" capture="user" className="mt-1" onChange={async (e)=>{const f=e.target.files?.[0]; if(f){ setStartStudentFile(f); if(!startLoc){ try{ const loc=await getLocation(); setStartLoc(loc);}catch{}}}}} />
                  </div>
                </div>
                {startLoc && (
                  <div className="text-xs text-[#9ca3af] mt-2 flex items-center gap-1"><MapPin size={14}/> {startLoc.lat.toFixed(5)}, {startLoc.lng.toFixed(5)}</div>
                )}
              </div>

              <div className="p-3 bg-[#111827] rounded border border-[#374151]">
                <p className="font-bold mb-2 text-white">Check-out (término)</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white">Selfie do instrutor</label>
                    <input type="file" accept="image/*" capture="user" className="mt-1" onChange={async (e)=>{const f=e.target.files?.[0]; if(f){ setEndInstructorFile(f); try{ const loc=await getLocation(); setEndLoc(loc);}catch{}}}} />
                  </div>
                  <div>
                    <label className="text-sm text-[#9ca3af]">Foto do aluno</label>
                    <input type="file" accept="image/*" capture="user" className="mt-1" onChange={async (e)=>{const f=e.target.files?.[0]; if(f){ setEndStudentFile(f); if(!endLoc){ try{ const loc=await getLocation(); setEndLoc(loc);}catch{}}}}} />
                  </div>
                </div>
                {endLoc && (
                  <div className="text-xs text-[#9ca3af] mt-2 flex items-center gap-1"><MapPin size={14}/> {endLoc.lat.toFixed(5)}, {endLoc.lng.toFixed(5)}</div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" className="border-[#374151]" onClick={()=>setProofOpen(false)}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={submitProofRealizada} disabled={proofLoading || !startInstructorFile || !startStudentFile || !endInstructorFile || !endStudentFile || !startLoc || !endLoc}>
                  <Camera className="mr-2" size={18}/> Registrar Aula
                </Button>
              </DialogFooter>
            </div>
          )}

          {proofMode === 'falta' && (
            <div className="space-y-6">
              <div className="p-3 bg-[#111827] rounded border border-[#374151]">
                <p className="font-bold mb-2 text-white">Evidências de falta</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white">Selfie do instrutor</label>
                    <input type="file" accept="image/*" capture="user" className="mt-1" onChange={async (e)=>{const f=e.target.files?.[0]; if(f){ setAbsenceInstructorFile(f); try{ const loc=await getLocation(); setAbsenceLoc(loc);}catch{}}}} />
                  </div>
                  <div>
                    <label className="text-sm text-white">Foto do local (carro/moto/ponto)</label>
                    <input type="file" accept="image/*" capture="environment" className="mt-1" onChange={async (e)=>{const f=e.target.files?.[0]; if(f){ setAbsenceLocationFile(f); if(!absenceLoc){ try{ const loc=await getLocation(); setAbsenceLoc(loc);}catch{}}}}} />
                  </div>
                </div>
                {absenceLoc && (
                  <div className="text-xs text-[#9ca3af] mt-2 flex items-center gap-1"><MapPin size={14}/> {absenceLoc.lat.toFixed(5)}, {absenceLoc.lng.toFixed(5)}</div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" className="border-[#374151]" onClick={()=>setProofOpen(false)}>Cancelar</Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={submitProofFalta} disabled={proofLoading || !absenceInstructorFile || !absenceLocationFile || !absenceLoc}>
                  <Camera className="mr-2" size={18}/> Registrar Falta
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Faltou / Remarcação */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmar presença da aula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-white">Marque se houve acidente/imprevisto para remarcação gratuita.</p>
            <div className="flex items-center gap-2">
              <input
                id="accident"
                type="checkbox"
                className="h-4 w-4"
                checked={rescheduleAccident}
                onChange={(e) => setRescheduleAccident(e.target.checked)}
              />
              <label htmlFor="accident" className="text-sm text-white">Foi acidente/imprevisto?</label>
            </div>
            {rescheduleAccident && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Nova data</Label>
                  <Input type="date" className="bg-[#111827] border-[#374151] mt-1" value={rescheduleDate} onChange={(e)=>setRescheduleDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-white">Novo horário</Label>
                  <Input type="time" className="bg-[#111827] border-[#374151] mt-1" value={rescheduleTime} onChange={(e)=>setRescheduleTime(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#374151]" onClick={() => setRescheduleOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1e40af] hover:bg-[#3b82f6]" onClick={async ()=>{
              if (!rescheduleLesson) { setRescheduleOpen(false); return; }
              try {
                if (rescheduleAccident && rescheduleDate && rescheduleTime) {
                  await base44.entities.Lesson.update(rescheduleLesson.id, { status: 'remarcada' });
                  await base44.entities.Lesson.create({
                    student_id: rescheduleLesson.student_id,
                    student_name: rescheduleLesson.student_name,
                    student_renach: rescheduleLesson.student_renach,
                    instructor_id: rescheduleLesson.instructor_id,
                    instructor_name: rescheduleLesson.instructor_name,
                    date: rescheduleDate,
                    time: rescheduleTime,
                    type: rescheduleLesson.type,
                    status: 'agendada'
                  });
                } else {
                  await base44.entities.Lesson.update(rescheduleLesson.id, { status: 'falta' });
                }
              } catch (e) { console.log(e); }
              finally {
                setRescheduleOpen(false);
                setRescheduleLesson(null);
                setRescheduleAccident(false);
                setRescheduleDate('');
                setRescheduleTime('');
                loadData();
              }
            }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}