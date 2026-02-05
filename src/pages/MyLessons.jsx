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
  MapPin,
  Download,
  FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SuggestiveCalendar from "../components/schedule/SuggestiveCalendar";
import TimeGrid from "../components/schedule/TimeGrid";
import { Badge } from "@/components/ui/badge";
import jsPDF from 'jspdf';

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
      
      // Verificar se admin está visualizando como aluno
      const savedStudent = localStorage.getItem('admin_view_student');
      let studentToLoad = null;

      if (savedStudent && user.role === 'admin') {
        // Admin visualizando como aluno
        studentToLoad = JSON.parse(savedStudent);
      } else {
        // Aluno normal
        const students = await base44.entities.Student.filter({ user_email: user.email });
        if (students.length > 0) {
          studentToLoad = students[0];
        }
      }
      
      if (studentToLoad) {
        setStudent(studentToLoad);
        
        // Só carregar aulas se pagamento foi confirmado
        if (studentToLoad.payment_status === 'pago') {
          const studentLessons = await base44.entities.Lesson.filter({ student_id: studentToLoad.id });
          setLessons((studentLessons || []).filter(l => !l.trial)); // Excluir aulas trial
        }
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

  const getPeriodOfDay = (time) => {
    const [hour] = time.split(':').map(Number);
    if (hour >= 6 && hour < 12) return 'Manhã';
    if (hour >= 12 && hour < 18) return 'Tarde';
    return 'Noite';
  };

  const filteredInstructors = instructors.filter(i => {
    // Filtrar por especialidade
    let matchesType = false;
    if (selectedType === 'carro') matchesType = i.teaches_car;
    if (selectedType === 'moto') matchesType = i.teaches_moto;
    if (selectedType === 'onibus') matchesType = i.teaches_bus;
    if (selectedType === 'caminhao') matchesType = i.teaches_truck;
    if (selectedType === 'carreta') matchesType = i.teaches_trailer;

    if (!matchesType) return false;

    // Aplica a regra somente para quem NÃO tem CNH e apenas em CARRO/MOTO
    const applyLock = !student?.has_cnh && (selectedType === 'carro' || selectedType === 'moto');
    if (!applyLock) return true;

    const typeLessons = lessons
      .filter(l => l.type === selectedType && (l.status === 'agendada' || l.status === 'realizada'))
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    if (typeLessons.length === 0) return true; // nenhuma aula ainda, pode escolher
    if (typeLessons.length >= 2) return true; // já cumpriu 2, fica livre

    // exatamente 1 aula: fixar no instrutor da primeira
    const fixedInstructorId = typeLessons[0]?.instructor_id;
    return i.id === fixedInstructorId;
  });

  const downloadContractPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const today = new Date().toLocaleDateString('pt-BR');
    doc.text(`Data: ${today}`, 20, yPos);
    yPos += 10;

    // Student Info
    doc.setFont(undefined, 'bold');
    doc.text('INFORMAÇÕES DO ALUNO:', 20, yPos);
    yPos += 7;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Aluno: ${student?.full_name || 'N/A'}`, 25, yPos);
    yPos += 6;
    doc.text(`CPF: ${student?.cpf || 'N/A'}`, 25, yPos);
    yPos += 6;
    doc.text(`Categoria: ${student?.category || 'N/A'}`, 25, yPos);
    yPos += 6;
    
    // Calculate contract value
    let contractValue = 0;
    if (settings) {
      if (student?.category === 'A') contractValue = settings.category_a_price || 548;
      else if (student?.category === 'B') contractValue = settings.category_b_price || 548;
      else if (student?.category === 'AB') contractValue = settings.category_ab_price || 992;
      else if (student?.category === 'inclusao_A') contractValue = settings.category_inclusao_a_price || 400;
      else if (student?.category === 'inclusao_B') contractValue = settings.category_inclusao_b_price || 400;
      else if (student?.category === 'onibus') contractValue = settings.category_bus_price || 1500;
      else if (student?.category === 'caminhao') contractValue = settings.category_truck_price || 1800;
      else if (student?.category === 'carreta') contractValue = settings.category_trailer_price || 2200;
    }

    doc.text(`Valor do Contrato: R$ ${contractValue.toFixed(2)}`, 25, yPos);
    yPos += 12;

    // Contract text
    doc.setFont(undefined, 'bold');
    doc.text('TERMOS E CONDIÇÕES:', 20, yPos);
    yPos += 7;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    
    const contractText = [
      '1. O contratante aceita os termos de prestação de serviços de aulas de direção conforme',
      'apresentado pela instituição.',
      '',
      '2. O aluno compromete-se a cumprir as regras de segurança, horários marcados e',
      'pagamento das aulas contratadas.',
      '',
      '3. A instituição fornecerá aulas teóricas e práticas conforme programação acordada.',
      '',
      '4. O pagamento deve ser realizado conforme cronograma estabelecido.',
      '',
      '5. Este contrato é válido até a conclusão do curso ou cancelamento mútuo.'
    ];

    contractText.forEach(line => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos, { maxWidth: pageWidth - 40 });
      yPos += 5;
    });

    yPos += 15;

    // Signature area
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('Assinatura do Aluno: ________________________', 20, yPos);
    yPos += 15;
    doc.text('Data: ________________________', 20, yPos);

    // Download PDF
    const filename = `contrato_${(student?.full_name || 'aluno').replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(filename);
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedInstructor) return;
    const isTrial = student?.payment_status !== 'pago';

    try {
      // Regra das 2 primeiras aulas com o mesmo instrutor (apenas para quem não tem CNH e só carro/moto)
      if (!student?.has_cnh && (selectedType === 'carro' || selectedType === 'moto')) {
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
      }

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

  if (student.payment_status !== 'pago') {
    return (
      <Card className="bg-[#1a2332] border-[#fbbf24]/40 max-w-2xl mx-auto mt-12">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#fbbf24] mb-2">Pagamento Pendente</h2>
          <p className="text-[#9ca3af] mb-4">
            Você precisa confirmar o pagamento para acessar suas aulas.
          </p>
          <Button 
            className="bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
            onClick={() => navigate(createPageUrl('Home'))}
          >
            Voltar ao Início
          </Button>
        </CardContent>
      </Card>
    );
  }

  const upcomingLessons = lessons.filter(l => l.status === 'agendada').sort((a, b) => new Date(a.date) - new Date(b.date));
  const realScheduledCount = lessons.filter(l => l.status === 'agendada' && !l.trial).length;
  const trialCount = lessons.filter(l => l.trial).length;
  const pastLessons = lessons.filter(l => l.status !== 'agendada').sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
         <h1 className="text-xl sm:text-2xl font-bold">Minhas Aulas</h1>
         <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
           <Button 
             variant="outline"
             className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/10 h-10"
             onClick={downloadContractPDF}
           >
             <Download className="mr-2" size={16} />
             Contrato em PDF
           </Button>
           <Button 
             className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] h-10"
             onClick={() => {
               setShowScheduleDialog(true);
             }}
           >
             <Calendar className="mr-2" size={16} />
             Agendar Nova Aula
           </Button>
         </div>
       </div>

      {student.payment_status !== 'pago' && (
        <Card className="bg-[#1a2332] border-[#fbbf24]/40">
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div>
              <p className="font-semibold text-[#fbbf24] text-sm sm:text-base">🧪 Modo Teste</p>
              <p className="text-xs sm:text-sm text-[#e5e7eb] mt-1">
                Você pode agendar e explorar tudo, mas essas aulas não valem e não aparecem para os instrutores até realizar o pagamento.
              </p>
            </div>
            {trialCount > 0 ? (
              <Button 
                className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] w-full h-9 sm:h-10 text-sm font-semibold" 
                onClick={() => navigate(createPageUrl('Payment') + `?amount=${(settings?.registration_fee || settings?.lesson_price || 0)}&type=inscricao&qty=1`)}
              >
                Pagar agora
              </Button>
            ) : (
              <Button className="bg-[#374151] cursor-not-allowed w-full h-9 sm:h-10 text-xs sm:text-sm" disabled>
                Agende uma aula de teste para liberar o pagamento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status das Aulas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-3 sm:p-4 text-center">
            <Car className="mx-auto text-[#3b82f6] mb-1 sm:mb-2" size={20} />
            <p className="text-lg sm:text-2xl font-bold">{student.completed_car_lessons || 0}/{student.total_car_lessons || 0}</p>
            <p className="text-[10px] sm:text-xs text-[#9ca3af]">Aulas Carro</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-3 sm:p-4 text-center">
            <Bike className="mx-auto text-[#fbbf24] mb-1 sm:mb-2" size={20} />
            <p className="text-lg sm:text-2xl font-bold">{student.completed_moto_lessons || 0}/{student.total_moto_lessons || 0}</p>
            <p className="text-[10px] sm:text-xs text-[#9ca3af]">Aulas Moto</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-3 sm:p-4 text-center">
            <Clock className="mx-auto text-blue-400 mb-1 sm:mb-2" size={20} />
            <p className="text-lg sm:text-2xl font-bold">{realScheduledCount}</p>
            <p className="text-[10px] sm:text-xs text-[#9ca3af]">Agendadas</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-3 sm:p-4 text-center">
            <CheckCircle className="mx-auto text-green-400 mb-1 sm:mb-2" size={20} />
            <p className="text-lg sm:text-2xl font-bold">{lessons.filter(l => l.status === 'realizada').length}</p>
            <p className="text-[10px] sm:text-xs text-[#9ca3af]">Realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Próximas Aulas */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-[#fbbf24] uppercase">
            <Clock className="text-[#fbbf24]" />
            Próximas Aulas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingLessons.length > 0 ? (
            <div className="space-y-3">
              {upcomingLessons.map((lesson) => {
                const locationData = settings?.lesson_locations?.[lesson.type];
                return (
                  <div key={lesson.id} className="space-y-3 p-3 sm:p-4 bg-[#111827] rounded-lg border border-[#374151]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        {lesson.type === 'carro' ? (
                          <Car className="text-[#3b82f6] flex-shrink-0" size={24} />
                        ) : (
                          <Bike className="text-[#fbbf24] flex-shrink-0" size={24} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm sm:text-base truncate text-white">Aula de {lesson.type === 'carro' ? 'Carro' : 'Moto'}</p>
                          <p className="text-xs sm:text-sm text-[#9ca3af] flex items-center gap-1">
                            <User className="inline flex-shrink-0" size={12} />
                            <span className="truncate">INSTRUTOR: {lesson.instructor_name}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-base sm:text-lg text-white">{new Date(lesson.date).toLocaleDateString('pt-BR')}</p>
                          <p className="text-[#fbbf24] text-sm sm:text-base font-semibold">{lesson.time} - {getPeriodOfDay(lesson.time)}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                          {getStatusBadge(lesson.status)}
                          {lesson.trial && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-[10px] sm:text-xs whitespace-nowrap">
                              🧪 Teste
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {locationData && (
                      <div className="p-3 bg-[#0d1117] rounded-lg border border-[#374151]">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="text-[#fbbf24]" size={14} />
                          <span className="font-semibold text-xs text-white">LOCAL DA AULA</span>
                        </div>
                        <p className="text-[#e6edf3] text-xs mb-2">{locationData.address || 'Endereço não definido'}</p>
                        {typeof locationData.lat === 'number' && typeof locationData.lng === 'number' && (
                          <div className="rounded-lg overflow-hidden border border-[#374151]">
                            <iframe
                              width="100%"
                              height="150"
                              frameBorder="0"
                              style={{ border: 0 }}
                              src={`https://www.google.com/maps?q=${locationData.lat},${locationData.lng}&output=embed&z=15`}
                              allowFullScreen
                              title={`Mapa ${lesson.type}`}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
                      <p className="font-medium text-sm text-white">{new Date(lesson.date).toLocaleDateString('pt-BR')} - {lesson.time}</p>
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
            <Button variant="outline" className="border-[#374151] flex-1 sm:flex-none h-10" onClick={() => setShowPaymentRequired(false)}>
              Fechar
            </Button>
            <Button
              className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] flex-1 sm:flex-none h-10"
              onClick={() => {
                const amount = (settings?.registration_fee || settings?.lesson_price || 0);
                navigate(createPageUrl('Payment') + `?amount=${amount}&type=inscricao&qty=1`);
              }}
            >
              Pagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Agendamento */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-lg max-h-[90vh] overflow-y-auto">
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

            {student.payment_status === 'pago' && settings?.lesson_locations?.[selectedType] && (
              <div className="p-3 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="text-[#fbbf24]" size={16} />
                  <span className="font-bold uppercase text-white">ENDEREÇO AULA {selectedType.toUpperCase()}</span>
                </div>
                <p className="text-[#e6edf3] text-sm mb-3">{settings.lesson_locations[selectedType]?.address || 'Endereço não definido'}</p>
                {typeof settings.lesson_locations[selectedType]?.lat === 'number' && typeof settings.lesson_locations[selectedType]?.lng === 'number' && (
                  <div className="rounded-lg overflow-hidden border border-[#374151]">
                    <iframe
                      width="100%"
                      height="200"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps?q=${settings.lesson_locations[selectedType].lat},${settings.lesson_locations[selectedType].lng}&output=embed&z=15`}
                      allowFullScreen
                      title={`Mapa ${selectedType}`}
                    />
                  </div>
                )}
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
            <Button variant="outline" className="border-[#374151] flex-1 sm:flex-none h-10" onClick={() => setShowScheduleDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] flex-1 sm:flex-none h-10"
              onClick={handleSchedule}
              disabled={!selectedDate || !selectedTime || !selectedInstructor}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comprar Mais Aulas */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-lg max-h-[90vh] overflow-y-auto">
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
              <span className="text-white">Total</span>
              <span className="text-[#fbbf24] font-bold">
                R$ {(((settings?.lesson_price || 98) * parseInt(purchaseQty || '1'))).toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-[#374151] flex-1 sm:flex-none h-10" onClick={() => setShowBuyDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] flex-1 sm:flex-none h-10"
              onClick={() => {
                const total = (settings?.lesson_price || 98) * parseInt(purchaseQty || '1');
                navigate(createPageUrl('Payment') + `?amount=${total}&type=${purchaseType}&qty=${purchaseQty}`);
              }}
            >
              Pagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}