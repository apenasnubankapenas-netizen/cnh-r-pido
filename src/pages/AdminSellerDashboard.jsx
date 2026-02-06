import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Users, 
  Calendar, 
  MessageSquare,
  TrendingUp,
  UserPlus,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserPermissions } from '../components/useUserPermissions';

export default function AdminSellerDashboard() {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  
  const { user, metadata, isSeller } = useUserPermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSeller()) {
      navigate(createPageUrl('AdminDashboard'));
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [studentsData, lessonsData, conversationsData, settingsData] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.Lesson.list(),
        base44.entities.Conversation.filter({ seller_email: user?.email }),
        base44.entities.AppSettings.list()
      ]);
      
      setStudents(studentsData);
      setLessons(lessonsData.filter(l => !l.trial));
      setConversations(conversationsData);
      setSettings(settingsData[0] || {});
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metadata.seller) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  const seller = metadata.seller;
  const todayLessons = lessons.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.date === today;
  });

  const unreadConversations = conversations.filter(c => c.unread_count > 0);
  const cashbackAmount = settings.seller_cashback_amount || 10;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard do Colaborador</h1>
          <p className="text-[#9ca3af] text-sm mt-1">Bem-vindo, {seller.full_name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-xs">Total de Alunos</p>
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
                <p className="text-[#9ca3af] text-xs">Minhas Indicações</p>
                <p className="text-2xl font-bold text-green-400">{seller.total_referrals || 0}</p>
              </div>
              <UserPlus className="text-green-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-xs">Cashback Acumulado</p>
                <p className="text-2xl font-bold text-[#fbbf24]">R$ {(seller.cashback_balance || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="text-[#fbbf24]" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info sobre Cashback */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-400">
            <TrendingUp />
            Sistema de Cashback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white mb-2">
            Você recebe <span className="font-bold text-green-400">R$ {cashbackAmount.toFixed(2)}</span> por cada novo aluno cadastrado com seu código de indicação.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge className="bg-green-500/20 text-green-400">
              {seller.total_referrals || 0} indicações feitas
            </Badge>
            <Badge className="bg-[#fbbf24]/20 text-[#fbbf24]">
              R$ {(seller.cashback_balance || 0).toFixed(2)} disponível
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Conversas Pendentes */}
      {unreadConversations.length > 0 && (
        <Card className="bg-[#1a2332] border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
              <MessageSquare />
              Conversas Pendentes ({unreadConversations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unreadConversations.slice(0, 5).map((conv) => (
                <Link 
                  key={conv.id} 
                  to={createPageUrl('AdminChats')}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#374151] hover:border-yellow-500 transition-all">
                    <div>
                      <p className="font-medium text-white">{conv.student_name}</p>
                      <p className="text-xs text-[#9ca3af] truncate max-w-[300px]">{conv.last_message}</p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      {conv.unread_count} nova{conv.unread_count > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to={createPageUrl('AdminStudents')}>
          <Card className="bg-[#1a2332] border-[#374151] hover:border-[#3b82f6] transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Users className="text-[#3b82f6]" size={32} />
                <div>
                  <h3 className="font-bold text-white">Gerenciar Alunos</h3>
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
                  <h3 className="font-bold text-white">Ver Aulas</h3>
                  <p className="text-sm text-[#9ca3af]">{lessons.length} aulas</p>
                </div>
              </div>
              <ArrowRight className="text-[#9ca3af]" size={20} />
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('AdminChats')}>
          <Card className="bg-[#1a2332] border-[#374151] hover:border-[#fbbf24] transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MessageSquare className="text-[#fbbf24]" size={32} />
                <div>
                  <h3 className="font-bold text-white">Conversas</h3>
                  <p className="text-sm text-[#9ca3af]">{unreadConversations.length} não lidas</p>
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