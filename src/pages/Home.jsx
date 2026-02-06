import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Car, 
  Bike, 
  Calendar, 
  Users, 
  BookOpen, 
  CreditCard,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  Share2,
  Copy,
  Lock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isInstructor, setIsInstructor] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Verifica se o usuário é instrutor para bloquear cadastro de aluno
      const instructorMatches = currentUser ? await base44.entities.Instructor.filter({ user_email: currentUser.email }) : [];
      if (instructorMatches.length > 0) {
        setIsInstructor(true);
      }

      const settingsData = await base44.entities.AppSettings.list();
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }

      if (currentUser) {
        const students = await base44.entities.Student.filter({ user_email: currentUser.email });
        if (students.length > 0) {
          setStudent(students[0]);
          
          const today = new Date().toISOString().split('T')[0];
          if (students[0].payment_status === 'pago') {
            const lessons = await base44.entities.Lesson.filter({ 
              student_id: students[0].id
            });
            setUpcomingLessons((lessons || []).filter(l => !l.trial && (l.status === 'agendada' || l.status === 'falta' || l.status === 'realizada')).sort((a, b) => {
              if (a.date !== b.date) return b.date.localeCompare(a.date);
              return b.time.localeCompare(a.time);
            }));
          }
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  if (!student) {
    if (isInstructor) {
      return (
        <div className="max-w-4xl mx-auto">
          <Card className="bg-[#1a2332] border-[#374151] terminal-glow">
            <CardHeader>
              <CardTitle className="text-[#fbbf24]">Acesso de Instrutor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[#9ca3af]">Instrutores não podem se cadastrar como alunos.</p>
              <Link to={createPageUrl('AdminDashboard')}>
                <Button className="bg-[#1e40af] hover:bg-[#3b82f6]">Ir para o Painel</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Bem-vindo à <span className="text-[#fbbf24]">CNH PARA TODOS</span>
          </h1>
          <p className="text-[#9ca3af] italic">"Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento" - Provérbios 3:5</p>
        </div>

        <Card className="bg-[#1a2332] border-[#374151] terminal-glow">
          <CardHeader>
            <CardTitle className="text-[#fbbf24] flex items-center gap-2">
              <Car size={24} />
              Cadastro de Aluno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={createPageUrl('StudentRegister')}>
              <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6] text-white py-6 text-lg">
                Fazer Cadastro
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card className="bg-[#1a2332] border-[#374151]">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bike className="text-[#fbbf24]" />
              </div>
              <h3 className="font-bold mb-1 text-[#fbbf24] text-lg">Categoria A</h3>

            </CardContent>
          </Card>
          
          <Card className="bg-[#1a2332] border-[#374151]">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Car className="text-[#fbbf24]" />
              </div>
              <h3 className="font-bold mb-1 text-[#fbbf24] text-lg">Categoria B</h3>

            </CardContent>
          </Card>
          
          <Card className="bg-[#1a2332] border-[#374151]">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="flex">
                  <Bike className="text-[#fbbf24]" size={18} />
                  <Car className="text-[#fbbf24]" size={18} />
                </div>
              </div>
              <h3 className="font-bold mb-1 text-[#fbbf24] text-lg">Categoria AB</h3>

            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progressPercentage = () => {
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

  const generateLessonText = (lesson) => {
    const typeNames = {
      carro: 'CARRO',
      moto: 'MOTO',
      onibus: 'ÔNIBUS',
      caminhao: 'CAMINHÃO',
      carreta: 'CARRETA'
    };
    const loc = settings?.lesson_locations?.[lesson.type];
    const formattedDate = new Date(lesson.date).toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let text = `🚗 *AULA DE ${typeNames[lesson.type] || lesson.type.toUpperCase()}*\n\n`;
    text += `📅 *Data:* ${formattedDate}\n`;
    text += `🕐 *Horário:* ${lesson.time}\n`;
    text += `👨‍🏫 *Instrutor:* ${lesson.instructor_name}\n`;
    
    if (loc?.address) {
      text += `\n📍 *Local da Aula:*\n${loc.address}\n`;
      if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        text += `\n🗺️ *Ver no Mapa:*\nhttps://www.google.com/maps?q=${loc.lat},${loc.lng}`;
      }
    }
    
    return text;
  };

  const handleShareWhatsApp = (lesson) => {
    const text = generateLessonText(lesson);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyInfo = async (lesson) => {
    const text = generateLessonText(lesson);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(lesson.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const getPeriodOfDay = (time) => {
    const [hours] = time.split(':').map(Number);
    if (hours >= 6 && hours < 12) return 'Manhã';
    if (hours >= 12 && hours < 18) return 'Tarde';
    return 'Noite';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Olá, <span className="text-[#fbbf24]">{student.full_name?.split(' ')[0]}</span>!
          </h1>
          <p className="text-[#9ca3af] text-sm">RENACH: {student.renach}</p>
        </div>
        <div className="flex gap-2">
          {student.payment_status === 'pago' ? (
            <Link to={createPageUrl('MyLessons')}>
              <Button className="bg-[#1e40af] hover:bg-[#3b82f6]">
                <Calendar className="mr-2" size={18} />
                Agendar Aula
              </Button>
            </Link>
          ) : (
            <Button 
              className="bg-[#374151] cursor-not-allowed"
              disabled
            >
              <Calendar className="mr-2" size={18} />
              Pagamento Pendente
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs">Progresso</p>
                <p className="text-2xl font-bold text-[#fbbf24]">{progressPercentage()}%</p>
              </div>
              <div className="w-12 h-12 bg-[#1e40af]/20 rounded-full flex items-center justify-center">
                <CheckCircle className="text-[#3b82f6]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs">Aulas Carro</p>
                <p className="text-2xl font-bold text-white">{student.completed_car_lessons || 0}/{student.total_car_lessons || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#1e40af]/20 rounded-full flex items-center justify-center">
                <Car className="text-[#3b82f6]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs">Aulas Moto</p>
                <p className="text-2xl font-bold text-white">{student.completed_moto_lessons || 0}/{student.total_moto_lessons || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#1e40af]/20 rounded-full flex items-center justify-center">
                <Bike className="text-[#3b82f6]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs">Categoria</p>
                <p className="text-2xl font-bold text-[#fbbf24]">{student.category || '-'}</p>
              </div>
              <div className="w-12 h-12 bg-[#fbbf24]/20 rounded-full flex items-center justify-center">
                <CreditCard className="text-[#fbbf24]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Aulas */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="text-[#fbbf24]" />
            Histórico de Aulas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.payment_status === 'pago' && upcomingLessons.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {upcomingLessons.map((lesson) => {
                const typeNames = {
                  carro: 'CARRO',
                  moto: 'MOTO',
                  onibus: 'ÔNIBUS',
                  caminhao: 'CAMINHÃO',
                  carreta: 'CARRETA'
                };
                const loc = settings?.lesson_locations?.[lesson.type];
                
                return (
                  <div key={lesson.id} className={`p-4 bg-[#111827] rounded-lg border-2 ${
                    lesson.status === 'realizada' ? 'border-green-500' : 
                    lesson.status === 'falta' ? 'border-red-500' : 
                    'border-[#374151]'
                  }`}>
                    {/* Status da aula */}
                    {lesson.status === 'realizada' && (
                      <div className="mb-3 p-2 bg-green-500/20 border border-green-500 rounded-lg">
                        <p className="text-sm text-green-400 font-semibold text-center flex items-center justify-center gap-2">
                          <CheckCircle size={16} />
                          Aula Realizada
                        </p>
                      </div>
                    )}
                    {lesson.status === 'falta' && (
                      <div className="mb-3 space-y-3">
                        <div className="p-2 bg-red-500/20 border border-red-500 rounded-lg">
                          <p className="text-sm text-red-400 font-semibold text-center flex items-center justify-center gap-2">
                            <Clock size={16} />
                            Falta Registrada
                          </p>
                        </div>
                        
                        {/* Fotos da Falta */}
                        {(lesson.absence_instructor_photo_url || lesson.absence_location_photo_url) && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-red-400 uppercase">Comprovantes do Instrutor:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {lesson.absence_instructor_photo_url && (
                                <div>
                                  <p className="text-xs text-[#9ca3af] mb-1">Selfie do Instrutor</p>
                                  <img 
                                    src={lesson.absence_instructor_photo_url} 
                                    alt="Selfie do instrutor" 
                                    className="w-full h-32 object-cover rounded-lg border border-red-500/30"
                                  />
                                </div>
                              )}
                              {lesson.absence_location_photo_url && (
                                <div>
                                  <p className="text-xs text-[#9ca3af] mb-1">Foto do Local</p>
                                  <img 
                                    src={lesson.absence_location_photo_url} 
                                    alt="Foto do local" 
                                    className="w-full h-32 object-cover rounded-lg border border-red-500/30"
                                  />
                                </div>
                              )}
                            </div>
                            {lesson.absence_photos_timestamp && (
                              <p className="text-xs text-[#9ca3af]">
                                Registrado em: {new Date(lesson.absence_photos_timestamp).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Comentário do Instrutor */}
                        {lesson.instructor_comment && (
                          <div className="p-3 bg-[#0d1117] border border-[#374151] rounded-lg">
                            <p className="text-xs font-semibold text-[#fbbf24] uppercase mb-1">Motivo da Falta:</p>
                            <p className="text-sm text-white">{lesson.instructor_comment}</p>
                          </div>
                        )}
                        
                        {/* Avaliação do Instrutor */}
                        {lesson.instructor_rating && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#9ca3af] uppercase">Avaliação:</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              lesson.instructor_rating === 'excelente' ? 'bg-green-500/20 text-green-400' :
                              lesson.instructor_rating === 'boa' ? 'bg-blue-500/20 text-blue-400' :
                              lesson.instructor_rating === 'regular' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {lesson.instructor_rating.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Cabeçalho da aula */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        {lesson.type === 'carro' && <Car className="text-[#3b82f6]" size={24} />}
                        {lesson.type === 'moto' && <Bike className="text-[#fbbf24]" size={24} />}
                        {lesson.type === 'onibus' && <Bike className="text-green-400" size={24} />}
                        {lesson.type === 'caminhao' && <Bike className="text-orange-400" size={24} />}
                        {lesson.type === 'carreta' && <Bike className="text-purple-400" size={24} />}
                        <div className="flex-1">
                          <p className="font-bold text-white uppercase">{typeNames[lesson.type] || lesson.type}</p>
                          <p className="text-sm text-[#9ca3af]">{lesson.instructor_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#9ca3af] uppercase">
                          {new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </p>
                        <p className="font-medium text-white">{new Date(lesson.date).toLocaleDateString('pt-BR')}</p>
                        <p className="text-sm text-[#fbbf24] font-bold">{lesson.time} - {getPeriodOfDay(lesson.time)}</p>
                      </div>
                    </div>

                    {/* Botões de compartilhar e copiar */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                        onClick={() => handleShareWhatsApp(lesson)}
                      >
                        <Share2 size={14} className="mr-1" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white"
                        onClick={() => handleCopyInfo(lesson)}
                      >
                        {copiedId === lesson.id ? (
                          <>
                            <CheckCircle size={14} className="mr-1" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={14} className="mr-1" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Local da aula */}
                    {loc && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="text-[#fbbf24]" size={14} />
                          <span className="font-semibold text-xs text-white uppercase">ENDEREÇO AULA {typeNames[lesson.type]}</span>
                        </div>
                        <p className="text-[#e6edf3] text-xs mb-2">{loc.address || 'Endereço não definido'}</p>
                        
                        {typeof loc.lat === 'number' && typeof loc.lng === 'number' && (
                          <div className="rounded-lg overflow-hidden border border-[#374151]">
                            <iframe
                              width="100%"
                              height="250"
                              frameBorder="0"
                              style={{ border: 0 }}
                              src={`https://www.google.com/maps?q=${loc.lat},${loc.lng}&output=embed&z=15&gestureHandling=greedy`}
                              allowFullScreen
                              loading="lazy"
                              title={`Mapa ${typeNames[lesson.type]}`}
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
            <div className="text-center py-6 text-[#9ca3af]">
              <Calendar className="mx-auto mb-2" size={32} />
              <p>Nenhuma aula agendada</p>
              {student.payment_status === 'pago' ? (
                <Link to={createPageUrl('MyLessons')}>
                  <Button variant="link" className="text-[#fbbf24]">Agendar agora</Button>
                </Link>
              ) : (
                <p className="text-sm text-orange-400 mt-2">Complete o pagamento para agendar aulas</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to={createPageUrl('Instructors')}>
          <Card className="bg-[#1a2332] border-[#374151] hover:border-[#3b82f6] transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Users className="text-[#3b82f6]" size={32} />
              <div>
                <h3 className="font-bold text-white">Instrutores</h3>
                <p className="text-sm text-white">Conheça nossos instrutores</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Simulados')}>
          <Card className="bg-[#1a2332] border-[#374151] hover:border-[#fbbf24] transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <BookOpen className="text-[#fbbf24]" size={32} />
              <div>
                <h3 className="font-bold text-white">Simulados</h3>
                <p className="text-sm text-white">Pratique para a prova</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Chat')}>
          <Card className="bg-[#1a2332] border-[#374151] hover:border-green-500 transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <MessageSquare className="text-green-500" size={32} />
              <div>
                <h3 className="font-bold text-white">Chat</h3>
                <p className="text-sm text-white">Fale com a autoescola</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Mapa da Prova - só aparece se completou as aulas */}
      {student.all_lessons_completed && student.admin_confirmed && settings?.practical_test_location && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <MapPin className="text-[#fbbf24]" />
              Local da Prova Prática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white mb-4">{settings.practical_test_location.address}</p>
            <a 
              href={settings.detran_url || 'https://goias.gov.br/detran/agendamento-detran/'} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button className="bg-[#fbbf24] text-black hover:bg-[#fbbf24]/80">
                Agendar Prova no Detran
                <ArrowRight className="ml-2" />
              </Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MessageSquare({ className, size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}