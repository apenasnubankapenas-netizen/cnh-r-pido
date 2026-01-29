import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Calendar, 
  Car, 
  Bike, 
  Clock, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function MyLessons() {
  const [student, setStudent] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedType, setSelectedType] = useState('carro');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const students = await base44.entities.Student.filter({ user_email: user.email });
      
      if (students.length > 0) {
        setStudent(students[0]);
        const studentLessons = await base44.entities.Lesson.filter({ student_id: students[0].id });
        setLessons(studentLessons);
      }

      const allInstructors = await base44.entities.Instructor.filter({ active: true });
      setInstructors(allInstructors);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [];
  for (let hour = 6; hour < 20; hour++) {
    for (let min = 0; min < 60; min += 60) {
      const startHour = hour;
      const startMin = min === 0 ? '40' : '00';
      if (hour === 6 && min === 0) {
        timeSlots.push('06:40');
      } else if (hour > 6) {
        const prevEnd = hour;
        const slot = `${String(prevEnd).padStart(2, '0')}:${min === 0 ? '00' : '00'}`;
        if (hour < 20) timeSlots.push(slot);
      }
    }
  }
  
  const generateTimeSlots = () => {
    const slots = [];
    let currentTime = 6 * 60 + 40; // 06:40 em minutos
    const endTime = 20 * 60; // 20:00 em minutos
    
    while (currentTime < endTime) {
      const hours = Math.floor(currentTime / 60);
      const mins = currentTime % 60;
      slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
      currentTime += 60; // 50 min aula + 10 min intervalo
    }
    return slots;
  };

  const availableTimeSlots = generateTimeSlots();

  const filteredInstructors = instructors.filter(i => {
    // Filtrar por especialidade
    let matchesType = false;
    if (selectedType === 'carro') matchesType = i.teaches_car;
    if (selectedType === 'moto') matchesType = i.teaches_moto;
    if (selectedType === 'onibus') matchesType = i.teaches_bus;
    if (selectedType === 'caminhao') matchesType = i.teaches_truck;
    if (selectedType === 'carreta') matchesType = i.teaches_trailer;
    
    if (!matchesType) return false;
    
    // Filtrar: se aluno já tem instrutor para esse tipo, só mostrar esse instrutor
    const existingCarInstructor = lessons.find(l => l.type === 'carro' && (l.status === 'agendada' || l.status === 'realizada'));
    if (selectedType === 'carro' && existingCarInstructor) {
      return i.id === existingCarInstructor.instructor_id;
    }
    
    const existingMotoInstructor = lessons.find(l => l.type === 'moto' && (l.status === 'agendada' || l.status === 'realizada'));
    if (selectedType === 'moto' && existingMotoInstructor) {
      return i.id === existingMotoInstructor.instructor_id;
    }
    
    return true;
  });

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedInstructor) return;
    
    try {
      // Contar aulas agendadas + realizadas por tipo
      const carLessonsCount = lessons.filter(l => 
        l.type === 'carro' && (l.status === 'agendada' || l.status === 'realizada')
      ).length;
      
      const motoLessonsCount = lessons.filter(l => 
        l.type === 'moto' && (l.status === 'agendada' || l.status === 'realizada')
      ).length;
      
      // Verificar limite
      if (selectedType === 'carro' && carLessonsCount >= (student.total_car_lessons || 0)) {
        alert('Você já agendou todas as aulas de carro disponíveis. Contrate mais aulas para continuar.');
        return;
      }
      
      if (selectedType === 'moto' && motoLessonsCount >= (student.total_moto_lessons || 0)) {
        alert('Você já agendou todas as aulas de moto disponíveis. Contrate mais aulas para continuar.');
        return;
      }
      
      // REGRA: Aluno deve manter o mesmo instrutor para carro
      const existingCarInstructor = lessons.find(l => l.type === 'carro' && (l.status === 'agendada' || l.status === 'realizada'));
      if (selectedType === 'carro' && existingCarInstructor && existingCarInstructor.instructor_id !== selectedInstructor) {
        alert(`Você já está fazendo aulas de carro com ${existingCarInstructor.instructor_name}. Não é permitido trocar de instrutor.`);
        return;
      }
      
      // REGRA: Aluno deve manter o mesmo instrutor para moto
      const existingMotoInstructor = lessons.find(l => l.type === 'moto' && (l.status === 'agendada' || l.status === 'realizada'));
      if (selectedType === 'moto' && existingMotoInstructor && existingMotoInstructor.instructor_id !== selectedInstructor) {
        alert(`Você já está fazendo aulas de moto com ${existingMotoInstructor.instructor_name}. Não é permitido trocar de instrutor.`);
        return;
      }
      
      // REGRA: Verificar conflito de horário - buscar todas as aulas desse instrutor
      const allLessons = await base44.entities.Lesson.filter({ 
        instructor_id: selectedInstructor,
        date: selectedDate,
        time: selectedTime,
        status: 'agendada'
      });
      
      if (allLessons.length > 0) {
        alert('Este horário já está ocupado com outro aluno. Por favor, escolha outro horário ou outro instrutor.');
        return;
      }
      
      const instructor = instructors.find(i => i.id === selectedInstructor);
      await base44.entities.Lesson.create({
        student_id: student.id,
        student_name: student.full_name,
        student_renach: student.renach,
        instructor_id: selectedInstructor,
        instructor_name: instructor.full_name,
        date: selectedDate,
        time: selectedTime,
        type: selectedType,
        status: 'agendada',
        notified: false
      });
      
      setShowScheduleDialog(false);
      loadData();
      alert('Aula agendada com sucesso!');
    } catch (e) {
      console.log(e);
      alert('Erro ao agendar aula. Tente novamente.');
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isDateBooked = (date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return lessons.some(l => l.date === dateStr);
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
        <p className="text-[#9ca3af]">Complete seu cadastro primeiro</p>
      </div>
    );
  }

  const upcomingLessons = lessons.filter(l => l.status === 'agendada').sort((a, b) => new Date(a.date) - new Date(b.date));
  const pastLessons = lessons.filter(l => l.status !== 'agendada').sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Minhas Aulas</h1>
        <Button 
          className="bg-[#1e40af] hover:bg-[#3b82f6]"
          onClick={() => {
            const carLessonsCount = lessons.filter(l => 
              l.type === 'carro' && (l.status === 'agendada' || l.status === 'realizada')
            ).length;
            
            const motoLessonsCount = lessons.filter(l => 
              l.type === 'moto' && (l.status === 'agendada' || l.status === 'realizada')
            ).length;
            
            const totalPurchased = (student.total_car_lessons || 0) + (student.total_moto_lessons || 0);
            const totalUsed = carLessonsCount + motoLessonsCount;
            
            if (totalUsed >= totalPurchased) {
              alert('Você já utilizou todas as suas aulas. Contrate mais aulas para continuar agendando.');
              return;
            }
            
            setShowScheduleDialog(true);
          }}
        >
          <Calendar className="mr-2" size={18} />
          Agendar Nova Aula
        </Button>
      </div>

      {/* Status das Aulas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4 text-center">
            <Car className="mx-auto text-[#3b82f6] mb-2" />
            <p className="text-2xl font-bold">{student.completed_car_lessons || 0}/{student.total_car_lessons || 0}</p>
            <p className="text-xs text-[#9ca3af]">Aulas Carro</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4 text-center">
            <Bike className="mx-auto text-[#fbbf24] mb-2" />
            <p className="text-2xl font-bold">{student.completed_moto_lessons || 0}/{student.total_moto_lessons || 0}</p>
            <p className="text-xs text-[#9ca3af]">Aulas Moto</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{upcomingLessons.length}</p>
            <p className="text-xs text-[#9ca3af]">Agendadas</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto text-green-400 mb-2" />
            <p className="text-2xl font-bold">{lessons.filter(l => l.status === 'realizada').length}</p>
            <p className="text-xs text-[#9ca3af]">Realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Próximas Aulas */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="text-[#fbbf24]" />
            Próximas Aulas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingLessons.length > 0 ? (
            <div className="space-y-3">
              {upcomingLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-[#111827] rounded-lg border border-[#374151]">
                  <div className="flex items-center gap-4">
                    {lesson.type === 'carro' ? (
                      <Car className="text-[#3b82f6]" size={32} />
                    ) : (
                      <Bike className="text-[#fbbf24]" size={32} />
                    )}
                    <div>
                      <p className="font-bold">Aula de {lesson.type === 'carro' ? 'Carro' : 'Moto'}</p>
                      <p className="text-sm text-[#9ca3af]">
                        <User className="inline mr-1" size={14} />
                        {lesson.instructor_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{new Date(lesson.date).toLocaleDateString('pt-BR')}</p>
                    <p className="text-[#fbbf24]">{lesson.time}</p>
                  </div>
                  {getStatusBadge(lesson.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#9ca3af]">
              <Calendar className="mx-auto mb-2" size={32} />
              <p>Nenhuma aula agendada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="text-green-400" />
            Histórico de Aulas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastLessons.length > 0 ? (
            <div className="space-y-2">
              {pastLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#374151]">
                  <div className="flex items-center gap-3">
                    {lesson.type === 'carro' ? (
                      <Car className="text-[#3b82f6]" size={20} />
                    ) : (
                      <Bike className="text-[#fbbf24]" size={20} />
                    )}
                    <div>
                      <p className="font-medium text-sm">{new Date(lesson.date).toLocaleDateString('pt-BR')} - {lesson.time}</p>
                      <p className="text-xs text-[#9ca3af]">{lesson.instructor_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(lesson.status)}
                    {lesson.instructor_rating && (
                      <Badge className="bg-[#1e40af]/20 text-[#3b82f6] border border-[#1e40af]/50">
                        {lesson.instructor_rating}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#9ca3af]">
              <p>Nenhuma aula realizada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Agendamento */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Agendar Nova Aula</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#9ca3af] block mb-2">Tipo de Aula</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-[#111827] border-[#374151]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#374151]">
                  {student.total_car_lessons > 0 && <SelectItem value="carro">Carro</SelectItem>}
                  {student.total_moto_lessons > 0 && <SelectItem value="moto">Moto</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-[#9ca3af] block mb-2">Instrutor</label>
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger className="bg-[#111827] border-[#374151]">
                  <SelectValue placeholder="Selecione um instrutor" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#374151]">
                  {filteredInstructors.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-[#9ca3af] block mb-2">Data</label>
              <input 
                type="date" 
                className="w-full bg-[#111827] border border-[#374151] rounded-md p-2 text-white"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="text-sm text-[#9ca3af] block mb-2">Horário</label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="bg-[#111827] border-[#374151]">
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#374151] max-h-48">
                  {availableTimeSlots.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-[#374151]" onClick={() => setShowScheduleDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-[#1e40af] hover:bg-[#3b82f6]"
              onClick={handleSchedule}
              disabled={!selectedDate || !selectedTime || !selectedInstructor}
            >
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}