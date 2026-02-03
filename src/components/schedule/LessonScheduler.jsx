import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, User, MapPin, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import SuggestiveCalendar from "./SuggestiveCalendar";
import TimeGrid from "./TimeGrid";

export default function LessonScheduler({ 
  lessonsConfig, // { carro: 2, moto: 2, etc }
  onSchedulesComplete,
  onBack,
  settings
}) {
  const [instructors, setInstructors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentType, setCurrentType] = useState('');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [instructorLessons, setInstructorLessons] = useState([]);
  const [lockedInstructor, setLockedInstructor] = useState(null);
  const [allLessons, setAllLessons] = useState([]);

  const typesAvailable = Object.entries(lessonsConfig).filter(([_, count]) => count > 0);

  useEffect(() => {
    loadInstructors();
    loadAllLessons();
    // Inicializar com o primeiro tipo disponível
    if (typesAvailable.length > 0 && !currentType) {
      setCurrentType(typesAvailable[0][0]);
    }
  }, []);

  useEffect(() => {
    if (selectedInstructor) {
      loadInstructorLessons();
    }
  }, [selectedInstructor]);

  const loadInstructors = async () => {
    const allInstructors = await base44.entities.Instructor.filter({ active: true });
    setInstructors(allInstructors);
  };

  const loadInstructorLessons = async () => {
    if (!selectedInstructor) return;
    const data = await base44.entities.Lesson.filter({ instructor_id: selectedInstructor });
    setInstructorLessons((data || []).filter(l => !l.trial));
  };

  const loadAllLessons = async () => {
    const data = await base44.entities.Lesson.list();
    setAllLessons((data || []).filter(l => !l.trial));
  };

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
    if (!currentType) return false;
    if (currentType === 'carro') return i.teaches_car;
    if (currentType === 'moto') return i.teaches_moto;
    if (currentType === 'onibus') return i.teaches_bus;
    if (currentType === 'caminhao') return i.teaches_truck;
    if (currentType === 'carreta') return i.teaches_trailer;
    return false;
  });

  const getAvailableTypes = () => {
    return typesAvailable.filter(([type, count]) => {
      const scheduled = schedules.filter(s => s.type === type).length;
      return scheduled < count;
    });
  };

  const handleAddSchedule = () => {
    if (!selectedDate || !selectedTime || !selectedInstructor || !currentType) return;
    
    // Verificar se horário está disponível (não ocupado por alunos que já pagaram)
    const occupied = allLessons.some(l => 
      l.instructor_id === selectedInstructor && 
      l.date === selectedDate && 
      l.time === selectedTime && 
      l.status === 'agendada' &&
      !l.trial
    );
    
    if (occupied) {
      alert('Este horário já está ocupado por outro aluno. Escolha outro horário.');
      return;
    }
    
    // Bloquear instrutor nas 2 primeiras aulas
    if (schedules.length === 0) {
      setLockedInstructor(selectedInstructor);
    }
    
    const instructor = instructors.find(i => i.id === selectedInstructor);
    const newSchedule = {
      type: currentType,
      date: selectedDate,
      time: selectedTime,
      instructor_id: selectedInstructor,
      instructor_name: instructor?.full_name || ''
    };
    
    const updatedSchedules = [...schedules, newSchedule];
    setSchedules(updatedSchedules);
    
    // Verificar se todas as aulas foram agendadas
    const totalLessons = Object.values(lessonsConfig).reduce((a, b) => a + b, 0);
    
    if (updatedSchedules.length >= totalLessons) {
      // Todas as aulas agendadas - finalizar
      onSchedulesComplete(updatedSchedules);
      return;
    }
    
    // Resetar campos para próxima aula
    setSelectedDate('');
    setSelectedTime('');
    
    // Resetar tipo para próxima aula disponível
    const availTypes = getAvailableTypes();
    if (availTypes.length > 0) {
      setCurrentType(availTypes[0][0]);
    }
    
    if (updatedSchedules.length >= 2) {
      // Após 2 aulas, liberar seleção de instrutor
      setSelectedInstructor('');
      setLockedInstructor(null);
    }
    
    setCurrentLessonIndex(currentLessonIndex + 1);
  };

  const totalLessons = Object.values(lessonsConfig).reduce((a, b) => a + b, 0);
  const scheduledLessons = schedules.length;

  const getTypeName = (type) => {
    const names = { carro: 'Carro', moto: 'Moto', onibus: 'Ônibus', caminhao: 'Caminhão', carreta: 'Carreta' };
    return names[type] || type;
  };

  if (!currentType || instructors.length === 0) {
    return (
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse text-[#fbbf24]">Carregando agendamento...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress */}
      <Card className="bg-[#1a2332] border-[#fbbf24]/40">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-semibold">Progresso do Agendamento</span>
            <span className="text-xs sm:text-sm text-[#fbbf24] font-bold">{scheduledLessons}/{totalLessons}</span>
          </div>
          <div className="w-full bg-[#374151] rounded-full h-2">
            <div 
              className="bg-[#f0c41b] h-2 rounded-full transition-all"
              style={{ width: `${(scheduledLessons / totalLessons) * 100}%` }}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-[#9ca3af] mt-2">
            Agendando aula {currentLessonIndex + 1} de {lessonsConfig[currentType]} - {getTypeName(currentType)}
          </p>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="bg-red-500/10 border-red-500/50">
        <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-red-400">⚠️ ATENÇÃO</p>
            <p className="text-[10px] sm:text-xs text-red-300 mt-1">
              SE VOCÊ NÃO PAGAR A TEMPO, TALVEZ OUTRA PESSOA PAGUE ANTES E FIQUE COM OS SEUS HORÁRIOS, ENTÃO VOCÊ TERÁ QUE ESCOLHER OUTRO HORÁRIO APÓS PAGAR!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scheduler */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Agendar Aula {currentLessonIndex + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de Aula */}
          <div>
            <label className="text-xs sm:text-sm text-[#9ca3af] block mb-2">Tipo de Aula</label>
            <Select value={currentType} onValueChange={(val) => {
              setCurrentType(val);
              setSelectedDate('');
              setSelectedTime('');
            }}>
              <SelectTrigger className="bg-[#111827] border-[#374151] h-10">
                <SelectValue placeholder="Selecione o tipo de aula" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#374151]">
                {getAvailableTypes().map(([type]) => (
                  <SelectItem key={type} value={type}>{getTypeName(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Local da aula */}
          {currentType && settings?.lesson_locations?.[currentType] && (
            <div className="p-3 bg-[#111827] rounded border border-[#374151]">
              <div className="flex items-center gap-2 text-xs sm:text-sm mb-1">
                <MapPin className="text-[#fbbf24] flex-shrink-0" size={14} />
                <span className="font-semibold">Local da aula:</span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#9ca3af]">
                {settings.lesson_locations[currentType]?.address || 'Endereço não definido'}
              </p>
              {typeof settings.lesson_locations[currentType]?.lat === 'number' && (
                <a
                  className="text-[10px] sm:text-xs text-[#3b82f6] underline mt-1 inline-block"
                  href={`https://www.google.com/maps?q=${settings.lesson_locations[currentType].lat},${settings.lesson_locations[currentType].lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver no Google Maps
                </a>
              )}
            </div>
          )}

          {currentType && (
            <div>
              <label className="text-xs sm:text-sm text-[#9ca3af] block mb-2">
                Instrutor {lockedInstructor && schedules.length < 2 && '(Bloqueado para as 2 primeiras aulas)'}
              </label>
              <Select 
                value={selectedInstructor} 
                onValueChange={setSelectedInstructor}
                disabled={lockedInstructor && schedules.length < 2}
              >
                <SelectTrigger className="bg-[#111827] border-[#374151] h-10">
                  <SelectValue placeholder="Selecione um instrutor" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#374151]">
                  {filteredInstructors.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lockedInstructor && schedules.length < 2 && (
                <p className="text-xs text-[#fbbf24] mt-1">
                  Você deve fazer as 2 primeiras aulas com o mesmo instrutor
                </p>
              )}
            </div>
          )}

          {!currentType ? (
            <div className="p-3 text-xs sm:text-sm text-[#9ca3af] bg-[#111827] border border-[#374151] rounded-lg">
              Selecione o tipo de aula primeiro.
            </div>
          ) : !selectedInstructor ? (
            <div className="p-3 text-xs sm:text-sm text-[#9ca3af] bg-[#111827] border border-[#374151] rounded-lg">
              Selecione um instrutor para visualizar o calendário.
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs sm:text-sm text-[#9ca3af] block mb-2">Escolha o dia</label>
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
              </div>

              {selectedDate && (
                <div>
                  <label className="text-xs sm:text-sm text-[#9ca3af] block mb-2">Escolha o horário</label>
                  <TimeGrid
                    timeSlots={availableTimeSlots}
                    bookedTimes={new Set([
                      ...instructorLessons.filter(l => l.status === 'agendada' && l.date === selectedDate).map(l => l.time),
                      ...allLessons.filter(l => 
                        !l.trial && 
                        l.instructor_id === selectedInstructor && 
                        l.date === selectedDate && 
                        l.status === 'agendada'
                      ).map(l => l.time),
                      ...schedules.filter(s => s.date === selectedDate && s.instructor_id === selectedInstructor).map(s => s.time)
                    ])}
                    selectedTime={selectedTime}
                    onSelect={setSelectedTime}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {onBack && schedules.length === 0 && (
              <Button
                variant="outline"
                className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black h-10 text-sm font-semibold w-full sm:w-auto"
                onClick={onBack}
              >
                <ArrowLeft className="mr-2" size={16} /> VOLTAR
              </Button>
            )}
            <Button
              className="flex-1 bg-[#f0c41b] text-black hover:bg-[#d4aa00] h-10 text-sm font-semibold"
              onClick={handleAddSchedule}
              disabled={!selectedDate || !selectedTime || !selectedInstructor || !currentType}
            >
              {schedules.length + 1 >= Object.values(lessonsConfig).reduce((a, b) => a + b, 0) ? '✓ Finalizar e Ver Pagamento' : `Adicionar Aula ${schedules.length + 1}/${totalLessons}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Aulas já agendadas */}
      {schedules.length > 0 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Aulas Agendadas ({schedules.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {schedules.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-[#111827] rounded border border-[#374151]">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Clock className="text-[#fbbf24] flex-shrink-0" size={14} />
                  <span className="text-xs sm:text-sm truncate">{getTypeName(s.type)} - {new Date(s.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <span className="text-xs sm:text-sm text-[#fbbf24] font-semibold whitespace-nowrap ml-2">{s.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}