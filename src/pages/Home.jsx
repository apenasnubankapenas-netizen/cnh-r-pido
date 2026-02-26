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
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isInstructor, setIsInstructor] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

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
              <p className="text-[#9ca3af]">Você pode se cadastrar como aluno com a senha de acesso, ou voltar ao painel.</p>
              <div className="flex gap-2">
                <Button className="flex-1 bg-[#fbbf24] text-black hover:bg-[#d4aa00]" onClick={() => setShowPasswordModal(true)}>
                  Cadastrar como Aluno
                </Button>
                <Link to={createPageUrl('AdminDashboard')} className="flex-1">
                  <Button className="w-full bg-[#1e40af] hover:bg-[#3b82f6]">Ir para o Painel</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Password Modal */}
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="bg-[#1a2332] border-2 border-[#fbbf24] w-full max-w-md">
                <CardHeader className="border-b border-[#374151]">
                  <div className="flex items-center gap-2">
                    <Lock className="text-[#fbbf24]" size={20} />
                    <CardTitle className="text-[#fbbf24]">Senha de Acesso</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (password === 'KALABASTRO') {
                      navigate(createPageUrl('StudentRegister'));
                    } else {
                      setPasswordError(true);
                      setPassword('');
                    }
                  }} className="space-y-4">
                    <div>
                      <Label className="text-sm text-[#9ca3af]">Digite a senha para continuar</Label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError(false);
                        }}
                        placeholder="••••••••"
                        className={`bg-[#111827] border-[#374151] text-white text-center text-lg tracking-widest mt-2 ${
                          passwordError ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        autoFocus
                      />
                      {passwordError && (
                        <p className="text-red-400 text-xs mt-2 text-center">Senha incorreta</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full bg-[#fbbf24] text-black hover:bg-[#d4aa00]">
                      Confirmar
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full border-[#374151]"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPassword('');
                        setPasswordError(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-6">
        <div className="text-center mb-6 sm:mb-8 pt-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
            Bem-vindo à <span className="text-[#fbbf24]">CNH PARA TODOS</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#9ca3af] italic px-4">"Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento" - Provérbios 3:5</p>
        </div>

        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#fbbf24] flex items-center gap-2 text-base sm:text-lg">
              <Car size={20} />
              Cadastro de Aluno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={createPageUrl('StudentRegister')}>
              <Button className="w-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 text-white py-5 sm:py-6 text-base sm:text-lg min-h-[56px] active:scale-[0.98]">
                Fazer Cadastro
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 sm:mt-8">
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Bike className="text-[#fbbf24]" size={20} />
              </div>
              <h3 className="font-bold text-[#fbbf24] text-sm sm:text-base">Categoria A</h3>

            </CardContent>
          </Card>
          
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Car className="text-[#fbbf24]" size={20} />
              </div>
              <h3 className="font-bold text-[#fbbf24] text-sm sm:text-base">Categoria B</h3>

            </CardContent>
          </Card>
          
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1e40af]/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <div className="flex gap-1">
                  <Bike className="text-[#fbbf24]" size={16} />
                  <Car className="text-[#fbbf24]" size={16} />
                </div>
              </div>
              <h3 className="font-bold text-[#fbbf24] text-sm sm:text-base">Categoria AB</h3>

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
    <div className="max-w-6xl mx-auto space-y-4 px-3 sm:px-4 pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Olá, <span className="text-[#fbbf24]">{student.full_name?.split(' ')[0]}</span>!
          </h1>
          <p className="text-[#9ca3af] text-xs sm:text-sm">RENACH: {student.renach}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {student.payment_status === 'pago' ? (
            <Link to={createPageUrl('MyLessons')} className="w-full md:w-auto">
              <Button className="w-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 min-h-[48px]">
                <Calendar className="mr-2" size={18} />
                Agendar Aula
              </Button>
            </Link>
          ) : (
            <Button 
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 cursor-not-allowed min-h-[48px]"
              disabled
            >
              <Calendar className="mr-2" size={18} />
              Pagamento Pendente
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-white text-[10px] sm:text-xs">Progresso</p>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1e40af]/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-[#3b82f6]" size={18} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#fbbf24]">{progressPercentage()}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-white text-[10px] sm:text-xs">Aulas Carro</p>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1e40af]/20 rounded-full flex items-center justify-center">
                  <Car className="text-[#3b82f6]" size={18} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">{student.completed_car_lessons || 0}/{student.total_car_lessons || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-white text-[10px] sm:text-xs">Aulas Moto</p>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1e40af]/20 rounded-full flex items-center justify-center">
                  <Bike className="text-[#3b82f6]" size={18} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">{student.completed_moto_lessons || 0}/{student.total_moto_lessons || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-white text-[10px] sm:text-xs">Categoria</p>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#fbbf24]/20 rounded-full flex items-center justify-center">
                  <CreditCard className="text-[#fbbf24]" size={18} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#fbbf24]">{student.category || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Aulas */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="text-[#fbbf24]" size={20} />
            Histórico de Aulas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.payment_status === 'pago' && upcomingLessons.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 -mr-1">
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
                  <div key={lesson.id} className={`p-3 sm:p-4 bg-white/5 backdrop-blur-md rounded-lg border ${
                    lesson.status === 'realizada' ? 'border-green-500' : 
                    lesson.status === 'falta' ? 'border-red-500' : 
                    'border-white/10'
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        {lesson.type === 'carro' && <Car className="text-[#3b82f6]" size={20} />}
                        {lesson.type === 'moto' && <Bike className="text-[#fbbf24]" size={20} />}
                        {lesson.type === 'onibus' && <Bike className="text-green-400" size={20} />}
                        {lesson.type === 'caminhao' && <Bike className="text-orange-400" size={20} />}
                        {lesson.type === 'carreta' && <Bike className="text-purple-400" size={20} />}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white uppercase text-sm sm:text-base truncate">{typeNames[lesson.type] || lesson.type}</p>
                          <p className="text-xs sm:text-sm text-[#9ca3af] truncate">{lesson.instructor_name}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-xs text-[#9ca3af] uppercase">
                          {new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </p>
                        <p className="font-medium text-white text-sm">{new Date(lesson.date).toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs sm:text-sm text-[#fbbf24] font-bold">{lesson.time} - {getPeriodOfDay(lesson.time)}</p>
                      </div>
                    </div>

                    {/* Botões de compartilhar e copiar */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white min-h-[44px] text-xs"
                        onClick={() => handleShareWhatsApp(lesson)}
                      >
                        <Share2 size={14} className="mr-1" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 min-h-[44px] text-xs"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to={createPageUrl('Instructors')} className="block">
          <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-[0.98]">
            <CardContent className="p-4 flex items-center gap-3 min-h-[72px]">
              <div className="w-12 h-12 bg-[#3b82f6]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="text-[#3b82f6]" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">Instrutores</h3>
                <p className="text-xs sm:text-sm text-[#9ca3af]">Conheça nossos instrutores</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Simulados')} className="block">
          <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-[0.98]">
            <CardContent className="p-4 flex items-center gap-3 min-h-[72px]">
              <div className="w-12 h-12 bg-[#fbbf24]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="text-[#fbbf24]" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">Simulados</h3>
                <p className="text-xs sm:text-sm text-[#9ca3af]">Pratique para a prova</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Chat')} className="block">
          <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-[0.98]">
            <CardContent className="p-4 flex items-center gap-3 min-h-[72px]">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="text-green-500" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">Chat</h3>
                <p className="text-xs sm:text-sm text-[#9ca3af]">Fale com a autoescola</p>
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