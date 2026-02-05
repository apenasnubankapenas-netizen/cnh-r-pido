import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, MessageSquare, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StudentSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
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
      }

      const allSellers = await base44.entities.Seller.filter({ active: true });
      setSellers(allSellers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (seller) => {
    if (!student) {
      alert('Erro: informações do aluno não encontradas.');
      return;
    }

    try {
      // Verificar se já existe conversa com este vendedor
      const existingConversations = await base44.entities.Conversation.filter({
        student_id: student.id,
        seller_email: seller.email
      });

      if (existingConversations.length > 0) {
        // Redirecionar para conversa existente
        navigate(createPageUrl('Chat'));
      } else {
        // Criar nova conversa
        await base44.entities.Conversation.create({
          student_id: student.id,
          student_name: student.full_name,
          student_email: student.user_email,
          seller_email: seller.email,
          seller_name: seller.full_name,
          last_message: '',
          unread_count: 0,
          status: 'aberta'
        });
        
        navigate(createPageUrl('Chat'));
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao iniciar conversa: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#fbbf24] animate-pulse">Carregando vendedores...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-[#fbbf24] flex items-center gap-2">
            <UserCog size={24} />
            Vendedores Disponíveis
          </CardTitle>
          <p className="text-sm text-[#9ca3af] mt-2">
            Entre em contato com nossos vendedores para tirar dúvidas ou obter suporte.
          </p>
        </CardHeader>
        <CardContent>
          {sellers.length === 0 ? (
            <div className="text-center py-8 text-[#9ca3af]">
              Nenhum vendedor disponível no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sellers.map((seller) => (
                <div
                  key={seller.id}
                  className="p-4 bg-[#111827] rounded-lg border border-[#374151] hover:border-[#3b82f6] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#1e40af] flex items-center justify-center">
                        <UserCog className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{seller.full_name}</h3>
                        {seller.total_referrals > 0 && (
                          <div className="text-xs text-[#34d399]">
                            {seller.total_referrals} {seller.total_referrals === 1 ? 'aluno' : 'alunos'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {seller.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-[#9ca3af]" />
                        <span className="text-[#e6edf3]">{seller.email}</span>
                      </div>
                    )}
                    {seller.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-[#9ca3af]" />
                        <span className="text-[#e6edf3]">{seller.phone}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => startConversation(seller)}
                    className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold"
                  >
                    <MessageSquare size={18} className="mr-2" />
                    Iniciar Conversa
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}