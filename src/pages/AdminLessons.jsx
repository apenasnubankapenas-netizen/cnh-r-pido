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
  ArrowLeft
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
  const navigate = useNavigate();

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lessonsData, studentsData, instructorsData] = await Promise.all([
        base44.entities.Lesson.list(),
        base44.entities.Student.list(),
        base44.entities.Instructor.list()
      ]);
      setLessons(lessonsData);
      setStudents(studentsData);
      setInstructors(instructorsData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter(l => {
    const dateMatch = !filterDate || l.date === filterDate;
    const instructorMatch = filterInstructor === 'all' || l.instructor_id === filterInstructor;
    const statusMatch = filterStatus === 'all' || l.status === filterStatus;
    return dateMatch && instructorMatch && statusMatch;
  }).sort((a, b) => a.time.localeCompare(b.time));

  const handleStatusChange = async (lesson, newStatus) => {
    try {
      await base44.entities.Lesson.update(lesson.id, { status: newStatus });
      
      // Atualizar contadores do aluno
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="text-[#fbbf24]" />
            Gerenciar Aulas
          </h1>
        </div>
        <Badge className="bg-[#1e40af]">{filteredLessons.length} aulas</Badge>
      </div>

      {/* Filtros */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter size={18} />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Data</Label>
              <Input 
                type="date"
                className="bg-[#111827] border-[#374151] mt-1"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Instrutor</Label>
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
            <div>
              <Label>Status</Label>
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
                    <p className="text-xs text-[#9ca3af]">{new Date(lesson.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center">
                    {lesson.type === 'carro' ? (
                      <Car className="text-[#3b82f6]" />
                    ) : (
                      <Bike className="text-[#fbbf24]" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{lesson.student_name}</p>
                    <p className="text-sm text-[#9ca3af]">
                      RENACH: {lesson.student_renach} | Instrutor: {lesson.instructor_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(lesson.status)}
                  
                  {lesson.status === 'agendada' && (
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
                  <p className="text-xs text-[#9ca3af]">Comentário do instrutor:</p>
                  <p className="text-sm">{lesson.instructor_comment}</p>
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
            <Calendar className="mx-auto text-[#9ca3af] mb-4" size={48} />
            <p className="text-[#9ca3af]">Nenhuma aula encontrada com os filtros selecionados</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Avaliação */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>Avaliar Aula</DialogTitle>
          </DialogHeader>

          {selectedLesson && (
            <div className="space-y-4">
              <div className="p-3 bg-[#111827] rounded border border-[#374151]">
                <p className="font-medium">{selectedLesson.student_name}</p>
                <p className="text-sm text-[#9ca3af]">
                  {new Date(selectedLesson.date).toLocaleDateString('pt-BR')} - {selectedLesson.time}
                </p>
              </div>

              <div>
                <Label>Avaliação da Aula</Label>
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
                <Label>Comentário sobre a Aula</Label>
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
    </div>
  );
}