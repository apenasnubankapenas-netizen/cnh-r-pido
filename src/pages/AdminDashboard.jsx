import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Car, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import InstructorSchedule from "../components/instructor/InstructorSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [payments, setPayments] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [currentInstructor, setCurrentInstructor] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [currentUser, studentsData, lessonsData, paymentsData, instructorsData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Student.list(),
        base44.entities.Lesson.list(),
        base44.entities.Payment.list(),
        base44.entities.Instructor.list()
      ]);
      
      setStudents(studentsData);
      setLessons((lessonsData || []).filter(l => !l.trial));
      setPayments(paymentsData);
      setInstructors(instructorsData);
      setUser(currentUser);
      if (currentUser?.role === 'admin') {
        const instr = instructorsData.find(i => i.user_email === currentUser.email);
        if (instr) {
          setIsInstructor(true);
          setCurrentInstructor(instr);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const todayLessons = lessons.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.date === today;
  });

  const pendingPayments = payments.filter(p => p.status === 'pendente');
  const totalRevenue = payments.filter(p => p.status === 'aprovado').reduce((acc, p) => acc + (p.amount || 0), 0);

  const studentsAwaitingConfirmation = students.filter(s => s.all_lessons_completed && !s.admin_confirmed);

  // Dados do instrutor logado
  const instructorLessons = (isInstructor && currentInstructor)
    ? lessons.filter(l => l.instructor_id === currentInstructor.id)
    : [];
  const instructorEarnings = isInstructor
    ? instructorLessons
        .filter(l => l.status === 'realizada')
        .reduce((acc, l) => acc + (l.type === 'carro' ? 12 : (l.type === 'moto' ? 7 : 0)), 0)
    : 0;

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.renach?.includes(searchTerm) ||
    s.cpf?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold text-white">Dashboard Administrativo</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs">Total Alunos</p>
                <p className="text-2xl font-bold text-[#fbbf24]">{students.length}</p>
              </div>
              <Users className="text-[#3b82f6]" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs">Aulas Hoje</p>
                <p className="text-2xl font-bold text-[#fbbf24]">{todayLessons.length}</p>
              </div>
              <Calendar className="text-[#fbbf24]" size={32} />
            </div>
          </CardContent>
        </Card>

        {!isInstructor && (
         <div className="contents">
            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs">Pagamentos Pendentes</p>
                    <p className="text-2xl font-bold text-[#fbbf24]">{pendingPayments.length}</p>
                  </div>
                  <AlertCircle className="text-orange-400" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs">Receita Total</p>
                    <p className="text-2xl font-bold text-[#fbbf24]">R$ {totalRevenue.toFixed(0)}</p>
                  </div>
                  <TrendingUp className="text-green-400" size={32} />
                </div>
              </CardContent>
            </Card>
          </div>
          )}

        {isInstructor && (
          <Card className="bg-[#1a2332] border-[#374151]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs">Seus Ganhos</p>
                  <p className="text-2xl font-bold text-[#fbbf24]">R$ {instructorEarnings.toFixed(0)}</p>
                </div>
                <Car className="text-green-400" size={32} />
              </div>
              <div className="mt-2 text-xs text-white">
                <span className="mr-3">Carro: R$ 12/aula</span>
                <span>Moto: R$ 7/aula</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alunos Aguardando Confirmação */}
      {studentsAwaitingConfirmation.length > 0 && (
        <Card className="bg-[#1a2332] border-[#fbbf24]/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#fbbf24]">
              <AlertCircle />
              Alunos Aguardando Confirmação ({studentsAwaitingConfirmation.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {studentsAwaitingConfirmation.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#374151]">
                  <div>
                    <p className="font-medium text-white">{student.full_name}</p>
                    <p className="text-xs text-white">RENACH: {student.renach}</p>
                  </div>
                  <Link to={createPageUrl('AdminStudents') + `?id=${student.id}`}>
                    <Button size="sm" className="bg-[#1e40af] hover:bg-[#3b82f6]">
                      Confirmar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca de Alunos */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Search className="text-[#fbbf24]" />
            Buscar Aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input 
            className="bg-[#111827] border-[#374151] mb-4"
            placeholder="Buscar por nome, RENACH ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {searchTerm && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredStudents.map((student) => (
                <Link 
                  key={student.id} 
                  to={createPageUrl('AdminStudents') + `?id=${student.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#374151] hover:border-[#3b82f6] transition-all">
                    <div>
                      <p className="font-medium text-white">{student.full_name}</p>
                      <p className="text-xs text-white">
                        RENACH: {student.renach} | Categoria: {student.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.exam_done && <CheckCircle className="text-green-500" size={16} />}
                      {student.theoretical_test_done && <CheckCircle className="text-blue-500" size={16} />}
                      {student.practical_test_done && <CheckCircle className="text-[#fbbf24]" size={16} />}
                    </div>
                  </div>
                </Link>
              ))}
              {filteredStudents.length === 0 && (
                <p className="text-center text-white py-4">Nenhum aluno encontrado</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aulas de Hoje */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Calendar className="text-[#fbbf24]" />
            Aulas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayLessons.length > 0 ? (
            <div className="space-y-2">
              {todayLessons.sort((a, b) => a.time.localeCompare(b.time)).map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#374151]">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[60px]">
                      <p className="font-bold text-[#fbbf24]">{lesson.time}</p>
                    </div>
                    <div>
                      <p className="font-medium text-white">{lesson.student_name}</p>
                      <p className="text-xs text-white">
                        {lesson.type === 'carro' ? '🚗' : '🏍️'} {lesson.instructor_name}
                      </p>
                    </div>
                  </div>
                  <Badge className={
                    lesson.status === 'agendada' ? 'bg-blue-500/20 text-blue-400' :
                    lesson.status === 'realizada' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }>
                    {lesson.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white">
              <Calendar className="mx-auto mb-2 text-[#fbbf24]" size={32} />
              <p>Nenhuma aula agendada para hoje</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isInstructor && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Calendar className="text-[#3b82f6]" />
              Mapa de Aulas (Próximos 14 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InstructorSchedule lessons={instructorLessons} />
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to={createPageUrl('AdminStudents')}>
          <Card className="bg-[#1a2332] border-[#374151] hover:border-[#3b82f6] transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Users className="text-[#3b82f6]" size={32} />
              <div>
                <h3 className="font-bold text-white">Gerenciar Alunos</h3>
                <p className="text-sm text-white">{students.length} alunos cadastrados</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('AdminLessons')}>
          <Card className="bg-[#1a2332] border-[#374151] hover:border-[#fbbf24] transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Calendar className="text-[#fbbf24]" size={32} />
              <div>
                <h3 className="font-bold text-white">Gerenciar Aulas</h3>
                <p className="text-sm text-white">{lessons.length} aulas registradas</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* BLOQUEIO: Link de pagamentos oculto para instrutores */}
        {!isInstructor && (
          <Link to={createPageUrl('AdminPayments')}>
            <Card className="bg-[#1a2332] border-[#374151] hover:border-green-500 transition-all cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <DollarSign className="text-green-500" size={32} />
                <div>
                  <h3 className="font-bold text-white">Pagamentos</h3>
                  <p className="text-sm text-white">{pendingPayments.length} pendentes</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}