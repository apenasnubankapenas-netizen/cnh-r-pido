import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Users, 
  Calendar, 
  Car,
  Bike,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InstructorSchedule from "../components/instructor/InstructorSchedule";
import { useUserPermissions } from '../components/useUserPermissions';

export default function AdminInstructorDashboard() {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  
  const { user, metadata, isInstructor } = useUserPermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInstructor()) {
      navigate(createPageUrl('AdminDashboard'));
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [studentsData, lessonsData, settingsData] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.Lesson.list(),
        base44.entities.AppSettings.list()
      ]);
      
      setStudents(studentsData);
      setLessons(lessonsData.filter(l => !l.trial && l.instructor_id === metadata.instructor?.id));
      setSettings(settingsData[0] || {});
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metadata.instructor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  const instructor = metadata.instructor;
  const myLessons = lessons.filter(l => l.instructor_id === instructor.id);
  const todayLessons = myLessons.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.date === today;
  });

  const completedLessons = myLessons.filter(l => l.status === 'realizada');
  const carLessons = completedLessons.filter(l => l.type === 'carro');
  const motoLessons = completedLessons.filter(l => l.type === 'moto');

  const carCommission = settings.instructor_car_commission || 12;
  const motoCommission = settings.instructor_moto_commission || 7;
  
  const totalEarnings = (carLessons.length * carCommission) + (motoLessons.length * motoCommission);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard do Instrutor</h1>
          <p className="text-[#9ca3af] text-sm mt-1">Bem-vindo, {instructor.full_name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-xs">Aulas Hoje</p>
                <p className="text-2xl font-bold text-[#fbbf24]">{todayLessons.length}</p>
              </div>
              <Calendar className="text-[#fbbf24]" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-xs">Aulas Realizadas</p>
                <p className="text-2xl font-bold text-green-400">{completedLessons.length}</p>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-xs">Ganhos Totais</p>
                <p className="text-2xl font-bold text-[#fbbf24]">R$ {totalEarnings.toFixed(2)}</p>
              </div>
              <TrendingUp className="text-[#fbbf24]" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-xs">Total Alunos</p>
                <p className="text-2xl font-bold text-[#3b82f6]">{students.length}</p>
              </div>
              <Users className="text-[#3b82f6]" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento de Ganhos */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="text-[#3b82f6]" />
              Aulas de Carro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Aulas Realizadas:</span>
                <span className="font-bold text-white">{carLessons.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Comissão por aula:</span>
                <span className="font-bold text-white">R$ {carCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#374151]">
                <span className="text-white font-semibold">Total:</span>
                <span className="font-bold text-green-400">R$ {(carLessons.length * carCommission).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bike className="text-[#fbbf24]" />
              Aulas de Moto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Aulas Realizadas:</span>
                <span className="font-bold text-white">{motoLessons.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Comissão por aula:</span>
                <span className="font-bold text-white">R$ {motoCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#374151]">
                <span className="text-white font-semibold">Total:</span>
                <span className="font-bold text-yellow-400">R$ {(motoLessons.length * motoCommission).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aulas de Hoje */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="text-[#fbbf24]" />
            Minhas Aulas Hoje
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
                      <p className="text-xs text-[#9ca3af]">
                        {lesson.type === 'carro' ? '🚗 Carro' : '🏍️ Moto'}
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
            <div className="text-center py-8 text-[#9ca3af]">
              <Calendar className="mx-auto mb-2 text-[#fbbf24]" size={32} />
              <p>Nenhuma aula agendada para hoje</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agenda - Próximos 14 dias */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="text-[#3b82f6]" />
            Minha Agenda - Próximos 14 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InstructorSchedule instructorId={instructor.id} />
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to={createPageUrl('AdminStudents')}>
          <Card className="bg-[#1a2332] border-[#374151] hover:border-[#3b82f6] transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Users className="text-[#3b82f6]" size={32} />
                <div>
                  <h3 className="font-bold text-white">Ver Alunos</h3>
                  <p className="text-sm text-[#9ca3af]">{students.length} cadastrados</p>
                </div>
              </div>
              <ArrowRight className="text-[#9ca3af]" size={20} />
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('AdminLessons')}>
          <Card className="bg-[#1a2332] border-[#374151] hover:border-[#fbbf24] transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="text-[#fbbf24]" size={32} />
                <div>
                  <h3 className="font-bold text-white">Minhas Aulas</h3>
                  <p className="text-sm text-[#9ca3af]">{myLessons.length} aulas</p>
                </div>
              </div>
              <ArrowRight className="text-[#9ca3af]" size={20} />
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Instructors')}>
          <Card className="bg-[#1a2332] border-[#374151] hover:border-[#fbbf24] transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Car className="text-[#fbbf24]" size={32} />
                <div>
                  <h3 className="font-bold text-white">Ver Instrutores</h3>
                  <p className="text-sm text-[#9ca3af]">Perfis públicos</p>
                </div>
              </div>
              <ArrowRight className="text-[#9ca3af]" size={20} />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}