import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  ChevronRight,
  MapPin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SuggestiveCalendar from "../components/schedule/SuggestiveCalendar";
import TimeGrid from "../components/schedule/TimeGrid";
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
  const [settings, setSettings] = useState(null);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [purchaseType, setPurchaseType] = useState('carro');
  const [purchaseQty, setPurchaseQty] = useState('1');
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);
  const [instructorLessons, setInstructorLessons] = useState([]);

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
        const studentLessons = await base44.entities.Lesson.filter({ student_id: students[0].id });
        setLessons(studentLessons);
      }

      const allInstructors = await base44.entities.Instructor.filter({ active: true });
      setInstructors(allInstructors);

      const settingsData = await base44.entities.AppSettings.list();
      if (settingsData.length > 0) setSettings(settingsData[0]);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInstructorLessons = async () => {
      try {
        if (!selectedInstructor) { setInstructorLessons([]); return; }
        const data = await base44.entities.Lesson.filter({ instructor_id: selectedInstructor });
        setInstructorLessons((data || []).filter(l => !l.trial));
      } catch (e) { console.log(e); }
    };
    fetchInstructorLessons();
  }, [selectedInstructor]);

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
    const cfg = settings?.lesson_time_config || {};
    const startStr = cfg.day_start || '06:40';
    const endStr = cfg.day_end || '20:00';
    const slot = parseInt(cfg.slot_minutes || 60, 10);
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    let current = sh * 60 + sm;
    const end = eh * 60 + em;
    const slots = [];
    while (current < end) {
      const h = String(Math.floor(current / 60)).padStart(2, '0');
      const m = String(current % 60).padStart(2, '0');
      slots.push(`${h}:${m}`);
      current += slot;
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

    // Regra: nas 2 primeiras aulas da categoria, manter o mesmo instrutor; depois, livre
    const typeLessons = lessons
      .filter(l => l.type === selectedType && (l.status === 'agendada' || l.status === 'realizada'))
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    if (typeLessons.length === 0) return true; // nenhuma aula ainda, pode escolher
    if (typeLessons.length >= 2) return true; // já cumpriu 2, fica livre

    // exatamente 1 aula: fixar no instrutor da primeira
    const fixedInstructorId = typeLessons[0]?.instructor_id;
    return i.id === fixedInstructorId;
  });

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedInstructor) return;
    const isTrial = student?.payment_status !== 'pago';

    try {
      if (!isTrial) {
        // Contar aulas agendadas + realizadas por tipo (somente para aulas reais)
        const carLessonsCount = lessons.filter(l => 
          l.type === 'carro' && (l.status === 'agendada' || l.status === 'realizada' || l.status === 'falta')
        ).length;
        const motoLessonsCount = lessons.filter(l => 
          l.type === 'moto' && (l.status === 'agendada' || l.status === 'realizada' || l.status === 'falta')
        ).length;
        // Verificar limite comprado
        if (selectedType === 'carro' && carLessonsCount >= (student.total_car_lessons || 0)) {
          setPurchaseType('carro');
          setShowBuyDialog(true);
          return;
        }
        if (selectedType === 'moto' && motoLessonsCount >= (student.total_moto_lessons || 0)) {
          setPurchaseType('moto');
          setShowBuyDialog(true);
          return;
        }
        // Duas primeiras com o mesmo instrutor
        const typeLessons = lessons
          .filter(l => l.type === selectedType && (l.status === 'agendada' || l.status === 'realizada'))
          .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
        if (typeLessons.length === 1) {
          const fixedInstructor = typeLessons[0];
          if (fixedInstructor && fixedInstructor.instructor_id !== selectedInstructor) {
            alert(`As duas primeiras aulas de ${selectedType === 'carro' ? 'carro' : 'moto'} devem ser com o mesmo instrutor: ${fixedInstructor.instructor_name}.`);
            return;
          }
        }
        // Conflito real (ignora aulas trial)
        const allLessons = await base44.entities.Lesson.filter({ 
          instructor_id: selectedInstructor,
          date: selectedDate,
          time: selectedTime,
          status: 'agendada'
        });
        if ((allLessons || []).some(l => !l.trial)) {
          alert('Este horário já está ocupado com outro aluno. Por favor, escolha outro horário ou outro instrutor.');
          return;
        }
      }

      const instructor = instructors.find(i => i.id === selectedInstructor);
      await base44.entities.Lesson.create({
        student_id: student.id,
        student_name: student.full_name,
        student_renach: student.renach,
        instructor_id: selectedInstructor,
        instructor_name: instructor?.full_name || '',
        date: selectedDate,
        time: selectedTime,
        type: selectedType,
        status: 'agendada',
        trial: isTrial,
        notified: false
      });

      setShowScheduleDialog(false);
      loadData();
      alert(isTrial ? 'Aula de teste adicionada! Pague para validar.' : 'Aula agendada com sucesso!');
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
            setShowScheduleDialog(true);
          }}
        >
          <Calendar className="mr-2" size={18} />
          Agendar Nova Aula
        </Button>
      </div>

      {student.payment_status !== 'pago' && (
        <Card className="bg-[#1a2332] border-[#fbbf24]/40">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-[#fbbf24]">Modo teste</p>
              <p className="text-sm text-[#e5e7eb]">Você pode agendar e explorar tudo, mas essas aulas não valem e não aparecem para os instrutores até realizar o pagamento.</p>
            </div>
            <Button className="bg-[#f0c41b] text-black hover:bg-[#d4aa00]" onClick={() => navigate(createPageUrl('Payment') + `?amount=${(settings?.registration_fee || settings?.lesson_price || 0)}&type=inscricao&qty=1`)}>Pagar agora</Button>
          </CardContent>
        </Card>
      )}

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
                  <div className="flex items-center gap-2">
                    {getStatusBadge(lesson.status)}
                    {lesson.trial && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Teste - pague para validar</Badge>
                    )}
                  </div>
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

      {/* Pagamento Necessário */}
      <Dialog open={showPaymentRequired} onOpenChange={setShowPaymentRequired}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Pagamento necessário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-[#e5e7eb]">
              Para agendar uma aula, finalize o pagamento. Assim que o pagamento for confirmado, o agendamento será liberado.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#374151]" onClick={() => setShowPaymentRequired(false)}>
              Fechar
            </Button>
            <Button
              className="bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
              onClick={() => {
                const amount = (settings?.registration_fee || settings?.lesson_price || 0);
                navigate(createPageUrl('Payment') + `?amount=${amount}&type=inscricao&qty=1`);
              }}
            >
              Ir para Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

            {settings?.lesson_locations?.[selectedType] && (
              <div className="p-3 bg-[#111827] rounded border border-[#374151]">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="text-[#fbbf24]" size={16} />
                  <span>Local da aula de {selectedType}:</span>
                </div>
                <div className="mt-1 text-sm">
                  <p>{settings.lesson_locations[selectedType]?.address || 'Endereço não definido'}</p>
                  {typeof settings.lesson_locations[selectedType]?.lat === 'number' && typeof settings.lesson_locations[selectedType]?.lng === 'number' && (
                    <a
                      className="text-[#3b82f6] underline"
                      href={`https://www.google.com/maps?q=${settings.lesson_locations[selectedType].lat},${settings.lesson_locations[selectedType].lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir no Maps
                    </a>
                  )}
                </div>
              </div>
            )}

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

            <div className="space-y-3">
              <label className="text-sm text-[#9ca3af] block">Escolha o dia</label>
              {!selectedInstructor ? (
                <div className="p-3 text-sm text-[#9ca3af] bg-[#111827] border border-[#374151] rounded-lg">
                  Selecione um instrutor para visualizar o calendário de agendamentos.
                </div>
              ) : (
                <SuggestiveCalendar
                  monthDate={currentMonth}
                  onPrev={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  onNext={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  isFullyBooked={(dateStr) => {
                    const count = instructorLessons.filter(l => l.status === 'agendada' && l.date === dateStr).length;
                    return count >= availableTimeSlots.length;
                  }}
                />
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm text-[#9ca3af] block">Escolha o horário</label>
              {!selectedInstructor || !selectedDate ? (
                <div className="p-3 text-sm text-[#9ca3af] bg-[#111827] border border-[#374151] rounded-lg">
                  Escolha o instrutor e o dia para ver os horários disponíveis.
                </div>
              ) : (
                <TimeGrid
                  timeSlots={availableTimeSlots}
                  bookedTimes={new Set(instructorLessons.filter(l => l.status === 'agendada' && l.date === selectedDate).map(l => l.time))}
                  selectedTime={selectedTime}
                  onSelect={setSelectedTime}
                />
              )}
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

      {/* Comprar Mais Aulas */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Comprar Mais Aulas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#9ca3af] block mb-2">Tipo de Aula</label>
              <Select value={purchaseType} onValueChange={setPurchaseType}>
                <SelectTrigger className="bg-[#111827] border-[#374151]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#374151]">
                  <SelectItem value="carro">Carro</SelectItem>
                  <SelectItem value="moto">Moto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-[#9ca3af] block mb-2">Quantidade</label>
              <Select value={purchaseQty} onValueChange={setPurchaseQty}>
                <SelectTrigger className="bg-[#111827] border-[#374151]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#374151] max-h-48">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-[#111827] rounded border border-[#374151] flex items-center justify-between">
              <span>Total</span>
              <span className="text-[#fbbf24] font-bold">
                R$ {(((settings?.lesson_price || 98) * parseInt(purchaseQty || '1'))).toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-[#374151]" onClick={() => setShowBuyDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
              onClick={() => {
                const total = (settings?.lesson_price || 98) * parseInt(purchaseQty || '1');
                navigate(createPageUrl('Payment') + `?amount=${total}&type=${purchaseType}&qty=${purchaseQty}`);
              }}
            >
              Ir para Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}