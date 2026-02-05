import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, User, MapPin, AlertTriangle, ArrowLeft, Car, Bike, Bus, Truck } from 'lucide-react';
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
    
    // Verificar se não está duplicando a mesma data/hora nos schedules temporários
    const alreadyScheduled = schedules.some(s => 
      s.date === selectedDate && 
      s.time === selectedTime && 
      s.instructor_id === selectedInstructor
    );
    
    if (alreadyScheduled) {
      alert('Você já agendou esta aula neste horário. Escolha outro horário.');
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
    
    // Scroll para o topo para continuar agendando
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Resetar campos para próxima aula
    setSelectedDate('');
    setSelectedTime('');
    
    // Verificar se ainda há aulas do tipo atual para agendar
    const currentTypeScheduled = updatedSchedules.filter(s => s.type === currentType).length;
    const currentTypeTotal = lessonsConfig[currentType] || 0;
    
    if (currentTypeScheduled >= currentTypeTotal) {
      // Trocar para próximo tipo disponível
      const availTypes = getAvailableTypes();
      if (availTypes.length > 0) {
        setCurrentType(availTypes[0][0]);
      }
    }
    // Se ainda há aulas do tipo atual, manter o tipo selecionado
    
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
            <span className="text-sm sm:text-base font-semibold uppercase text-white">Progresso do Agendamento</span>
            <span className="text-xs sm:text-sm text-[#fbbf24] font-bold">{scheduledLessons}/{totalLessons}</span>
          </div>
          <div className="w-full bg-[#374151] rounded-full h-2">
            <div 
              className="bg-[#f0c41b] h-2 rounded-full transition-all"
              style={{ width: `${(scheduledLessons / totalLessons) * 100}%` }}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-[#9ca3af] mt-2">
            Aula {scheduledLessons + 1} de {totalLessons} total
            {currentType && ` • ${schedules.filter(s => s.type === currentType).length}/${lessonsConfig[currentType]} ${getTypeName(currentType)}`}
          </p>
          {scheduledLessons > 0 && scheduledLessons < totalLessons && (
            <div className="mt-3 p-2 bg-[#10b981]/20 border border-[#10b981] rounded-lg">
              <p className="text-xs sm:text-sm text-[#10b981] font-semibold text-center">
                ✓ Aula {scheduledLessons} agendada! Continue agendando a próxima aula abaixo:
              </p>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Scheduler */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg uppercase text-white">
            Agendar Aula {currentLessonIndex + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de Aula - Ícones Clicáveis */}
          <div>
            <label className="text-base sm:text-lg font-bold text-white block mb-3 uppercase">
              Escolha o Tipo de Aula
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              {getAvailableTypes().map(([type, count]) => {
                const scheduled = schedules.filter(s => s.type === type).length;
                const isActive = currentType === type;
                const isCompleted = scheduled >= count;
                
                // Verificar se existe tipo anterior incompleto
                const typeIndex = getAvailableTypes().findIndex(([t]) => t === type);
                let hasPendingPreviousType = false;
                let pendingTypeName = '';
                for (let i = 0; i < typeIndex; i++) {
                  const [prevType, prevCount] = getAvailableTypes()[i];
                  const prevScheduled = schedules.filter(s => s.type === prevType).length;
                  if (prevScheduled < prevCount) {
                    hasPendingPreviousType = true;
                    pendingTypeName = getTypeName(prevType);
                    break;
                  }
                }
                
                const isAvailable = scheduled < count && !hasPendingPreviousType;
                
                // Ícone baseado no tipo
                let Icon = Car;
                let colorClass = 'text-[#3b82f6]';
                if (type === 'moto') { Icon = Bike; colorClass = 'text-[#fbbf24]'; }
                if (type === 'onibus') { Icon = Bus; colorClass = 'text-green-400'; }
                if (type === 'caminhao') { Icon = Truck; colorClass = 'text-orange-400'; }
                if (type === 'carreta') { Icon = Truck; colorClass = 'text-purple-400'; }
                
                return (
                  <button
                    key={type}
                    onClick={() => {
                      if (hasPendingPreviousType) {
                        setBlockMessage(`Você precisa finalizar as aulas de ${pendingTypeName} antes de agendar ${getTypeName(type)}!`);
                        setTimeout(() => setBlockMessage(''), 4000);
                        return;
                      }
                      if (isAvailable) {
                        setCurrentType(type);
                        setSelectedDate('');
                        setSelectedTime('');
                        if (schedules.length >= 2) {
                          setSelectedInstructor('');
                        }
                      }
                    }}
                    disabled={!isAvailable && !hasPendingPreviousType}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      isActive 
                        ? 'border-[#fbbf24] bg-[#fbbf24]/10 shadow-lg shadow-[#fbbf24]/30' 
                        : isCompleted
                        ? 'border-[#10b981] bg-[#10b981]/10 cursor-default'
                        : hasPendingPreviousType
                        ? 'border-[#ef4444] bg-[#111827] opacity-60 cursor-pointer hover:border-[#ef4444] hover:opacity-80'
                        : isAvailable
                        ? 'border-[#374151] bg-[#111827] hover:border-[#3b82f6] hover:shadow-md cursor-pointer'
                        : 'border-[#374151] bg-[#111827] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {/* Badge de Status */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {isCompleted && (
                        <div className="w-6 h-6 bg-[#10b981] rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Ícone do Veículo */}
                    <div className="flex flex-col items-center">
                      <Icon 
                        size={48} 
                        className={`mb-3 ${
                          isActive ? 'text-[#fbbf24]' : 
                          isCompleted ? 'text-[#10b981]' : 
                          colorClass
                        }`} 
                      />
                      <h3 className={`font-bold text-base mb-2 uppercase ${
                        isActive ? 'text-[#fbbf24]' : 
                        isCompleted ? 'text-[#10b981]' : 
                        'text-white'
                      }`}>
                        {getTypeName(type)}
                      </h3>
                      
                      {/* Contador de Aulas */}
                      <div className={`text-sm font-semibold ${
                        isActive ? 'text-[#fbbf24]' : 
                        isCompleted ? 'text-[#10b981]' : 
                        'text-[#9ca3af]'
                      }`}>
                        {scheduled}/{count} agendadas
                      </div>
                      
                      {/* Status Text */}
                      {isCompleted && (
                        <div className="mt-2 text-xs text-[#10b981] font-bold uppercase">
                          Completo ✓
                        </div>
                      )}
                      {isActive && !isCompleted && (
                        <div className="mt-2 text-xs text-[#fbbf24] font-bold uppercase">
                          Agendando...
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <p className="text-xs text-[#9ca3af] mt-3 text-center">
              Agende todas as aulas de cada tipo antes de passar para o próximo
            </p>
          </div>

          {/* Local da aula */}
          {currentType && settings?.lesson_locations?.[currentType] && (
            <div className="p-3 bg-[#111827] rounded border border-[#374151]">
              <div className="flex items-center gap-2 text-xs sm:text-sm mb-1">
                <MapPin className="text-[#fbbf24] flex-shrink-0" size={14} />
                <span className="font-semibold text-white">Local da aula:</span>
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
              <style>{`
                @keyframes blinkYellowWhite {
                  0%, 100% { color: #fbbf24; }
                  50% { color: #ffffff; }
                }
                .blink-instructor {
                  animation: blinkYellowWhite 1s ease-in-out infinite;
                }
              `}</style>
              <label className={`text-lg sm:text-xl font-bold block mb-3 uppercase ${scheduledLessons < totalLessons ? 'blink-instructor' : 'text-[#fbbf24]'}`}>
                Escolha seu Instrutor {lockedInstructor && schedules.length < 2 && '(Bloqueado para as 2 primeiras aulas)'}
              </label>
              
              {/* Perfis dos Instrutores */}
              <div className="relative mb-4">
                <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#fbbf24] scrollbar-track-[#111827]">
                  {filteredInstructors.map(instructor => {
                    const isSelected = selectedInstructor === instructor.id;
                    const isLocked = lockedInstructor && lockedInstructor !== instructor.id && schedules.length < 2;
                    
                    return (
                      <button
                        key={instructor.id}
                        onClick={() => !isLocked && setSelectedInstructor(instructor.id)}
                        disabled={isLocked}
                        className={`flex-shrink-0 w-40 snap-start rounded-xl overflow-hidden border-2 transition-all ${
                          isSelected 
                            ? 'border-[#fbbf24] bg-[#fbbf24]/10 shadow-lg shadow-[#fbbf24]/30' 
                            : isLocked
                            ? 'border-[#374151] bg-[#111827] opacity-50 cursor-not-allowed'
                            : 'border-[#374151] bg-[#111827] hover:border-[#3b82f6] hover:shadow-md'
                        }`}
                      >
                        {/* Foto do Instrutor */}
                        <div className="relative h-32 bg-gradient-to-br from-[#1e40af] to-[#0c1844] overflow-hidden">
                          {instructor.photo ? (
                            <img 
                              src={instructor.photo} 
                              alt={instructor.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={48} className="text-[#374151]" />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#10b981] rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Info do Instrutor */}
                        <div className="p-3">
                          <h4 className={`font-bold text-sm mb-1 truncate ${isSelected ? 'text-[#fbbf24]' : 'text-white'}`}>
                            {instructor.full_name}
                          </h4>
                          
                          {/* Badge de Veículos */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {instructor.teaches_car && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#3b82f6]/20 text-[#3b82f6] rounded font-semibold">
                                CARRO
                              </span>
                            )}
                            {instructor.teaches_moto && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#fbbf24]/20 text-[#fbbf24] rounded font-semibold">
                                MOTO
                              </span>
                            )}
                            {instructor.teaches_bus && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded font-semibold">
                                ÔNIBUS
                              </span>
                            )}
                            {instructor.teaches_truck && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded font-semibold">
                                CAMINHÃO
                              </span>
                            )}
                            {instructor.teaches_trailer && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded font-semibold">
                                CARRETA
                              </span>
                            )}
                          </div>
                          
                          {/* Bio curta */}
                          {instructor.bio && (
                            <p className="text-[10px] text-[#9ca3af] line-clamp-2 leading-tight">
                              {instructor.bio}
                            </p>
                          )}
                          
                          {/* Estatísticas */}
                          {instructor.total_lessons > 0 && (
                            <div className="mt-2 pt-2 border-t border-[#374151]">
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-[10px] text-[#9ca3af]">Aulas dadas:</span>
                                <span className="text-xs font-bold text-[#fbbf24]">{instructor.total_lessons || 0}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Indicador de scroll */}
                {filteredInstructors.length > 2 && (
                  <div className="text-center mt-2">
                    <p className="text-[10px] text-[#9ca3af]">← Deslize para ver mais instrutores →</p>
                  </div>
                )}
              </div>
              
              {lockedInstructor && schedules.length < 2 && (
                <p className="text-xs text-[#fbbf24] mb-3 p-2 bg-[#fbbf24]/10 border border-[#fbbf24] rounded">
                  ⚠️ Você deve fazer as 2 primeiras aulas com o mesmo instrutor
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
              className="flex-1 bg-[#f0c41b] text-white hover:bg-[#d4aa00] h-10 text-sm font-semibold uppercase"
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
            <CardTitle className="text-sm sm:text-base uppercase text-white">Aulas Agendadas ({schedules.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {schedules.map((s, idx) => {
              const [year, month, day] = s.date.split('-');
              const displayDate = `${day}/${month}/${year}`;
              return (
                <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-[#111827] rounded border border-[#374151]">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Clock className="text-[#fbbf24] flex-shrink-0" size={14} />
                    <span className="text-xs sm:text-sm truncate uppercase text-white">{getTypeName(s.type)} - {displayDate}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-[#fbbf24] font-semibold whitespace-nowrap ml-2 uppercase">{s.time}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}